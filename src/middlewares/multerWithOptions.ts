import multer from 'multer';


export default multer({
    limits: { 
        fileSize: 1024 * 1024 * 5, // Максимальный размер файла в байтах для multipart-форм
        fields: 50, // Максимальное количество не-файловых полей
        files: 20, // Максимальное количество полей с файлами для multipart-форм
    },
    fileFilter: function(req, file, cb) {
        if (
            file.mimetype === 'image/jpeg' || 
            file.mimetype === 'image/jpg' || 
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/webp'
        ) {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    },
}).array('files')
