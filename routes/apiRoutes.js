const express = require('express');
const router = express.Router();
const externalApiController = require('../controllers/externalApiController');
const analyticsController = require('../controllers/analyticsController');

// API נתיב פנימי שמחזיר נתוני מזג אוויר לפי אזור
router.get('/weather', externalApiController.getWeather);

// נתיבים לשליפת נתוני אגרגציה לגרפים של D3
router.get('/analytics/categories', analyticsController.getCategoryStats);
router.get('/analytics/monthly', analyticsController.getMonthlyStats);

module.exports = router;