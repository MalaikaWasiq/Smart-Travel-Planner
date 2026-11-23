const getFetch = require('../utils/fetch');

const fallbackWeatherByCity = {
  lahore: { temp: 32, feelsLike: 35, humidity: 62, wind: 3.2, description: 'warm with seasonal haze', main: 'Haze' },
  islamabad: { temp: 25, feelsLike: 24, humidity: 58, wind: 3.8, description: 'mild and partly cloudy', main: 'Clouds' },
  rawalpindi: { temp: 25, feelsLike: 24, humidity: 58, wind: 3.8, description: 'mild and partly cloudy', main: 'Clouds' },
  karachi: { temp: 31, feelsLike: 36, humidity: 74, wind: 5.5, description: 'humid coastal sea breeze', main: 'Clear' },
  hunza: { temp: 14, feelsLike: 11, humidity: 42, wind: 2.8, description: 'clear and cold mountain breeze', main: 'Clear' },
  skardu: { temp: 8, feelsLike: 5, humidity: 38, wind: 3.0, description: 'cold alpine weather', main: 'Clear' },
  gilgit: { temp: 18, feelsLike: 17, humidity: 44, wind: 3.1, description: 'clear northern sky', main: 'Clear' },
  murree: { temp: 16, feelsLike: 15, humidity: 72, wind: 4.4, description: 'cool with periodic mountain mist', main: 'Clouds' },
  swat: { temp: 21, feelsLike: 20, humidity: 55, wind: 3.6, description: 'pleasant valley climate', main: 'Clear' },
  kalam: { temp: 15, feelsLike: 13, humidity: 58, wind: 3.4, description: 'cool valley temperature', main: 'Clear' },
  naran: { temp: 11, feelsLike: 9, humidity: 50, wind: 3.9, description: 'crisp alpine temperature', main: 'Clear' },
  'malam jabba': { temp: 12, feelsLike: 10, humidity: 48, wind: 3.5, description: 'cool pine mountain climate', main: 'Clear' },
  babusar: { temp: 4, feelsLike: 0, humidity: 45, wind: 5.2, description: 'freezing pass winds', main: 'Clear' },
  'fairy meadows': { temp: 7, feelsLike: 4, humidity: 42, wind: 3.8, description: 'freezing alpine basecamp', main: 'Clear' },
  neelum: { temp: 15, feelsLike: 13, humidity: 65, wind: 3.2, description: 'cool river valley breeze', main: 'Clear' },
  gwadar: { temp: 29, feelsLike: 33, humidity: 70, wind: 5.1, description: 'warm coastal sea breeze', main: 'Clear' },
  'kund malir': { temp: 28, feelsLike: 31, humidity: 68, wind: 4.8, description: 'sunny coastal highway', main: 'Clear' },
  peshawar: { temp: 29, feelsLike: 31, humidity: 46, wind: 2.9, description: 'sunny and dry', main: 'Clear' },
  multan: { temp: 34, feelsLike: 37, humidity: 52, wind: 2.7, description: 'warm sunshine', main: 'Clear' },
  faisalabad: { temp: 31, feelsLike: 34, humidity: 60, wind: 2.6, description: 'hazy and warm', main: 'Haze' },
  bahawalpur: { temp: 33, feelsLike: 36, humidity: 48, wind: 3.0, description: 'warm and clear skies', main: 'Clear' },
  quetta: { temp: 19, feelsLike: 17, humidity: 35, wind: 4.0, description: 'cool and dry mountain air', main: 'Clear' },
  ziarat: { temp: 13, feelsLike: 11, humidity: 40, wind: 3.5, description: 'cool juniper forest breeze', main: 'Clear' },
  chitral: { temp: 16, feelsLike: 14, humidity: 42, wind: 3.2, description: 'mild highland weather', main: 'Clear' },
  abbottabad: { temp: 22, feelsLike: 21, humidity: 58, wind: 3.0, description: 'pleasant pine climate', main: 'Clear' },
  muzaffarabad: { temp: 24, feelsLike: 24, humidity: 60, wind: 3.3, description: 'clear valley weather', main: 'Clear' },
};

function findFallbackWeather(cityName) {
  const q = String(cityName || '').toLowerCase();
  for (const [key, val] of Object.entries(fallbackWeatherByCity)) {
    if (q.includes(key) || key.includes(q)) return val;
  }
  return fallbackWeatherByCity.islamabad;
}

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
  const base = findFallbackWeather(city);

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
        ...findFallbackWeather(city),
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
        ...findFallbackWeather(city),
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
