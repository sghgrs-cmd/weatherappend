
const API_KEY = '6ccb1e8915ac1c0419856d66217ed045';

const app = document.querySelector('.app');
const weatherBg = document.querySelector('.weather-bg');
const weatherEffectCanvas = document.getElementById('weatherEffect');

const cityInput = document.getElementById('cityInput');
const searchBar = document.querySelector('.search-bar');
const geoBtn = document.getElementById('geoBtn');
const themeToggle = document.getElementById('themeToggle');

const cityCountry = document.getElementById('cityCountry');
const weatherIcon = document.getElementById('weatherIcon');
const weatherTemp = document.getElementById('weatherTemp');
const weatherDesc = document.getElementById('weatherDesc');

const windValue = document.getElementById('windValue');
const humidityValue = document.getElementById('humidityValue');
const pressureValue = document.getElementById('pressureValue');
const sunriseValue = document.getElementById('sunriseValue');
const sunsetValue = document.getElementById('sunsetValue');

const forecastList = document.getElementById('forecastList');
const clock = document.getElementById('clock');
const historyBlock = document.getElementById('history');

let history = JSON.parse(localStorage.getItem('weather_history') || '[]');
let clockInterval = null;
let effectAnimation = null;

if (localStorage.getItem('weather_theme') === 'light' && app) {
  app.classList.add('light');
  if (themeToggle) themeToggle.checked = true;
}
if (themeToggle && app) {
  themeToggle.addEventListener('change', () => {
    app.classList.toggle('light', themeToggle.checked);
    localStorage.setItem('weather_theme', themeToggle.checked ? 'light' : 'dark');
  });
}

function getWeatherIcon(icon, desc, isDay) {
  const icons = {
    '01d': `<svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="22" fill="#FFD93B"/></svg>`,
    '01n': `<svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="18" fill="#B3B8C3"/></svg>`,
    '02d': `<svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="18" fill="#FFD93B"/><ellipse cx="60" cy="60" rx="18" ry="12" fill="#B3B8C3" opacity="0.7"/></svg>`,
    '03d': `<svg width="90" height="90" viewBox="0 0 90 90"><ellipse cx="50" cy="55" rx="20" ry="12" fill="#B3B8C3"/></svg>`,
    '09d': `<svg width="90" height="90" viewBox="0 0 90 90"><ellipse cx="50" cy="55" rx="20" ry="12" fill="#A0AEC0"/><g><rect x="38" y="68" width="4" height="12" rx="2" fill="#3ABFF8"/></g></svg>`,
    '10d': `<svg width="90" height="90" viewBox="0 0 90 90"><ellipse cx="50" cy="55" rx="20" ry="12" fill="#A0AEC0"/><g><rect x="42" y="68" width="4" height="12" rx="2" fill="#3ABFF8"/><rect x="52" y="68" width="4" height="12" rx="2" fill="#3ABFF8"/></g></svg>`,
    '11d': `<svg width="90" height="90" viewBox="0 0 90 90"><ellipse cx="50" cy="55" rx="20" ry="12" fill="#A0AEC0"/><polygon points="46,70 52,86 40,86" fill="#FBBF24"/></svg>`,
    '13d': `<svg width="90" height="90" viewBox="0 0 90 90"><g fill="#fff"><circle cx="45" cy="75" r="3"/><circle cx="55" cy="80" r="2.5"/></g></svg>`,
    '50d': `<svg width="90" height="90" viewBox="0 0 90 90"><ellipse cx="45" cy="60" rx="28" ry="14" fill="#B3B8C3" opacity="0.5"/></svg>`
  };
  if (icon && icons[icon]) return icons[icon];
  if (/clear/i.test(desc)) return isDay ? icons['01d'] : icons['01n'];
  if (/cloud/i.test(desc)) return icons['03d'];
  if (/rain|drizzle/i.test(desc)) return icons['09d'];
  if (/snow/i.test(desc)) return icons['13d'];
  if (/storm|thunder/i.test(desc)) return icons['11d'];
  if (/fog|mist|haze/i.test(desc)) return icons['50d'];
  return icons['01d'];
}

function unixToTime(unix, tzSeconds) {
  if (typeof unix !== 'number') return '—';
  const ms = (unix + (tzSeconds || 0)) * 1000;
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function animateTemp(newTemp) {
  if (!weatherTemp) return;
  weatherTemp.textContent = `${Math.round(newTemp)}°C`;
}

function setBgByWeather(main, isDay) {
  if (!weatherBg) return;
  weatherBg.classList.remove('sunny', 'rain', 'night', 'default');
  if (/snow/i.test(main)) weatherBg.classList.add('default');
  else if (/clear/i.test(main) && isDay) weatherBg.classList.add('sunny');
  else if (/rain|drizzle|storm|thunder/i.test(main)) weatherBg.classList.add('rain');
  else if (!isDay) weatherBg.classList.add('night');
  else weatherBg.classList.add('default');
}

function weatherEffect(type) {
  if (!weatherEffectCanvas) return;
  const ctx = weatherEffectCanvas.getContext('2d');
  let w = window.innerWidth, h = window.innerHeight;
  weatherEffectCanvas.width = w; weatherEffectCanvas.height = h;
  ctx.clearRect(0, 0, w, h);
  if (effectAnimation) cancelAnimationFrame(effectAnimation);

  if (type === 'rain') {
    const drops = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h, l: 10 + Math.random() * 18, s: 2 + Math.random() * 3 }));
    function drawRain() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(58,191,248,0.22)'; ctx.lineWidth = 2;
      for (const d of drops) {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.l); ctx.stroke();
        d.y += d.s; if (d.y > h) { d.y = -d.l; d.x = Math.random() * w; }
      }
      effectAnimation = requestAnimationFrame(drawRain);
    }
    drawRain(); return;
  }

  if (type === 'snow') {
    const flakes = Array.from({ length: 90 }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: 1.5 + Math.random() * 2.5, s: 0.7 + Math.random() * 1.3,
      drift: Math.random() * Math.PI * 2, driftSpeed: 0.01 + Math.random() * 0.02
    }));
    function drawSnow() {
      ctx.clearRect(0, 0, w, h); ctx.save(); ctx.shadowColor = "#fff"; ctx.shadowBlur = 6;
      for (const f of flakes) {
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill();
        f.y += f.s; f.x += Math.sin(f.drift) * 0.6; f.drift += f.driftSpeed;
        if (f.y > h + 8) { f.y = -f.r; f.x = Math.random() * w; }
        if (f.x < -8) f.x = w + 8; if (f.x > w + 8) f.x = -8;
      }
      ctx.restore(); effectAnimation = requestAnimationFrame(drawSnow);
    }
    drawSnow(); return;
  }

  if (type === 'night') {
    const stars = Array.from({ length: 100 }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.7, r: 0.6 + Math.random() * 1.6, o: 0.4 + Math.random() * 0.6 }));
    function drawStars() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI); ctx.fillStyle = `rgba(255,255,255,${s.o})`;
        ctx.shadowColor = "#fff"; ctx.shadowBlur = 8; ctx.fill();
      }
      effectAnimation = requestAnimationFrame(drawStars);
    }
    drawStars(); return;
  }

}

async function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

async function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast not found');
  return res.json();
}

function renderWeather(data) {
  if (!data) return;
  const isDay = data.dt >= data.sys.sunrise && data.dt < data.sys.sunset;
  if (cityCountry) cityCountry.textContent = `${data.name}, ${data.sys.country}`;
  if (weatherIcon) weatherIcon.innerHTML = getWeatherIcon(data.weather[0].icon, data.weather[0].description, isDay);
  if (weatherTemp) animateTemp(Number(data.main.temp));
  if (weatherDesc) weatherDesc.textContent = data.weather[0].description;
  if (windValue) windValue.textContent = `${Math.round(data.wind.speed)} m/s`;
  if (humidityValue) humidityValue.textContent = `${data.main.humidity}%`;
  if (pressureValue) pressureValue.textContent = `${data.main.pressure} hPa`;
  if (sunriseValue) sunriseValue.textContent = unixToTime(data.sys.sunrise, data.timezone);
  if (sunsetValue) sunsetValue.textContent = unixToTime(data.sys.sunset, data.timezone);

  setBgByWeather(data.weather[0].main, isDay);

  const main = (data.weather[0].main || '').toLowerCase();
  if (/snow/.test(main)) weatherEffect('snow');
  else if (/rain|drizzle|storm|thunder/.test(main)) weatherEffect('rain');
  else if (!isDay) weatherEffect('night');
  else weatherEffect('clear');

  addToHistory(data.name, data.sys.country);
}

function renderForecast(forecastData) {
  if (!forecastData || !forecastList) return;
  const tz = forecastData.city && typeof forecastData.city.timezone === 'number' ? forecastData.city.timezone : 0;
  const list = forecastData.list || [];

  const daysMap = new Map();
  list.forEach(item => {
    const localMs = (item.dt + tz) * 1000;
    const d = new Date(localMs);
    const key = d.toISOString().slice(0, 10);
    const hour = d.getUTCHours();
    if (!daysMap.has(key)) daysMap.set(key, []);
    daysMap.get(key).push({ item, hour });
  });

  const forecastDays = [];
  for (const [day, entries] of daysMap.entries()) {
    entries.sort((a, b) => Math.abs(a.hour - 12) - Math.abs(b.hour - 12));
    forecastDays.push(entries[0].item);
  }

  forecastList.innerHTML = '';
  forecastDays.slice(0, 5).forEach(item => {
    const localMs = (item.dt + tz) * 1000;
    const d = new Date(localMs);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const icon = getWeatherIcon(item.weather[0].icon, item.weather[0].description, true);
    const tempMin = Math.round(item.main.temp_min);
    const tempMax = Math.round(item.main.temp_max);

    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.innerHTML = `
      <div class="forecast-date">${dayName}</div>
      <div class="forecast-icon">${icon}</div>
      <div class="forecast-temp">${tempMin}° / ${tempMax}°</div>
    `;
    forecastList.appendChild(div);
  });
}

function updateClock(timezoneSeconds) {
  if (clockInterval) clearInterval(clockInterval);

  function tick() {
    const targetMs = Date.now() + (Number(timezoneSeconds) || 0) * 1000;
    const d = new Date(targetMs);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    if (clock) clock.textContent = `${hh}:${mm}:${ss}`;
  }

  tick();
  clockInterval = setInterval(tick, 1000);
}

function addToHistory(city, country) {
  const entry = `${city}, ${country}`;
  history = history.filter(c => c !== entry);
  history.unshift(entry);
  if (history.length > 3) history = history.slice(0, 3);
  localStorage.setItem('weather_history', JSON.stringify(history));
  renderHistory();
}
function renderHistory() {
  if (!historyBlock) return;
  historyBlock.innerHTML = '';
  history.forEach(entry => {
    const btn = document.createElement('span');
    btn.className = 'history-city';
    btn.textContent = entry;
    btn.addEventListener('click', () => loadWeather(entry.split(',')[0]));
    historyBlock.appendChild(btn);
  });
}

async function loadWeather(city) {
  try {
    if (cityCountry) cityCountry.textContent = 'Loading...';
    if (weatherTemp) weatherTemp.textContent = '--°C';
    if (weatherIcon) weatherIcon.innerHTML = `<span class="loader"></span>`;
    if (weatherDesc) weatherDesc.textContent = '';
    if (windValue) windValue.textContent = '—';
    if (humidityValue) humidityValue.textContent = '—';
    if (pressureValue) pressureValue.textContent = '—';
    if (sunriseValue) sunriseValue.textContent = '—';
    if (sunsetValue) sunsetValue.textContent = '—';
    if (forecastList) forecastList.innerHTML = '';

    const [weather, forecast] = await Promise.all([getWeather(city), getForecast(city)]);
    renderWeather(weather);
    renderForecast(forecast);

    const tz = (typeof weather.timezone === 'number') ? weather.timezone : (forecast.city && typeof forecast.city.timezone === 'number' ? forecast.city.timezone : 0);
    updateClock(tz);
  } catch (err) {
    if (cityCountry) cityCountry.textContent = 'Not found';
    if (weatherTemp) weatherTemp.textContent = '--°C';
    if (weatherIcon) weatherIcon.innerHTML = '';
    if (weatherDesc) weatherDesc.textContent = err.message || 'Error';
    if (forecastList) forecastList.innerHTML = '';
    console.error(err);
  }
}

if (searchBar) {
  searchBar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = (cityInput && cityInput.value || '').trim();
    if (!city) return;
    await loadWeather(city);
    if (cityInput) cityInput.value = '';
  });
}

if (geoBtn) {
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    geoBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Location error');
        const data = await res.json();
        await loadWeather(data.name);
      } catch (err) {
        alert('Could not get weather for your location');
      }
      geoBtn.disabled = false;
    }, () => {
      alert('Could not get your location');
      geoBtn.disabled = false;
    });
  });
}

function init() {
  renderHistory();
  if (history.length) loadWeather(history[0].split(',')[0]);
  else loadWeather('Yerevan');
}
init();

window.addEventListener('resize', () => {
  if (!weatherEffectCanvas || !weatherBg) return;
  if (weatherBg.classList.contains('rain')) weatherEffect('rain');
  else if (weatherBg.classList.contains('night')) weatherEffect('night');
  else if (weatherBg.classList.contains('sunny')) weatherEffect('clear');
  else weatherEffect('clear');
});