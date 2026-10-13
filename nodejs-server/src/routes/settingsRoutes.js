const express = require('express');
const settingsController = require('../controllers/settingsController');
const validate = require('../middleware/validate');
const { authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', settingsController.list);
router.get('/:key', settingsController.getByKey);
router.put(
  '/',
  authorize('admin'),
  settingsController.upsertValidators,
  validate,
  settingsController.upsert
);
router.delete('/:key', authorize('admin'), settingsController.remove);

module.exports = router;
