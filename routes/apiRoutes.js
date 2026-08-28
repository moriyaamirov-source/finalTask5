const express = require('express');
const router = express.Router();
const externalApiController = require('../controllers/externalApiController');

// נתיב API פנימי שמחזיר נתוני מזג אוויר לפי עיר
router.get('/weather', externalApiController.getDestinationWeather);

module.exports = router;