const express = require('express');

const { getWeatherForCity } = require('../controllers/weatherController');

const router = express.Router();

router.get('/', getWeatherForCity);

module.exports = router;
