const { calculateBudget } = require('./services/budgetService');
const { getMenuForDestination, calculateActualFoodExpense } = require('./services/foodService');

console.log('====================================================');
console.log('🧪 RUNNING SMART TRAVEL PLANNER BUDGET AUDIT SUITE');
console.log('====================================================\n');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// TEST A: 20 persons, 5 days, budget 300,000, coaster (40,000/day)
console.log('--- TEST A: Transport Coaster 40k/day for 20 persons ---');
const testA = calculateBudget({
  budget: 300000,
  numberOfPersons: 20,
  days: 5,
  vehicleType: 'luxury-coaster',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  tripMode: 'customize'
});
console.log('Test A Result:', {
  transport: testA.transport,
  remaining: testA.remaining,
  totalEstimated: testA.totalEstimated
});
assert(testA.transport === 200000, 'Transport cost is exactly Rs. 200,000 (40,000 * 5)');
assert(testA.remaining === 100000, 'Remaining budget is exactly Rs. 100,000');
assert(testA.totalEstimated === 200000, 'Total actual expense is Rs. 200,000');

// TEST B & H: 20 persons, 5 days, 10 rooms @ 5,000/night
console.log('\n--- TEST B & H: 20 persons, 5 days, 10 rooms @ 5,000/night ---');
const testB = calculateBudget({
  budget: 1000000,
  numberOfPersons: 20,
  days: 5,
  vehicleType: 'luxury-coaster',
  hotelRequired: true,
  hotelPricePerNight: 5000,
  roomCapacity: 2,
  foodRequired: false,
  activitiesRequired: false,
  tripMode: 'customize'
});
console.log('Test B Result:', {
  transport: testB.transport,
  hotels: testB.hotels,
  roomsQuantity: testB.hotelDetails.roomsQuantity,
  nights: testB.hotelDetails.nights,
  remaining: testB.remaining
});
assert(testB.transport === 200000, 'Transport is Rs. 200,000');
assert(testB.hotelDetails.roomsQuantity === 10, 'Rooms calculated as 10 (20 persons / 2 capacity)');
assert(testB.hotels === 10 * 5000 * testB.hotelDetails.nights, 'Hotel cost correctly calculated from rooms * rate * nights');
assert(testB.remaining === 1000000 - 200000 - testB.hotels, 'Remaining budget correctly accounts for actual transport and hotel');

// TEST C: Vehicle exceeds budget -> calculate max affordable days
console.log('\n--- TEST C: Budget too low for vehicle ---');
const testC = calculateBudget({
  budget: 50000,
  numberOfPersons: 4,
  days: 10,
  vehicleType: 'luxury-coaster',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  tripMode: 'customize'
});
console.log('Test C Result:', {
  canAffordTransport: testC.canAffordTransport,
  maxAffordableDaysForVehicle: testC.maxAffordableDaysForVehicle
});
assert(!testC.canAffordTransport, 'Transport flagged as unaffordable');
assert(testC.maxAffordableDaysForVehicle === 1, 'Max affordable days is 1 (50,000 / 40,000)');

// TEST D: Food exceeds remaining budget -> shortfall flagged
console.log('\n--- TEST D: Food exceeds remaining budget ---');
const testD = calculateBudget({
  budget: 210000,
  numberOfPersons: 20,
  days: 5,
  vehicleType: 'luxury-coaster', // 200,000 -> remaining 10,000
  hotelRequired: false,
  foodRequired: true,
  destination: 'Hunza',
  selectedMeals: { breakfast: true, lunch: true, dinner: true },
  activitiesRequired: false,
  tripMode: 'customize'
});
console.log('Test D Result:', {
  transport: testD.transport,
  food: testD.food,
  foodBudgetShortfall: testD.foodBudgetShortfall,
  canAffordFood: testD.canAffordFood
});
assert(testD.foodBudgetShortfall > 0, 'Food shortfall is flagged');
assert(!testD.canAffordFood, 'canAffordFood is false');

// TEST F: City menu variations (Hunza vs Islamabad)
console.log('\n--- TEST F: City menu variations ---');
const hunzaMenu = getMenuForDestination('Hunza');
const isbMenu = getMenuForDestination('Islamabad');
console.log('Hunza breakfast item:', hunzaMenu.meals.breakfast.items[0]?.name);
console.log('Islamabad breakfast item:', isbMenu.meals.breakfast.items[0]?.name);
assert(hunzaMenu.cityName === 'Hunza Valley & Nagar', 'Hunza menu correctly loaded');
assert(isbMenu.cityName === 'Islamabad & Rawalpindi', 'Islamabad menu correctly loaded');
assert(hunzaMenu.meals.breakfast.averagePricePerPerson !== isbMenu.meals.breakfast.averagePricePerPerson || hunzaMenu.cuisineType !== isbMenu.cuisineType, 'Cuisines are distinct and authentic to region');

// GWADAR vs KARACHI VERIFICATION
const gwadarMenu = getMenuForDestination('Gwadar');
const karachiMenu = getMenuForDestination('Karachi');
console.log('Gwadar Menu City:', gwadarMenu.cityName, '| Breakfast:', gwadarMenu.meals.breakfast.items[0]?.name);
console.log('Karachi Menu City:', karachiMenu.cityName, '| Breakfast:', karachiMenu.meals.breakfast.items[0]?.name);
assert(gwadarMenu.cityName === 'Gwadar & Makran Coast', 'Gwadar has dedicated coastal Balochi menu');
assert(karachiMenu.cityName === 'Karachi', 'Karachi has dedicated street & coastal menu');
assert(gwadarMenu.cityKey !== karachiMenu.cityKey, 'Gwadar and Karachi have distinct city keys');

// TEST G: Bonfire experience adds exactly Rs. 20,000
console.log('\n--- TEST G: Bonfire experience Rs. 20,000 ---');
const testG1 = calculateBudget({
  budget: 500000,
  numberOfPersons: 4,
  days: 3,
  vehicleType: 'sedan-corolla',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  optionalActivities: [{ id: 'opt_bonfire', name: 'Bonfire Night', price: 20000, selected: true }],
  tripMode: 'customize'
});
const testG0 = calculateBudget({
  budget: 500000,
  numberOfPersons: 4,
  days: 3,
  vehicleType: 'sedan-corolla',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  optionalActivities: [],
  tripMode: 'customize'
});
console.log('Test G Result:', {
  withBonfire: testG1.optionalExperiences,
  withoutBonfire: testG0.optionalExperiences,
  diff: testG1.totalEstimated - testG0.totalEstimated
});
assert(testG1.optionalExperiences === 20000, 'Bonfire costs Rs. 20,000');
assert(testG0.optionalExperiences === 0, 'Without bonfire costs Rs. 0');
assert(testG1.totalEstimated - testG0.totalEstimated === 20000, 'Difference in total expenses is exactly Rs. 20,000');

// TEST I: Skipped services = Rs. 0
console.log('\n--- TEST I: Skipped services cost Rs. 0 ---');
const testI = calculateBudget({
  budget: 500000,
  numberOfPersons: 4,
  days: 3,
  vehicleType: 'sedan-corolla',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  tripMode: 'customize'
});
assert(testI.hotels === 0, 'Hotel cost is 0 when hotelRequired=false');
assert(testI.food === 0, 'Food cost is 0 when foodRequired=false');
assert(testI.activities === 0, 'Activities cost is 0 when activitiesRequired=false');

// TEST J: Company tour 10% profit & 5% contingency
console.log('\n--- TEST J: Company Tour Profit & Contingency ---');
const testJCompany = calculateBudget({
  budget: 200000,
  numberOfPersons: 4,
  days: 3,
  vehicleType: 'sedan-corolla',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  tripMode: 'company'
});
const testJCustom = calculateBudget({
  budget: 200000,
  numberOfPersons: 4,
  days: 3,
  vehicleType: 'sedan-corolla',
  hotelRequired: false,
  foodRequired: false,
  activitiesRequired: false,
  tripMode: 'customize'
});
console.log('Company Mode:', {
  profit: testJCompany.companyProfit,
  contingency: testJCompany.safetyMargin
});
console.log('Customize Mode:', {
  profit: testJCustom.companyProfit,
  contingency: testJCustom.safetyMargin
});
assert(testJCompany.companyProfit === 20000, 'Company profit is 10% of 200,000 = 20,000');
assert(testJCompany.safetyMargin === 10000, 'Company contingency is 5% of 200,000 = 10,000');
assert(testJCustom.companyProfit === 0, 'Custom trip has 0 company profit');
assert(testJCustom.safetyMargin === 0, 'Custom trip has 0 contingency');

console.log('\n====================================================');
console.log(`RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
console.log('====================================================\n');
process.exit(passedCount === totalCount ? 0 : 1);
