const express = require('express');
const announcementsController = require('../controllers/announcementsController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', announcementsController.list);
router.get('/:id', announcementsController.getById);
router.post(
  '/',
  announcementsController.createValidators,
  validate,
  announcementsController.create
);
router.put(
  '/:id',
  announcementsController.updateValidators,
  validate,
  announcementsController.update
);
router.delete('/:id', announcementsController.remove);

module.exports = router;
