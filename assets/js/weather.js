async function detectLocation() {
    const status = document.getElementById("statusText");
    status.innerText = "Requesting GPS access...";

    // Step 1: Try Browser GPS (Most Accurate)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                status.innerText = "Fetching weather for your coordinates...";
                const w = await getWeather(lat, lon);
                // GPS se city name nahi milta, isliye hum 'Your Location' likh denge
                displayWeather("Current Location", "Detected via GPS", "", w);
                status.innerText = "";
            },
            async (error) => {
                // Step 2: Fallback to IP if GPS is denied/fails
                status.innerText = "GPS denied. Trying IP location...";
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    const data = await res.json();
                    const w = await getWeather(data.latitude, data.longitude);
                    displayWeather(data.city, data.region, data.country_name, w);
                    status.innerText = "IP Location (May be inaccurate)";
                } catch (e) {
                    status.innerText = "Location failed. Please search manually.";
                }
            }
        );
    }
}
