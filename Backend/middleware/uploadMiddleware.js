const multer = require('multer'); // Import multer for handling file uploads
const path = require('path'); // Import path for handling file paths

// Storage configuration
// Define WHERE to save files and WHAT to name them
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // save files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        // e.g., '177237-visitor.jpg' - we use timestamp + original name to avoid conflicts
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-'); 
        cb(null, uniqueName); // save files with a unique name
    }
});

// File filter configuration
// create a filter so people can't upload PDFs or other files (upload only images)
const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // accept the file
        
    } else {
        cb(new Error('Only image files are allowed'), false); // reject the file
    }
};

// Export multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // limit file size to 5MB
    },
});

module.exports = upload;
