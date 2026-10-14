const express = require('express');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

router.get('/', bookingsController.list);
router.put('/:id', bookingsController.update);
router.delete('/:id', bookingsController.remove);

module.exports = router;
