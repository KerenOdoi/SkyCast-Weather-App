
// ===================================
// 1. INPUTS AND BUTTONS
// ===================================

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");

const celsiusBtn = document.getElementById("celsius-btn");
const fahrenheitBtn = document.getElementById("fahrenheit-btn");


// ===================================
// 2. STATUS ELEMENTS
// ===================================

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");


// ===================================
// 3. WEATHER CARD ELEMENTS
// ===================================

const cityNameEl = document.getElementById("city-name");
const dateEl = document.getElementById("date");
const iconEl = document.getElementById("weather-icon");
const temperatureEl = document.getElementById("temperature");
const conditionEl = document.getElementById("condition");

const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");


// ===================================
// 4. FORECAST ELEMENT
// ===================================

const forecastContainer = document.getElementById("forecast-container");


// ===================================
// 5. APPLICATION STATE
// ===================================

let unit = "C";
let weatherData = null;
let placeName = "";


// ===================================
// 6. WEATHER CODES
// ===================================

const weatherCodes = {
    0: { label: "Clear sky", icon: "☀️" },
    1: { label: "Mainly clear", icon: "🌤️" },
    2: { label: "Partly cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" },
    48: { label: "Rime fog", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy drizzle", icon: "🌦️" },
    61: { label: "Light rain", icon: "🌧️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy rain", icon: "🌧️" },
    71: { label: "Light snow", icon: "🌨️" },
    73: { label: "Snow", icon: "🌨️" },
    75: { label: "Heavy snow", icon: "❄️" },
    80: { label: "Rain showers", icon: "🌦️" },
    81: { label: "Rain showers", icon: "🌧️" },
    82: { label: "Violent showers", icon: "⛈️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunderstorm with hail", icon: "⛈️" },
    99: { label: "Thunderstorm with hail", icon: "⛈️" }
};


// ===================================
// 7. GET WEATHER INFORMATION
// ===================================

function getWeatherInfo(code) {
    return weatherCodes[code] || {
        label: "Unknown",
        icon: "❓"
    };
}


// ===================================
// 8. LOADING AND ERROR MESSAGES
// ===================================

function showLoading() {
    loadingEl.classList.remove("hidden");
    errorEl.classList.add("hidden");
}

function hideLoading() {
    loadingEl.classList.add("hidden");
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}


// ===================================
// 9. GET CITY COORDINATES
// ===================================

async function getCoordinates(city) {

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not look up that city.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(`No city found for "${city}".`);
    }

    const place = data.results[0];

    return {
        name: `${place.name}, ${place.country}`,
        latitude: place.latitude,
        longitude: place.longitude
    };
}


// ===================================
// 10. GET WEATHER DATA
// ===================================

async function getWeather(latitude, longitude) {

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not fetch the weather.");
    }

    return await response.json();
}


// ===================================
// 11. TEMPERATURE CONVERSION
// ===================================

function convertTemp(celsius) {

    if (unit === "C") {
        return Math.round(celsius);
    }

    return Math.round((celsius * 9 / 5) + 32);
}


// ===================================
// 12. DISPLAY CURRENT WEATHER
// ===================================

function renderCurrent() {

    const current = weatherData.current;

    const info = getWeatherInfo(current.weather_code);

    cityNameEl.textContent = placeName;

    dateEl.textContent = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    iconEl.textContent = info.icon;

    temperatureEl.textContent =
        `${convertTemp(current.temperature_2m)}°${unit}`;

    conditionEl.textContent = info.label;

    humidityEl.textContent =
        `${current.relative_humidity_2m}%`;

    windEl.textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;
}


// ===================================
// 13. DISPLAY SEVEN-DAY FORECAST
// ===================================

function renderForecast() {

    const daily = weatherData.daily;

    // Clear previous forecast cards
    forecastContainer.innerHTML = "";

    // Create seven forecast cards
    for (let i = 0; i < daily.time.length; i++) {

        const date = new Date(daily.time[i] + "T00:00:00");

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const info = getWeatherInfo(daily.weather_code[i]);

        const high = convertTemp(daily.temperature_2m_max[i]);

        const low = convertTemp(daily.temperature_2m_min[i]);

        // Create a new forecast card
        const forecastCard = document.createElement("div");

        forecastCard.classList.add("forecast-card");

        forecastCard.innerHTML = `
            <p class="forecast-day">${day}</p>

            <span class="forecast-icon">${info.icon}</span>

            <p>
                <span class="forecast-high">${high}°</span>
                <span class="forecast-low">${low}°</span>
            </p>
        `;

        // Add card to forecast container
        forecastContainer.appendChild(forecastCard);
    }
}


// ===================================
// 14. SEARCH FOR A CITY
// ===================================

async function searchCity() {

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    showLoading();

    try {

        const place = await getCoordinates(city);

        weatherData = await getWeather(
            place.latitude,
            place.longitude
        );

        placeName = place.name;

        // Display weather information
        renderCurrent();

        // Display all seven forecast cards
        renderForecast();

        errorEl.classList.add("hidden");

    } catch (err) {

        console.error("Weather Error:", err);

        showError(
            err.message || "Something went wrong. Please try again."
        );

    } finally {

        hideLoading();
    }
}


// ===================================
// 15. USE MY LOCATION
// ===================================

function getMyLocation() {

    if (!navigator.geolocation) {
        showError("Your browser does not support location services.");
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            try {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                weatherData = await getWeather(latitude, longitude);

                placeName = "Your Current Location";

                renderCurrent();
                renderForecast();

                errorEl.classList.add("hidden");

            } catch (err) {

                console.error("Location Weather Error:", err);

                showError("Could not fetch weather for your location.");

            } finally {

                hideLoading();
            }
        },

        function(error) {

            hideLoading();

            if (error.code === 1) {
                showError("Location permission was denied.");
            } else if (error.code === 2) {
                showError("Your location is unavailable.");
            } else {
                showError("Location request timed out.");
            }
        }
    );
}


// ===================================
// 16. CELSIUS BUTTON
// ===================================

celsiusBtn.addEventListener("click", function() {

    unit = "C";

    celsiusBtn.setAttribute("aria-pressed", "true");

    fahrenheitBtn.setAttribute("aria-pressed", "false");

    if (weatherData) {
        renderCurrent();
        renderForecast();
    }
});


// ===================================
// 17. FAHRENHEIT BUTTON
// ===================================

fahrenheitBtn.addEventListener("click", function() {

    unit = "F";

    fahrenheitBtn.setAttribute("aria-pressed", "true");

    celsiusBtn.setAttribute("aria-pressed", "false");

    if (weatherData) {
        renderCurrent();
        renderForecast();
    }
});


// ===================================
// 18. EVENT LISTENERS
// ===================================

searchBtn.addEventListener("click", searchCity);

cityInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchCity();
    }
});

locationBtn.addEventListener("click", getMyLocation);
