function round(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function calculateBudget({ budget, days, itinerary = [], route, selectedHotel, hotelSuggestions = [], expenses = [] }) {
  const normalizedBudget = round(budget);
  const normalizedDays = Math.max(1, Number(days) || 1);
  const hotel = selectedHotel || hotelSuggestions[0];
  const hotels = hotel ? round(hotel.totalStayCost || hotel.pricePerNight * Math.max(1, normalizedDays - 1)) : 0;
  let food = 0;
  let activities = 0;

  for (const day of itinerary) {
    for (const activity of day.activities || []) {
      if (String(activity.type).toLowerCase() === 'food') food += round(activity.estimatedCost);
      else activities += round(activity.estimatedCost);
    }
  }

  if (!food) food = normalizedDays * 2500;
  const routeKm = Math.max(0, Number(route?.totalDistanceMeters || 0) / 1000);
  const transport = round(routeKm ? routeKm * 80 + normalizedDays * 300 : normalizedDays * 1200);
  const misc = round((hotels + food + transport + activities) * 0.08);
  const totalEstimated = hotels + food + transport + activities + misc;
  const remaining = normalizedBudget - totalEstimated;
  const actualSpent = expenses.reduce((sum, expense) => sum + round(expense.amount), 0);
  const actualRemaining = normalizedBudget - actualSpent;

  return {
    hotels,
    food,
    transport,
    activities,
    misc,
    totalEstimated,
    remaining,
    percentUsed: normalizedBudget ? Math.round((totalEstimated / normalizedBudget) * 100) : 0,
    exceeded: remaining < 0,
    overBy: Math.max(0, -remaining),
    currency: 'PKR',
    note: 'Planning estimate based on itinerary activities, route distance, and the selected or top hotel suggestion.',
    actualSpent,
    actualRemaining,
    actualPercentUsed: normalizedBudget ? Math.round((actualSpent / normalizedBudget) * 100) : 0,
    actualExceeded: actualRemaining < 0,
    actualOverBy: Math.max(0, -actualRemaining),
  };
}

module.exports = { calculateBudget };
