const express = require('express');
const membershipsController = require('../controllers/membershipsController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', membershipsController.list);
router.get('/:id', membershipsController.getById);
router.post(
  '/',
  membershipsController.createValidators,
  validate,
  membershipsController.create
);
router.put(
  '/:id',
  membershipsController.updateValidators,
  validate,
  membershipsController.update
);
router.delete('/:id', membershipsController.remove);

module.exports = router;
