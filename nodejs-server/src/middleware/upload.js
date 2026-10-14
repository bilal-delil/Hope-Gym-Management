const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const paymentsDir = path.join(process.cwd(), 'uploads', 'payments');

fs.mkdirSync(paymentsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
      ? ext
      : '.jpg';
    cb(null, `payment-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new ApiError(400, 'Payment proof must be an image file'));
    return;
  }
  cb(null, true);
}

const uploadPaymentProof = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single('proofImage');

function handlePaymentProofUpload(req, res, next) {
  uploadPaymentProof(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Payment proof image must be 5MB or smaller'));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) {
      return next(err);
    }
    return next();
  });
}

module.exports = {
  handlePaymentProofUpload,
  paymentsDir,
};
