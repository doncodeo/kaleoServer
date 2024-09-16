const multer = require('multer');
const path = require('path');

// Multer config
const upload = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            return cb(new Error('Only .jpg, .jpeg, and .png files are allowed'));
        }
        cb(null, true);
    }
});

module.exports = upload;
