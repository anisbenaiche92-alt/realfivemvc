const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        // Les images iront dans public/uploads
        callback(null, 'public/uploads'); 
    },
    filename: (req, file, callback) => {
        // On génère un nom unique pour éviter les doublons
        const name = file.originalname.split(' ').join('_').split('.')[0];
        const extension = path.extname(file.originalname);
        callback(null, name + '_' + Date.now() + extension);
    }
});

module.exports = multer({ storage: storage });