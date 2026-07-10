/* ─────────────────────────────────────────────
   Weather Pro — weather.js
   APIs: Open-Meteo (weather + geocoding) + Nominatim (reverse geocoding) + ipapi (IP fallback)
───────────────────────────────────────────── */

// ── Weather code → label, icon, sky class ──
const WEATHER_MAP = {
    0:  { label: "Clear skies",       icon: "https://img.icons8.com/emoji/96/sun-emoji.png",                         sky: "sky-clear" },
    1:  { label: "Mainly clear",      icon: "https://img.icons8.com/emoji/96/sun-emoji.png",                         sky: "sky-clear" },
    2:  { label: "Partly cloudy",     icon: "https://img.icons8.com/emoji/96/sun-behind-cloud.png",                  sky: "sky-cloudy" },
    3:  { label: "Overcast",          icon: "https://img.icons8.com/emoji/96/cloud-emoji.png",                       sky: "sky-cloudy" },
    45: { label: "Foggy",             icon: "https://img.icons8.com/emoji/96/fog.png",                               sky: "sky-cloudy" },
    48: { label: "Depositing fog",    icon: "https://img.icons8.com/emoji/96/fog.png",                               sky: "sky-cloudy" },
    51: { label: "Light drizzle",     icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    53: { label: "Drizzle",           icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    55: { label: "Heavy drizzle",     icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    61: { label: "Slight rain",       icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    63: { label: "Moderate rain",     icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    65: { label: "Heavy rain",        icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    71: { label: "Slight snow",       icon: "https://img.icons8.com/emoji/96/snowflake.png",                         sky: "sky-cloudy" },
    73: { label: "Moderate snow",     icon: "https://img.icons8.com/emoji/96/snowflake.png",                         sky: "sky-cloudy" },
    75: { label: "Heavy snow",        icon: "https://img.icons8.com/emoji/96/snowflake.png",                         sky: "sky-cloudy" },
    80: { label: "Rain showers",      icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    81: { label: "Rain showers",      icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    82: { label: "Violent showers",   icon: "https://img.icons8.com/emoji/96/cloud-with-rain.png",                   sky: "sky-rain" },
    85: { label: "Snow showers",      icon: "https://img.icons8.com/emoji/96/snowflake.png",                         sky: "sky-cloudy" },
    86: { label: "Heavy snow showers",icon: "https://img.icons8.com/emoji/96/snowflake.png",                         sky: "sky-cloudy" },
    95: { label: "Thunderstorm",      icon: "https://img.icons8.com/emoji/96/cloud-with-lightning-and-rain.png",     sky: "sky-rain" },
    96: { label: "Thunderstorm + hail",icon:"https://img.icons8.com/emoji/96/cloud-with-lightning-and-rain.png",    sky: "sky-rain" },
    99: { label: "Thunderstorm + heavy hail",icon:"https://img.icons8.com/emoji/96/cloud-with-lightning-and-rain.png",sky: "sky-rain" },
};

function getWeatherMeta(code) {
    return WEATHER_MAP[code] || { label: "Cloudy", icon: "https://img.icons8.com/emoji/96/cloud-emoji.png", sky: "sky-cloudy" };
}

// ── UV description ──
function uvLabel(val) {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    val = Math.round(val);
    if (val <= 2)  return `${val} Low`;
    if (val <= 5)  return `${val} Mod`;
    if (val <= 7)  return `${val} High`;
    if (val <= 10) return `${val} V.High`;
    return `${val} Extreme`;
}

// ── Format local time for a timezone ──
function formatLocalTime(tz) {
    try {
        return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ""; }
}

// ── Day name helper ──
function dayName(dateStr, index) {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Hour label ──
function hourLabel(h, index) {
    if (index === 0) return "Now";
    const d = new Date(h);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(' ', '');
}

// ── Theme toggle ──
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('themeIcon').innerText = isDark ? '🌙' : '☀️';
    document.getElementById('themeText').innerText = isDark ? 'Dark' : 'Light';
}

// ── Fetch weather from Open-Meteo ──
async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,apparent_temperature,weather_code,uv_index,visibility` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max` +
        `&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API error");
    return await res.json();
}

// ── Reverse geocoding ──
async function getCityFromCoords(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const a = data.address;
        return {
            city:    a.city || a.town || a.village || a.county || "Your Location",
            region:  a.state || "",
            country: a.country || ""
        };
    } catch {
        return { city: "Your Location", region: "", country: "" };
    }
}

// ── Display weather ──
function displayWeather(city, region, country, w) {
    setStatus("");

    // Show panels
    document.getElementById("mainWeather").style.display = "block";
    document.getElementById("hourlySection").style.display = "block";
    document.getElementById("forecastSection").style.display = "block";

    const cur = w.current;
    const daily = w.daily;
    const hourly = w.hourly;
    const tz = w.timezone || "UTC";

    const meta = getWeatherMeta(cur.weather_code);

    // Sky art
    const art = document.getElementById("cardBgArt");
    art.className = "card-bg-art " + meta.sky;

    // City + location
    document.getElementById("cityName").innerText = city;
    document.getElementById("locationDetails").innerText = [region, country].filter(Boolean).join(", ");
    document.getElementById("localTime").innerText = `Local time: ${formatLocalTime(tz)}`;

    // Temperature + icon
    document.getElementById("temperature").innerText = Math.round(cur.temperature_2m) + "°";
    document.getElementById("weatherIcon").src = meta.icon;
    document.getElementById("weatherIcon").alt = meta.label;

    // Condition + hi/lo
    document.getElementById("conditionText").innerText = meta.label;
    const hi = Math.round(daily.temperature_2m_max[0]);
    const lo = Math.round(daily.temperature_2m_min[0]);
    document.getElementById("hiLow").innerText = `H: ${hi}°  L: ${lo}°`;

    // Stats
    document.getElementById("feelsLike").innerText  = Math.round(cur.apparent_temperature) + "°";
    document.getElementById("humidity").innerText   = cur.relative_humidity_2m + "%";
    document.getElementById("wind").innerText       = Math.round(cur.wind_speed_10m) + " km/h";
    document.getElementById("precip").innerText     = (cur.rain ?? 0) + " mm";
    document.getElementById("uvIndex").innerText    = uvLabel(cur.uv_index ?? daily.uv_index_max?.[0]);
    const vis = cur.visibility;
    document.getElementById("visibility").innerText = vis ? (vis >= 1000 ? (vis / 1000).toFixed(1) + " km" : vis + " m") : "N/A";

    // Hourly — next 12 hours
    const now = new Date();
    const hourlyHtml = [];
    let added = 0;
    for (let i = 0; i < hourly.time.length && added < 12; i++) {
        const t = new Date(hourly.time[i]);
        if (t < now - 1800000) continue; // skip past (except very recent)
        const hMeta = getWeatherMeta(hourly.weather_code[i]);
        const isNow = added === 0;
        hourlyHtml.push(`
            <div class="hourly-card${isNow ? " now" : ""}">
                <span class="h-time">${isNow ? "Now" : hourLabel(hourly.time[i], added)}</span>
                <img src="${hMeta.icon}" alt="${hMeta.label}">
                <span class="h-temp">${Math.round(hourly.temperature_2m[i])}°</span>
            </div>
        `);
        added++;
    }
    document.getElementById("hourlyRow").innerHTML = hourlyHtml.join("");

    // 7-day forecast
    // compute global min/max for bar scaling
    const allMin = Math.min(...daily.temperature_2m_min);
    const allMax = Math.max(...daily.temperature_2m_max);
    const range  = allMax - allMin || 1;

    const forecastHtml = daily.time.map((date, i) => {
        const fMeta = getWeatherMeta(daily.weather_code[i]);
        const fHi   = Math.round(daily.temperature_2m_max[i]);
        const fLo   = Math.round(daily.temperature_2m_min[i]);
        const barLeft  = ((fLo - allMin) / range * 100).toFixed(1);
        const barWidth = (((fHi - fLo) / range) * 100).toFixed(1);
        return `
            <div class="forecast-row-item">
                <span class="f-day">${dayName(date, i)}</span>
                <img class="f-icon" src="${fMeta.icon}" alt="${fMeta.label}">
                <span class="f-cond">${fMeta.label}</span>
                <div class="temp-bar-wrap" style="position:relative;">
                    <div class="temp-bar-fill" style="margin-left:${barLeft}%;width:${barWidth}%;"></div>
                </div>
                <div class="f-temp-range">
                    <span class="f-lo">${fLo}°</span>
                    <span style="color:var(--border);font-size:0.7rem;">|</span>
                    <span class="f-hi">${fHi}°</span>
                </div>
            </div>
        `;
    }).join("");
    document.getElementById("forecastRow").innerHTML = forecastHtml;
}

// ── IP fallback ──
async function detectViaIP() {
    setStatus("Detecting via IP address…");
    try {
        const res  = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const w    = await getWeather(data.latitude, data.longitude);
        displayWeather(data.city, data.region, data.country_name, w);
    } catch {
        setStatus("Could not detect location. Search for a city above.");
    }
}

// ── GPS detect ──
async function detectLocation() {
    setStatus("Accessing GPS…");
    if (!navigator.geolocation) { detectViaIP(); return; }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            setStatus("Fetching weather…");
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            try {
                const [loc, w] = await Promise.all([
                    getCityFromCoords(lat, lon),
                    getWeather(lat, lon)
                ]);
                displayWeather(loc.city, loc.region, loc.country, w);
            } catch {
                setStatus("Weather fetch failed. Try searching manually.");
            }
        },
        () => {
            setStatus("GPS blocked — using IP fallback…");
            detectViaIP();
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// ── Search autocomplete ──
const searchInput = document.getElementById("searchBox");
const list        = document.getElementById("autocompleteList");
let debounceTimer;

searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { list.style.display = "none"; return; }

    debounceTimer = setTimeout(async () => {
        try {
            const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
            const data = await res.json();
            list.innerHTML = "";
            if (!data.results || data.results.length === 0) {
                list.style.display = "none"; return;
            }
            data.results.forEach(loc => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                const main = document.createElement("span");
                main.textContent = loc.name;
                const sub = document.createElement("small");
                sub.textContent = [loc.admin1, loc.country].filter(Boolean).join(", ");
                div.appendChild(main);
                div.appendChild(sub);
                div.addEventListener("click", async () => {
                    list.style.display = "none";
                    searchInput.value  = loc.name;
                    setStatus("Fetching weather…");
                    try {
                        const w = await getWeather(loc.latitude, loc.longitude);
                        displayWeather(loc.name, loc.admin1 || "", loc.country || "", w);
                    } catch {
                        setStatus("Weather fetch failed. Try again.");
                    }
                });
                list.appendChild(div);
            });
            list.style.display = "block";
        } catch { list.style.display = "none"; }
    }, 280);
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") list.style.display = "none";
});

document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !list.contains(e.target)) {
        list.style.display = "none";
    }
});

// ── Helpers ──
function setStatus(msg) {
    document.getElementById("statusText").textContent = msg;
}

// ── Boot ──
window.addEventListener("load", detectLocation);
