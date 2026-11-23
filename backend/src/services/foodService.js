const cityFoodMenus = require('../data/cityFoodMenus.json');

/**
 * Normalizes city/destination query to find the best matching regional menu
 */
function getMenuForDestination(destinationName) {
  const query = String(destinationName || '').toLowerCase().trim();
  if (!query) {
    return cityFoodMenus[0]; // Default: Islamabad
  }

  // 1. Exact match on cityKey
  const exactKey = cityFoodMenus.find((m) => m.cityKey.toLowerCase() === query);
  if (exactKey) return exactKey;

  // 2. Exact match on any alias
  const exactAlias = cityFoodMenus.find(
    (m) => m.aliases && m.aliases.some((alias) => alias.toLowerCase() === query)
  );
  if (exactAlias) return exactAlias;

  // 3. Word token or substring match
  for (const menu of cityFoodMenus) {
    if (
      query.includes(menu.cityKey.toLowerCase()) ||
      (menu.aliases && menu.aliases.some((alias) => query.includes(alias.toLowerCase())))
    ) {
      return menu;
    }
  }

  // 4. CityName includes query or vice versa
  for (const menu of cityFoodMenus) {
    if (menu.cityName.toLowerCase().includes(query) || query.includes(menu.cityName.toLowerCase())) {
      return menu;
    }
  }

  return cityFoodMenus[0];
}

/**
 * Calculates actual food expense based on city menu, selected meals, and selected items
 */
function calculateActualFoodExpense({
  destination,
  numberOfPersons = 1,
  days = 1,
  foodRequired = true,
  foodChoice = 'included', // 'included' | 'self'
  selectedMeals = { breakfast: true, lunch: false, dinner: true },
  selectedFoodItems = {}, // { breakfast: ['isb_b_1'], lunch: [], dinner: ['isb_d_1'] }
}) {
  const persons = Math.max(1, Number(numberOfPersons) || 1);
  const numDays = Math.max(1, Number(days) || 1);

  if (!foodRequired || foodChoice === 'self') {
    return {
      totalCost: 0,
      dailyCostPerPerson: 0,
      isSelfManaged: true,
      breakdown: {
        breakfast: { included: false, cost: 0, items: [], note: 'Self-Arranged (Rs. 0)' },
        lunch: { included: false, cost: 0, items: [], note: 'Self-Arranged (Rs. 0)' },
        dinner: { included: false, cost: 0, items: [], note: 'Self-Arranged (Rs. 0)' },
      },
    };
  }

  const menu = getMenuForDestination(destination);
  const breakdown = {};
  let totalCost = 0;

  ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
    const isSelected = Boolean(selectedMeals?.[mealType]);
    if (!isSelected) {
      breakdown[mealType] = {
        included: false,
        cost: 0,
        items: [],
        note: 'Not Selected / Self-Arranged (Rs. 0)',
      };
      return;
    }

    const mealConfig = menu.meals[mealType];
    const itemIds = Array.isArray(selectedFoodItems?.[mealType]) ? selectedFoodItems[mealType] : [];

    let mealCostPerPersonPerDay = 0;
    let chosenItems = [];

    if (itemIds.length > 0) {
      // Calculate from explicitly selected items
      mealConfig.items.forEach((item) => {
        if (itemIds.includes(item.id)) {
          mealCostPerPersonPerDay += item.price;
          chosenItems.push(item);
        }
      });
    }

    // If no specific item selected or sum is 0, use the meal's standard average price
    if (mealCostPerPersonPerDay === 0) {
      mealCostPerPersonPerDay = mealConfig.averagePricePerPerson;
      chosenItems = mealConfig.items.filter((item) => item.isSignature || mealConfig.items.indexOf(item) === 0);
    }

    const mealTotal = Math.round(mealCostPerPersonPerDay * persons * numDays);
    totalCost += mealTotal;

    breakdown[mealType] = {
      included: true,
      cost: mealTotal,
      costPerPersonPerDay: mealCostPerPersonPerDay,
      title: mealConfig.title,
      items: chosenItems,
      note: `${chosenItems.map((i) => i.name).join(', ')} (Rs. ${mealCostPerPersonPerDay.toLocaleString()}/person/day)`,
    };
  });

  return {
    totalCost,
    dailyCostPerPerson: Math.round(totalCost / (persons * numDays)),
    isSelfManaged: false,
    cityName: menu.cityName,
    menuTitle: `${menu.cityName} Regional Menu`,
    breakdown,
  };
}

module.exports = {
  getMenuForDestination,
  calculateActualFoodExpense,
};
