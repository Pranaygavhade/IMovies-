const express = require('express');
const router = express.Router();
const { getCities, getNearestCity, detectCityByIp } = require('../controllers/cityController');

router.get('/', getCities);
router.get('/nearest', getNearestCity);
router.get('/detect-ip', detectCityByIp);

module.exports = router;
