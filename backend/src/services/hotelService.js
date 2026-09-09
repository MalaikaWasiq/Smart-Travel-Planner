const hotels = require('../data/hotels.json');

const PRICE_DISCLAIMER = 'Curated planning estimate in PKR; verify live price and availability with the hotel.';

function normalizeCity(value) {
  return String(value || '').trim().toLowerCase();
}

function getHotelRecommendations({ city, budget, days = 1, limit = 5 }) {
  const normalizedCity = normalizeCity(city);
  const nights = Math.max(1, Number(days) - 1 || 1);
  const accommodationTarget = Math.max(0, Number(budget) || 0) * 0.35;

  const cityHotels = hotels
    .filter((hotel) => normalizeCity(hotel.city) === normalizedCity)
    .map((hotel) => ({
      ...hotel,
      nights,
      totalStayCost: hotel.pricePerNight * nights,
      withinTargetBudget: !accommodationTarget || hotel.pricePerNight * nights <= accommodationTarget,
      priceType: 'estimate',
      priceDisclaimer: PRICE_DISCLAIMER,
    }))
    .sort((left, right) => {
      if (left.withinTargetBudget !== right.withinTargetBudget) return left.withinTargetBudget ? -1 : 1;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return left.totalStayCost - right.totalStayCost;
    });
  const affordableHotels = cityHotels.filter((hotel) => hotel.withinTargetBudget);
  const eligibleHotels = affordableHotels.length ? affordableHotels : cityHotels;

  return eligibleHotels
    .slice(0, Math.min(Math.max(Number(limit) || 5, 1), 10));
}

function findHotelById(id) {
  return hotels.find((hotel) => hotel.id === id) || null;
}

module.exports = { getHotelRecommendations, findHotelById, PRICE_DISCLAIMER };
