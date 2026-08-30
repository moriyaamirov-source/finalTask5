const axios = require('axios');

// קואורדינטות לפי אזורים בישראל
const REGION_COORDINATES = {
    north: { lat: 32.9, lon: 35.3 }, // צפון (גליל/גולן)
    center: { lat: 32.08, lon: 34.78 }, // מרכז (תל אביב/מרכז)
    south: { lat: 31.25, lon: 34.79 }  // דרום (באר שבע/נגב)
};

exports.getWeather = async (req, res) => {
    try {
        const region = req.query.region || 'center';
        const coords = REGION_COORDINATES[region] || REGION_COORDINATES.center;

        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: coords.lat,
                longitude: coords.lon,
                current_weather: true
            }
        });

        const weather = response.data.current_weather;
        res.json({
            success: true,
            region: region,
            temperature: weather.temperature,
            windspeed: weather.windspeed,
            weathercode: weather.weathercode
        });
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weather data'
        });
    }
};