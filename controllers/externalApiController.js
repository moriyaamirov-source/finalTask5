const axios = require('axios');

// שליפת נתוני מזג אוויר מזמן אמת עבור יעד מבוקש
exports.getDestinationWeather = async (req, res) => {
    try {
        const city = req.query.city || 'Tel Aviv';
        const apiKey = process.env.WEATHER_API_KEY;

        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                units: 'metric',
                appid: apiKey
            }
        });

        res.json({
            success: true,
            city: response.data.name,
            temp: response.data.main.temp,
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'שגיאה בטעינת נתוני מזג האוויר החיצוניים' 
        });
    }
};