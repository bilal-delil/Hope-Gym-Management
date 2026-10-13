const express = require('express');
const membershipPlansController = require('../controllers/membershipPlansController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', membershipPlansController.list);
router.get('/:id', membershipPlansController.getById);
router.post(
  '/',
  membershipPlansController.createValidators,
  validate,
  membershipPlansController.create
);
router.put(
  '/:id',
  membershipPlansController.updateValidators,
  validate,
  membershipPlansController.update
);
router.delete('/:id', membershipPlansController.remove);

module.exports = router;
