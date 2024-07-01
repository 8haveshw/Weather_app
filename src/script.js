const apiKey = 'bd5e378503939ddaee76f12ad7a97608'; 

const apiUrl = 'https://api.openweathermap.org/data/2.5';
const weatherEndpoint = '/weather';
const forecastEndpoint = '/forecast';

const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const weatherInfo = document.getElementById('weatherInfo');
const forecastContainer = document.getElementById('forecast');
const recentCitiesDropdown = document.getElementById('recentCities');
const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');

// Event listener for search button
searchBtn.addEventListener('click', async () => {
    const location = searchInput.value.trim();
    if (location) {
        await getWeatherAndForecast(location);
    }
});

// Event listener for Get Current Location button
getCurrentLocationBtn.addEventListener('click', async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async position => {
            const { latitude, longitude } = position.coords;
            const location = await getCityNameFromCoords(latitude, longitude);
            if (location) {
                await getWeatherAndForecast(location);
            }
        }, error => {
            console.error('Error getting current location:', error);
            alert('Could not get your current location. Please try again or enter a city name.');
        });
    } else {
        alert('Geolocation is not supported by your browser. Please enter a city name.');
    }
});

// Fetch weather data from API
const fetchWeatherData = async (location) => {
    try {
        const response = await fetch(`${apiUrl}${weatherEndpoint}?q=${location}&units=metric&appid=${apiKey}`);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
};

// Fetch forecast data from API
const fetchForecastData = async (location) => {
    try {
        const response = await fetch(`${apiUrl}${forecastEndpoint}?q=${location}&units=metric&appid=${apiKey}`);
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        return null;
    }
};

// Get city name from coordinates using reverse geocoding
const getCityNameFromCoords = async (latitude, longitude) => {
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`);
        if (!response.ok) {
            throw new Error('City name not found for coordinates');
        }
        const data = await response.json();
        const cityName = data[0].name;
        return cityName;
    } catch (error) {
        console.error('Error getting city name from coordinates:', error);
        return null;
    }
};

// Display current weather data
const displayWeatherData = (data) => {
    const cityName = data.name;
    const temperature = data.main.temp;
    const description = data.weather[0].description;
    const windSpeed = data.wind.speed;
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    weatherInfo.innerHTML = `
        <h2 class="text-2xl mb-2">${cityName}</h2>
        <p class="text-lg">${temperature}°C</p>
        <p class="text-sm">${description}</p>
        <p class="mt-4">Wind Speed: ${windSpeed} m/s</p>
        <p>Sunrise: ${sunrise}</p>
        <p>Sunset: ${sunset}</p>
    `;
};

// Display forecast data
const displayForecastData = (data) => {
    const forecastContainer = document.getElementById('forecast');
    if (!forecastContainer) {
        console.error('No element with ID "forecast" found.');
        return;
    }
    forecastContainer.innerHTML = '';

    const forecasts = data.list;
    if (!forecasts || forecasts.length === 0) {
        console.error('No forecast data available.');
        return;
    }

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();

    // Group forecasts by day
    const forecastsByDay = {};

    forecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayIndex = date.getDay();
        if (!forecastsByDay[dayIndex]) {
            forecastsByDay[dayIndex] = [];
        }
        forecastsByDay[dayIndex].push(forecast);
    });

    console.log('Forecasts by day:', forecastsByDay);

    let displayedDays = 0;

    // Iterate over the next 4 days
    for (let offset = 1; offset <= 4; offset++) {
        const dayIndex = (today + offset) % 7;
        const dayForecasts = forecastsByDay[dayIndex];

        if (dayForecasts && dayForecasts.length > 0) {
            console.log('Day index:', dayIndex, 'Forecasts:', dayForecasts);

            // Find the midday forecast (closest to 12:00)
            let middayForecast = dayForecasts[0];
            let minDifference = Math.abs(new Date(middayForecast.dt * 1000).getHours() - 12);

            for (const forecast of dayForecasts) {
                const hours = new Date(forecast.dt * 1000).getHours();
                const difference = Math.abs(hours - 12);
                if (difference < minDifference) {
                    middayForecast = forecast;
                    minDifference = difference;
                }
            }

            const dayOfWeek = daysOfWeek[dayIndex];
            const temperature = middayForecast.main.temp.toFixed(1);
            const description = middayForecast.weather[0].description;
            const windSpeed = middayForecast.wind.speed.toFixed(1);

            console.log('Midday forecast for', dayOfWeek, ':', middayForecast);

            const forecastCard = document.createElement('div');
            forecastCard.classList.add('bg-gray-200', 'p-4', 'rounded-md', 'text-center');

            forecastCard.innerHTML = `
                <p class="text-lg font-semibold">${dayOfWeek}</p>
                <p class="text-sm">${temperature}°C</p>
                <p class="text-xs">${description}</p>
                <p class="mt-2">Wind: ${windSpeed} m/s</p>
            `;

            forecastContainer.appendChild(forecastCard);
            displayedDays++;

            if (displayedDays === 4) {
                break;
            }
        }
    }
};

// Function to get weather and forecast data for a location
const getWeatherAndForecast = async (location) => {
    try {
        const weatherData = await fetchWeatherData(location);
        if (weatherData) {
            displayWeatherData(weatherData);
            updateRecentCities(location);
            updateRecentCitiesDropdown();
            const forecastData = await fetchForecastData(location);
            if (forecastData) {
                displayForecastData(forecastData);
            } else {
                forecastContainer.innerHTML = '<p class="text-red-500">Forecast data not available. Please try again.</p>';
            }
        } else {
            weatherInfo.innerHTML = '<p class="text-red-500">Weather data not available. Please try again.</p>';
            forecastContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Error fetching weather and forecast data:', error);
        forecastContainer.innerHTML = '';
    }
};

// Update recently searched cities in local storage
const updateRecentCities = (location) => {
    let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    if (!recentCities.includes(location)) {
        recentCities.unshift(location);
        if (recentCities.length > 5) {
            recentCities = recentCities.slice(0, 5);
        }
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
    }
};

// Update dropdown menu with recently searched cities
const updateRecentCitiesDropdown = () => {
    recentCitiesDropdown.innerHTML = '';
    const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
    recentCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        recentCitiesDropdown.appendChild(option);
    });
};

// Event listener for selecting a city from dropdown
recentCitiesDropdown.addEventListener('change', async () => {
    const selectedCity = recentCitiesDropdown.value;
    if (selectedCity) {
        searchInput.value = selectedCity;
        await getWeatherAndForecast(selectedCity);
    }
});

// Initial call to update dropdown with recent cities
updateRecentCitiesDropdown();

