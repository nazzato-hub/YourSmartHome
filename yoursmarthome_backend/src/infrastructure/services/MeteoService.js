// ── Infrastructure – Meteo Service (Open-Meteo integration) ───────────────────

async function getMeteoAttuale() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.8919&longitude=12.5113&current=temperature_2m,relative_humidity_2m,weather_code';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Impossibile recuperare i dati meteo');
  }
  const data = await res.json();
  const current = data.current;
  const code = current.weather_code;
  const mapped = getWeatherDescription(code);

  return {
    temperatura: current.temperature_2m,
    umidita: current.relative_humidity_2m,
    stato: mapped.desc,
    emoji: mapped.emoji,
    weatherCode: code,
  };
}

function getWeatherDescription(code) {
  if (code === 0) return { desc: 'Soleggiato', emoji: '☀️' };
  if (code >= 1 && code <= 3) return { desc: 'Parzialmente nuvoloso', emoji: '🌤️' };
  if (code === 45 || code === 48) return { desc: 'Nebbia', emoji: '🌫️' };
  if (code >= 51 && code <= 55) return { desc: 'Pioggerella', emoji: '🌦️' };
  if (code >= 61 && code <= 65) return { desc: 'Pioggia', emoji: '🌧️' };
  if (code >= 71 && code <= 75) return { desc: 'Neve', emoji: '❄️' };
  if (code >= 80 && code <= 82) return { desc: 'Rovesci di pioggia', emoji: '🌧️' };
  if (code >= 95 && code <= 99) return { desc: 'Temporale', emoji: '⛈️' };
  return { desc: 'Nuvoloso', emoji: '☁️' };
}

module.exports = { getMeteoAttuale };
