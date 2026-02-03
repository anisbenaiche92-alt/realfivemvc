// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Vérification du dossier
if (!fs.existsSync('public/uploads')) fs.mkdirSync('public/uploads', { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, 'avatar-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

module.exports = upload;
