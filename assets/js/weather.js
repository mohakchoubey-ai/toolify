const mapping = {
    0: ["Clear Skies", "https://img.icons8.com/emoji/96/sun-emoji.png"],
    1: ["Mainly Clear", "https://img.icons8.com/emoji/96/sun-emoji.png"],
    2: ["Partly Cloudy", "https://img.icons8.com/emoji/96/sun-behind-cloud.png"],
    3: ["Overcast", "https://img.icons8.com/emoji/96/cloud-emoji.png"],
    61: ["Slight Rain", "https://img.icons8.com/emoji/96/cloud-with-rain.png"],
    95: ["Thunderstorm", "https://img.icons8.com/emoji/96/cloud-with-lightning-and-rain.png"]
};

function toggleTheme() {
    const body = document.body;
    const text = document.getElementById('themeText');
    const icon = document.getElementById('themeIcon');
    if (body.getAttribute('data-theme') === 'dark') {
        body.setAttribute('data-theme', 'light');
        text.innerText = "Dark Mode"; icon.innerText = "🌙";
    } else {
        body.setAttribute('data-theme', 'dark');
        text.innerText = "Light Mode"; icon.innerText = "☀️";
    }
}

async function getWeather(lat, lon) {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    return await res.json();
}

// Extra: Coordinates se sheher ka naam nikaalne ke liye
async function getCityFromCoords(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        return data.address.city || data.address.town || data.address.village || "Current Location";
    } catch (e) { return "Current Location"; }
}

function displayWeather(city, region, country, w) {
    document.getElementById("mainWeather").style.display = "block";
    document.getElementById("forecastSection").style.display = "block";
    document.getElementById("cityName").innerText = city;
    document.getElementById("locationDetails").innerText = region ? `${region}, ${country}` : country;
    
    const [condText, condIcon] = mapping[w.current.weather_code] || ["Cloudy", "https://img.icons8.com/emoji/96/cloud-emoji.png"];
    document.getElementById("temperature").innerText = Math.round(w.current.temperature_2m) + "°";
    document.getElementById("conditionText").innerText = condText;
    document.getElementById("weatherIcon").src = condIcon;
    document.getElementById("feelsLike").innerText = Math.round(w.current.apparent_temperature) + "°";
    document.getElementById("humidity").innerText = w.current.relative_humidity_2m + "%";
    document.getElementById("wind").innerText = Math.round(w.current.wind_speed_10m) + " km/h";
    document.getElementById("precip").innerText = w.current.rain + "mm";

    let fHtml = "";
    for(let i=0; i<7; i++){
        let date = new Date(w.daily.time[i]).toLocaleDateString('en-US', {weekday: 'short'});
        const [fText, fIcon] = mapping[w.daily.weather_code[i]] || ["Cloudy", "https://img.icons8.com/emoji/96/cloud-emoji.png"];
        fHtml += `<div class="forecast-card">
            <p style="font-size:0.7rem;">${date}</p>
            <img src="${fIcon}" width="30">
            <p style="font-weight:700; color:var(--accent);">${Math.round(w.daily.temperature_2m_max[i])}°</p>
        </div>`;
    }
    document.getElementById("forecastRow").innerHTML = fHtml;
}

async function detectViaIP() {
    const status = document.getElementById("statusText");
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const w = await getWeather(data.latitude, data.longitude);
        displayWeather(data.city, data.region, data.country_name, w);
        status.innerText = "";
    } catch (e) {
        status.innerText = "Location failed. Please search manually.";
    }
}

async function detectLocation() {
    const status = document.getElementById("statusText");
    status.innerText = "Accessing GPS for accuracy...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                status.innerText = "Pinpointing your city...";
                const cityName = await getCityFromCoords(lat, lon);
                const w = await getWeather(lat, lon);
                displayWeather(cityName, "Detected via GPS", "Precision Match", w);
                status.innerText = "";
            },
            async (error) => {
                status.innerText = "GPS blocked. Using IP fallback...";
                detectViaIP();
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        status.innerText = "Browser doesn't support GPS. Using IP...";
        detectViaIP();
    }
}

// Search Logic
const searchInput = document.getElementById("searchBox");
const list = document.getElementById("autocompleteList");

searchInput.addEventListener("input", async (e) => {
    const q = e.target.value;
    if(q.length < 3) return;
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5`);
    const data = await res.json();
    list.innerHTML = "";
    if(data.results) {
        data.results.forEach(loc => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.innerHTML = `${loc.name}, <small>${loc.country}</small>`;
            div.onclick = async () => {
                list.style.display = "none";
                searchInput.value = loc.name;
                const w = await getWeather(loc.latitude, loc.longitude);
                displayWeather(loc.name, loc.admin1 || "", loc.country, w);
            };
            list.appendChild(div);
        });
        list.style.display = "block";
    }
});

document.addEventListener("click", (e) => {
    if(!searchInput.contains(e.target)) list.style.display = "none";
});

window.onload = detectLocation;
