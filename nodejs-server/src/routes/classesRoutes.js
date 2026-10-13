const express = require('express');
const classesController = require('../controllers/classesController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', classesController.list);
router.get('/:id', classesController.getById);
router.post(
  '/',
  classesController.createValidators,
  validate,
  classesController.create
);
router.put(
  '/:id',
  classesController.updateValidators,
  validate,
  classesController.update
);
router.delete('/:id', classesController.remove);

module.exports = router;
