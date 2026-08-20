const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadRoot = path.join(__dirname, '..', 'uploads');
const destinations = {
  logo: path.join(uploadRoot, 'business-logo'),
  cover: path.join(uploadRoot, 'business-cover'),
  food: path.join(uploadRoot, 'food-images'),
  volunteerProfile: path.join(uploadRoot, 'volunteer-profile'),
  deliveryProof: path.join(uploadRoot, 'delivery-proof')
};
Object.values(destinations).forEach(folder => fs.mkdirSync(folder, { recursive: true }));

const storage = multer.diskStorage({
  destination: (req, _file, callback) => callback(null, destinations[req.uploadImageType]),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

const imageFilter = (_req, file, callback) => {
  const allowed = ['image/png', 'image/jpeg'];
  if (!allowed.includes(file.mimetype)) return callback(new Error('Only PNG, JPG, and JPEG files are allowed.'));
  callback(null, true);
};

const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadLogo = (req, res, next) => { req.uploadImageType = 'logo'; upload.single('image')(req, res, next); };
const uploadCover = (req, res, next) => { req.uploadImageType = 'cover'; upload.single('image')(req, res, next); };
const foodFilter = (_req, file, callback) => {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return callback(new Error('Only PNG, JPG, JPEG, and WEBP files are allowed.'));
  callback(null, true);
};
const foodUpload = multer({ storage, fileFilter: foodFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadFoodImages = (req, res, next) => { req.uploadImageType = 'food'; foodUpload.array('images', 5)(req, res, next); };
const volunteerUpload = multer({ storage, fileFilter: foodFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadVolunteerProfile = (req, res, next) => {
  req.uploadImageType = 'volunteerProfile';
  req.uploadImageMaxSize = '5MB';
  volunteerUpload.single('image')(req, res, next);
};
const uploadDeliveryProof = (req, res, next) => {
  req.uploadImageType = 'deliveryProof';
  req.uploadImageMaxSize = '5MB';
  volunteerUpload.single('image')(req, res, next);
};

module.exports = { uploadLogo, uploadCover, uploadFoodImages, uploadVolunteerProfile, uploadDeliveryProof };
