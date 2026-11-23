const { getWeather } = require('../services/weatherService');
const { detectHazards } = require('../services/alertService');

async function getWeatherForCity(req, res, next) {
  try {
    const { city, days } = req.query;
    const result = await getWeather(city, days);
    const advisory = detectHazards({
      destination: city,
      weather: result.weather,
      forecast: result.forecast,
    });
    res.json({ ...result, advisory });
  } catch (error) {
    next(error);
  }
}

module.exports = { getWeatherForCity };
