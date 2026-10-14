const express = require('express');
const membersController = require('../controllers/membersController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', membersController.list);
router.get('/:id', membersController.getById);
router.post(
  '/',
  membersController.createValidators,
  validate,
  membersController.create
);
router.put(
  '/:id',
  membersController.updateValidators,
  validate,
  membersController.update
);
router.delete('/:id', membersController.remove);

module.exports = router;
