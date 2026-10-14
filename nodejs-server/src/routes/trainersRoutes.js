const express = require('express');
const trainersController = require('../controllers/trainersController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', trainersController.list);
router.get('/:id', trainersController.getById);
router.post(
  '/',
  trainersController.createValidators,
  validate,
  trainersController.create
);
router.put(
  '/:id',
  trainersController.updateValidators,
  validate,
  trainersController.update
);
router.delete('/:id', trainersController.remove);

module.exports = router;
