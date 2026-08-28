const express = require('express');
const router = express.Router();
const externalApiController = require('../controllers/externalApiController');
const analyticsController = require('../controllers/analyticsController');

// פנימי שמחזיר נתוני מזג אוויר לפי עיר API נתיב
router.get('/weather', externalApiController.getDestinationWeather);

// נתיבים לשליפת נתוני אגרגציה לגרפים של D3
router.get('/analytics/categories', analyticsController.getCategoryStats);
router.get('/analytics/monthly', analyticsController.getMonthlyStats);

module.exports = router;