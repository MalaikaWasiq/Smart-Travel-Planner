const getFetch = require('../utils/fetch');

const fallbackWeatherByCity = {
  lahore: { temp: 34, feelsLike: 37, humidity: 55, wind: 3.2, description: 'hazy sunshine', main: 'Haze' },
  islamabad: { temp: 26, feelsLike: 25, humidity: 60, wind: 4.1, description: 'partly cloudy', main: 'Clouds' },
  karachi: { temp: 32, feelsLike: 36, humidity: 70, wind: 5.5, description: 'humid and hot', main: 'Clear' },
  hunza: { temp: 14, feelsLike: 11, humidity: 45, wind: 2.8, description: 'clear and cold', main: 'Clear' },
  skardu: { temp: 8, feelsLike: 5, humidity: 40, wind: 3.0, description: 'cold and clear', main: 'Clear' },
  murree: { temp: 18, feelsLike: 16, humidity: 68, wind: 4.4, description: 'light rain', main: 'Rain' },
  swat: { temp: 22, feelsLike: 21, humidity: 50, wind: 3.6, description: 'mostly clear', main: 'Clear' },
  peshawar: { temp: 30, feelsLike: 33, humidity: 48, wind: 2.9, description: 'sunny and warm', main: 'Clear' },
};

function normalizeCity(city) {
  return String(city || '').trim();
}

function classifyDay(temp, main) {
  const normalizedMain = String(main || '').toLowerCase();
  return {
    isRainy: normalizedMain.includes('rain') || normalizedMain.includes('drizzle') || normalizedMain.includes('thunder'),
    isSnowy: normalizedMain.includes('snow'),
    isHot: temp >= 32,
    isCold: temp <= 15,
    isClear: normalizedMain.includes('clear'),
  };
}

function advisoryFor(day) {
  if (day.isSnowy) return 'Snow expected. Prefer warm indoor stops and short scenic visits.';
  if (day.isRainy) return 'Rain expected. Prefer museums, food streets, malls, and covered attractions.';
  if (day.isHot) return 'Hot weather. Plan outdoor visits early morning or near sunset.';
  if (day.isCold) return 'Cold weather. Keep warm layers and balance outdoor views with warm venues.';
  if (day.isClear) return 'Clear weather. Good day for outdoor sightseeing and photography.';
  return 'Mild weather. Balanced indoor and outdoor planning is suitable.';
}

function buildFallbackForecast(city, days) {
  const base = fallbackWeatherByCity[city.toLowerCase()] || {
    temp: 26,
    feelsLike: 25,
    humidity: 55,
    wind: 3.5,
    description: 'partly cloudy',
    main: 'Clouds',
  };

  return Array.from({ length: days }, (_, index) => {
    const dayNumber = index + 1;
    const temp = base.temp + ((index % 3) - 1);
    const main = index % 4 === 2 ? 'Rain' : base.main;
    const day = {
      dayNumber,
      label: `Day ${dayNumber}`,
      temp,
      tempMin: temp - 4,
      tempMax: temp + 3,
      humidity: base.humidity,
      wind: base.wind,
      main,
      description: index % 4 === 2 ? 'light rain' : base.description,
      source: 'fallback',
      ...classifyDay(temp, main),
    };

    return {
      ...day,
      advisory: advisoryFor(day),
    };
  });
}

function normalizeOpenWeatherCurrent(city, data) {
  const weather = data.weather?.[0] || {};
  return {
    city,
    temp: Math.round(data.main?.temp ?? 0),
    feelsLike: Math.round(data.main?.feels_like ?? 0),
    humidity: data.main?.humidity ?? 0,
    wind: data.wind?.speed ?? 0,
    description: weather.description || 'weather data unavailable',
    main: weather.main || 'Unknown',
    source: 'openweather',
  };
}

function normalizeOpenWeatherForecast(list, days) {
  const byDate = new Map();

  for (const item of list || []) {
    const date = item.dt_txt?.slice(0, 10);
    if (!date || byDate.has(date)) continue;

    const weather = item.weather?.[0] || {};
    const temp = Math.round(item.main?.temp ?? 0);
    const main = weather.main || 'Unknown';
    const day = {
      dayNumber: byDate.size + 1,
      label: date,
      temp,
      tempMin: Math.round(item.main?.temp_min ?? temp),
      tempMax: Math.round(item.main?.temp_max ?? temp),
      humidity: item.main?.humidity ?? 0,
      wind: item.wind?.speed ?? 0,
      main,
      description: weather.description || 'forecast unavailable',
      source: 'openweather',
      ...classifyDay(temp, main),
    };

    byDate.set(date, {
      ...day,
      advisory: advisoryFor(day),
    });

    if (byDate.size >= days) break;
  }

  return Array.from(byDate.values());
}

async function getWeather(cityInput, requestedDays = 3) {
  const city = normalizeCity(cityInput);
  const days = Math.min(Math.max(Number(requestedDays) || 3, 1), 7);

  if (!city) {
    const error = new Error('City is required');
    error.statusCode = 400;
    throw error;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    const forecast = buildFallbackForecast(city, days);
    return {
      weather: {
        city,
        ...(fallbackWeatherByCity[city.toLowerCase()] || fallbackWeatherByCity.islamabad),
        source: 'fallback',
      },
      forecast,
    };
  }

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const fetchImpl = await getFetch();

  const [currentRes, forecastRes] = await Promise.all([
    fetchImpl(currentUrl),
    fetchImpl(forecastUrl),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    const fallbackForecast = buildFallbackForecast(city, days);
    return {
      weather: {
        city,
        ...(fallbackWeatherByCity[city.toLowerCase()] || fallbackWeatherByCity.islamabad),
        source: 'fallback-after-openweather-error',
      },
      forecast: fallbackForecast,
    };
  }

  const [currentData, forecastData] = await Promise.all([
    currentRes.json(),
    forecastRes.json(),
  ]);

  const forecast = normalizeOpenWeatherForecast(forecastData.list, days);

  return {
    weather: normalizeOpenWeatherCurrent(city, currentData),
    forecast: forecast.length ? forecast : buildFallbackForecast(city, days),
  };
}

module.exports = { getWeather };
