param(
  [int]$Port = 5100,
  [string]$MongoUri = "",
  [string]$ExpectedModel = ""
)

$ErrorActionPreference = "Stop"

function Test-PortFree([int]$Candidate) {
  try { $null = Get-NetTCPConnection -LocalPort $Candidate -State Listen -ErrorAction Stop; return $false }
  catch { return $true }
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $repoRoot "backend"
if (-not (Test-Path -LiteralPath (Join-Path $backendDir ".env"))) { throw "Missing backend/.env" }

while (-not (Test-PortFree $Port)) { $Port++ }
$env:PORT = "$Port"
if ($MongoUri) { $env:LOCAL_MONGODB_URI = $MongoUri }
$stdoutLog = Join-Path $env:TEMP "smart-travel-test-80-$Port.out.log"
$stderrLog = Join-Path $env:TEMP "smart-travel-test-80-$Port.err.log"
$server = Start-Process -FilePath node -ArgumentList "src/server.js" -WorkingDirectory $backendDir -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog

try {
  $baseUrl = "http://localhost:$Port/api"
  $health = $null
  for ($attempt = 1; $attempt -le 60; $attempt++) {
    try { $health = Invoke-RestMethod -Method Get -Uri "$baseUrl/health"; break }
    catch { Start-Sleep -Seconds 1 }
  }
  if (-not $health.ok -or $health.database -ne "connected") {
    $serverOutput = if (Test-Path -LiteralPath $stdoutLog) { Get-Content -LiteralPath $stdoutLog -Raw } else { "" }
    $serverError = if (Test-Path -LiteralPath $stderrLog) { Get-Content -LiteralPath $stderrLog -Raw } else { "" }
    throw "Backend or MongoDB did not become ready. Server output: $serverOutput $serverError"
  }

  $stamp = Get-Date -Format "yyyyMMddHHmmssfff"
  $email = "codex_80_$stamp@example.com"
  $signup = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/signup" -ContentType "application/json" -Body (@{
    fullName = "Eighty Percent Test"; email = $email; password = "testpass123"
  } | ConvertTo-Json)
  $headers = @{ Authorization = "Bearer $($signup.token)" }

  $preferences = Invoke-RestMethod -Method Patch -Uri "$baseUrl/auth/me/preferences" -Headers $headers -ContentType "application/json" -Body (@{
    defaultBudget = 90000; interests = @("History", "Nature"); preferredHotelType = "Mid-range"
  } | ConvertTo-Json)
  if ($preferences.user.preferences.defaultBudget -ne 90000 -or $preferences.user.preferences.interests.Count -ne 2) { throw "Preference update failed" }
  $me = Invoke-RestMethod -Method Get -Uri "$baseUrl/auth/me" -Headers $headers
  if ($me.user.preferences.preferredHotelType -ne "Mid-range") { throw "Preferences were not persisted" }
  $profile = Invoke-RestMethod -Method Patch -Uri "$baseUrl/auth/me" -Headers $headers -ContentType "application/json" -Body (@{ fullName = 'Eighty Percent Verified' } | ConvertTo-Json)
  if ($profile.user.fullName -ne 'Eighty Percent Verified') { throw 'Profile update failed' }

  $hotels = Invoke-RestMethod -Method Get -Uri "$baseUrl/hotels?city=Lahore&budget=200000&days=3" -Headers $headers
  if ($hotels.hotels.Count -lt 2 -or $hotels.hotels[0].priceType -ne "estimate") { throw "Hotel recommendations failed" }

  $recommendations = Invoke-RestMethod -Method Post -Uri "$baseUrl/recommendations" -Headers $headers -ContentType "application/json" -Body (@{
    city = 'Lahore'; interests = @('Nature'); budget = 90000; weather = @{ main = 'Clear' }; topK = 2
    candidates = @(
      @{ id = 'museum'; title = 'City Museum'; summary = 'Indoor heritage collection' },
      @{ id = 'lake'; title = 'Mountain Lake'; summary = 'Scenic lake and hiking trail'; latitude = 35.1; longitude = 74.2 }
    )
  } | ConvertTo-Json -Depth 6)
  if ($recommendations.recommendations[0].id -ne 'lake') { throw 'Recommendation ranking failed' }
  if ($ExpectedModel -and $recommendations.modelVersion -ne $ExpectedModel) { throw "Expected ML model $ExpectedModel but got $($recommendations.modelVersion)" }

  $route = Invoke-RestMethod -Method Post -Uri "$baseUrl/routes" -Headers $headers -ContentType "application/json" -Body (@{
    destination = "Lahore"
    activities = @(
      @{ time = "9:00 AM"; place = "Lahore Fort"; latitude = 31.588; longitude = 74.315 },
      @{ time = "11:00 AM"; place = "Badshahi Mosque"; latitude = 31.5881; longitude = 74.3101 }
    )
  } | ConvertTo-Json -Depth 6)
  if ($route.route.status -eq "unavailable" -or $route.route.distanceMeters -le 0) { throw "Route calculation failed" }

  $budget = Invoke-RestMethod -Method Post -Uri "$baseUrl/budget/calculate" -Headers $headers -ContentType "application/json" -Body (@{
    budget = 200000; days = 3; hotelSuggestions = $hotels.hotels
    itinerary = @(@{ day = 1; activities = @(@{ type = "food"; estimatedCost = 1500 }, @{ type = "historic"; estimatedCost = 600 }) })
    route = @{ totalDistanceMeters = $route.route.distanceMeters }
  } | ConvertTo-Json -Depth 8)
  if ($budget.budgetBreakdown.totalEstimated -le 0) { throw "Budget calculation failed" }

  $interaction = Invoke-RestMethod -Method Post -Uri "$baseUrl/interactions" -Headers $headers -ContentType "application/json" -Body (@{
    eventType = "view"; itemType = "hotel"; itemId = $hotels.hotels[0].id
  } | ConvertTo-Json)
  if (-not $interaction.interaction._id) { throw "Interaction logging failed" }

  $generated = Invoke-RestMethod -Method Post -Uri "$baseUrl/trips/generate" -Headers $headers -ContentType "application/json" -Body (@{
    destination = "Lahore"; days = 2; budget = 200000; interests = @("History", "Food")
  } | ConvertTo-Json)
  $trip = $generated.trip
  if (-not $trip._id -or $trip.itinerary.Count -ne 2) { throw "Trip generation failed" }
  if ($trip.route.days.Count -ne 2) { throw "Generated trip routes are incomplete" }
  if ($trip.hotelSuggestions.Count -lt 2) { throw "Generated trip hotels are incomplete" }
  if ($trip.budgetBreakdown.totalEstimated -le 0) { throw "Generated trip budget is incomplete" }
  if (-not @('groq', 'fallback').Contains([string]$trip.itinerarySource)) { throw "Itinerary source was not recorded" }

  $regenerated = Invoke-RestMethod -Method Patch -Uri "$baseUrl/trips/$($trip._id)" -Headers $headers -ContentType "application/json" -Body (@{
    destination = 'Lahore'; days = 2; budget = 210000; interests = @('History', 'Nature')
  } | ConvertTo-Json)
  $trip = $regenerated.trip
  if ($trip.budget -ne 210000 -or $trip.itinerary.Count -ne 2 -or $trip.route.days.Count -ne 2) { throw "Full trip regeneration failed" }
  if ($ExpectedModel -and $trip.recommendationMetadata.modelVersion -ne $ExpectedModel) { throw 'Generated trip did not persist the expected recommendation model version' }

  $attractions = Invoke-RestMethod -Method Get -Uri "$baseUrl/attractions?city=Lahore&interests=History&limit=3" -Headers $headers
  if (-not $attractions.source) { throw "Attraction source endpoint failed" }

  $preview = Invoke-RestMethod -Method Post -Uri "$baseUrl/trips/$($trip._id)/change-preview" -Headers $headers -ContentType "application/json" -Body (@{
    day = 1; activityIndex = 0; replacement = @{ place = 'Free Heritage Walk'; type = 'history'; description = 'A lower-cost walking replacement.'; estimatedCost = 0 }
  } | ConvertTo-Json -Depth 6)
  if (-not $preview.proposal.itinerary -or -not $preview.proposal.route -or $preview.proposal.summary -notmatch 'Replace') { throw 'Preview-before-apply failed' }

  $editedItinerary = @($trip.itinerary | ForEach-Object {
    @{
      day = $_.day; title = $_.title; weatherNote = $_.weatherNote
      activities = @($_.activities | Select-Object -First ([Math]::Max(1, $_.activities.Count - 1)))
    }
  })
  $edited = Invoke-RestMethod -Method Patch -Uri "$baseUrl/trips/$($trip._id)/itinerary" -Headers $headers -ContentType "application/json" -Body (@{
    itinerary = $editedItinerary
  } | ConvertTo-Json -Depth 12)
  if ($edited.trip.itinerarySource -ne 'user-edited' -or $edited.trip.route.days.Count -ne 2) { throw "Itinerary editing failed" }

  $expenseAdded = Invoke-RestMethod -Method Post -Uri "$baseUrl/trips/$($trip._id)/expenses" -Headers $headers -ContentType "application/json" -Body (@{
    category = 'food'; amount = 1800; note = 'Smoke test lunch'; day = 1
  } | ConvertTo-Json)
  $expenseId = $expenseAdded.expense._id
  if (-not $expenseId -or $expenseAdded.trip.budgetBreakdown.actualSpent -ne 1800) { throw "Expense creation failed" }
  $expenseEdited = Invoke-RestMethod -Method Patch -Uri "$baseUrl/trips/$($trip._id)/expenses/$expenseId" -Headers $headers -ContentType "application/json" -Body (@{
    amount = 2100
  } | ConvertTo-Json)
  if ($expenseEdited.trip.budgetBreakdown.actualSpent -ne 2100) { throw "Expense update failed" }
  $largeExpense = Invoke-RestMethod -Method Post -Uri "$baseUrl/trips/$($trip._id)/expenses" -Headers $headers -ContentType "application/json" -Body (@{
    category = 'hotels'; amount = 220000; note = 'Alert threshold test'
  } | ConvertTo-Json)
  if (-not $largeExpense.trip.budgetBreakdown.actualExceeded) { throw 'Actual over-budget state failed' }
  $largeExpenseId = $largeExpense.expense._id
  $alerts = Invoke-RestMethod -Method Get -Uri "$baseUrl/alerts" -Headers $headers
  if (-not ($alerts.alerts | Where-Object { $_.type -eq 'budget' -and $_.active })) { throw 'Persistent budget alert was not created' }

  $chatCreated = Invoke-RestMethod -Method Post -Uri "$baseUrl/chat" -Headers $headers -ContentType "application/json" -Body (@{
    tripId = $trip._id
  } | ConvertTo-Json)
  $chat = Invoke-RestMethod -Method Post -Uri "$baseUrl/chat/$($chatCreated.session._id)/messages" -Headers $headers -ContentType "application/json" -Body (@{
    message = 'Summarize my trip history, current budget, recorded expenses, and active alerts.'
  } | ConvertTo-Json)
  if ($chat.session.messages.Count -ne 2 -or -not $chat.message.content -or $chat.message.suggestedActions.Count -lt 4) { throw "Account-context chatbot failed" }
  $chatDeleted = Invoke-RestMethod -Method Delete -Uri "$baseUrl/chat/$($chatCreated.session._id)" -Headers $headers
  if (-not $chatDeleted.ok) { throw "Chat cleanup failed" }

  $other = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/signup" -ContentType "application/json" -Body (@{
    fullName = 'Ownership Test'; email = "other_$stamp@example.com"; password = 'testpass123'
  } | ConvertTo-Json)
  $otherHeaders = @{ Authorization = "Bearer $($other.token)" }
  try {
    Invoke-RestMethod -Method Get -Uri "$baseUrl/trips/$($trip._id)" -Headers $otherHeaders | Out-Null
    throw 'Cross-user trip access was incorrectly allowed'
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -ne 404) { throw }
  }
  Invoke-RestMethod -Method Delete -Uri "$baseUrl/auth/me" -Headers $otherHeaders -ContentType 'application/json' -Body (@{ password = 'testpass123' } | ConvertTo-Json) | Out-Null

  $expenseDeleted = Invoke-RestMethod -Method Delete -Uri "$baseUrl/trips/$($trip._id)/expenses/$expenseId" -Headers $headers
  $largeDeleted = Invoke-RestMethod -Method Delete -Uri "$baseUrl/trips/$($trip._id)/expenses/$largeExpenseId" -Headers $headers
  if (-not $expenseDeleted.ok -or -not $largeDeleted.ok -or $largeDeleted.trip.budgetBreakdown.actualSpent -ne 0) { throw "Expense cleanup failed" }

  $selected = Invoke-RestMethod -Method Patch -Uri "$baseUrl/trips/$($trip._id)/hotel" -Headers $headers -ContentType "application/json" -Body (@{
    hotelId = $trip.hotelSuggestions[0].id
  } | ConvertTo-Json)
  if ($selected.trip.selectedHotel.id -ne $trip.hotelSuggestions[0].id) { throw "Hotel selection was not persisted" }

  $saved = Invoke-RestMethod -Method Get -Uri "$baseUrl/trips/$($trip._id)" -Headers $headers
  if ($saved.trip.selectedHotel.id -ne $trip.hotelSuggestions[0].id) { throw "Saved trip did not retain selected hotel" }
  $export = Invoke-RestMethod -Method Get -Uri "$baseUrl/auth/me/export" -Headers $headers
  if (-not $export.user -or $export.trips.Count -lt 1) { throw 'User data export failed' }
  $deleted = Invoke-RestMethod -Method Delete -Uri "$baseUrl/trips/$($trip._id)" -Headers $headers
  if (-not $deleted.ok) { throw "Trip cleanup failed" }
  $accountDeleted = Invoke-RestMethod -Method Delete -Uri "$baseUrl/auth/me" -Headers $headers -ContentType 'application/json' -Body (@{ password = 'testpass123' } | ConvertTo-Json)
  if (-not $accountDeleted.ok) { throw 'Account data deletion failed' }

  Write-Host "80% end-to-end smoke test passed on port $Port" -ForegroundColor Green
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}
