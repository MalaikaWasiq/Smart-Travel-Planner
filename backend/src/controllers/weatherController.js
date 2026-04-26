const { getWeather } = require('../services/weatherService');

async function getWeatherForCity(req, res, next) {
  try {
    const { city, days } = req.query;
    const result = await getWeather(city, days);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getWeatherForCity };
