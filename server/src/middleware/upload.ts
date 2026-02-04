import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ApiError } from './errorHandler';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type } = req.body;
    let folder = 'documents';

    // Organize by type
    if (type === 'photo' || file.mimetype.startsWith('image/')) {
      folder = 'photos';
    } else if (type === 'document') {
      folder = 'documents';
    } else if (type === 'biometric') {
      folder = 'biometric';
    }

    const destPath = path.join(uploadDir, folder);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new ApiError('Invalid file type. Only JPEG, PNG, PDF, DOC, DOCX files are allowed.', 400));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

// Upload types
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10); // Max 10 files
export const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'document', maxCount: 5 },
]);

// Helper function to delete file
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper function to get file URL
export const getFileUrl = (req: Request, filePath: string): string => {
  const fileName = path.basename(filePath);
  const folder = path.basename(path.dirname(filePath));
  return `${req.protocol}://${req.get('host')}/uploads/${folder}/${fileName}`;
};
