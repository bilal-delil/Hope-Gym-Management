const express = require('express');
const contentController = require('../controllers/contentController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', contentController.list);
router.get('/:id', contentController.getById);
router.post(
  '/',
  contentController.createValidators,
  validate,
  contentController.create
);
router.put(
  '/:id',
  contentController.updateValidators,
  validate,
  contentController.update
);
router.delete('/:id', contentController.remove);

module.exports = router;
