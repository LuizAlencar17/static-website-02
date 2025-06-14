
const cities = {
  berlin: { name: "Berlin", lat: 52.52, lon: 13.41 },
  newyork: { name: "New York", lat: 40.71, lon: -74.01 },
  tokyo: { name: "Tokyo", lat: 35.68, lon: 139.69 },
  sydney: { name: "Sydney", lat: -33.87, lon: 151.21 },
  cairo: { name: "Cairo", lat: 30.04, lon: 31.24 },
  rio: { name: "Rio de Janeiro", lat: -22.91, lon: -43.17 },
  moscow: { name: "Moscow", lat: 55.76, lon: 37.62 },
  paris: { name: "Paris", lat: 48.85, lon: 2.35 },
  delhi: { name: "Delhi", lat: 28.61, lon: 77.21 },
  cape: { name: "Cape Town", lat: -33.92, lon: 18.42 }
};

const select = document.getElementById("city-select");
const forecastDiv = document.getElementById("forecast");
const chartCanvas = document.getElementById("tempChart");
let tempChart;

select.addEventListener("change", () => {
  const city = cities[select.value];
  fetchForecast(city.lat, city.lon);
});

function fetchForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      const dailyTemps = groupByDay(data.hourly.time, data.hourly.temperature_2m);
      renderCards(dailyTemps);
      renderChart(data.hourly.time.slice(0, 48), data.hourly.temperature_2m.slice(0, 48));
    })
    .catch(err => {
      forecastDiv.innerHTML = "<p>Failed to load data.</p>";
      console.error(err);
    });
}

function groupByDay(times, temps) {
  const daily = {};
  for (let i = 0; i < times.length; i++) {
    const date = times[i].split("T")[0];
    if (!daily[date]) daily[date] = [];
    daily[date].push(temps[i]);
  }
  return Object.entries(daily)
    .slice(0, 7)
    .map(([date, values]) => ({
      date,
      average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    }));
}

function renderCards(days) {
  forecastDiv.innerHTML = "";
  days.forEach(day => {
    const dateObj = new Date(day.date);
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${weekday}</h3>
      <p>${day.average}°C</p>
    `;
    forecastDiv.appendChild(card);
  });
}

function renderChart(times, temps) {
  const labels = times.map(t => {
    const date = new Date(t);
    return date.toLocaleString("en-US", { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  });

  if (tempChart) tempChart.destroy();

  tempChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temps,
        borderColor: "#0077cc",
        backgroundColor: "rgba(0, 119, 204, 0.1)",
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `48-hour Temperature Trend for ${cities[select.value].name}`,
          font: { size: 18 }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: context => `${context.parsed.y} °C`
          }
        },
        legend: { display: false }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Temperature (°C)'
          }
        }
      }
    }
  });
}

// Load default city on page load
fetchForecast(cities.berlin.lat, cities.berlin.lon);
