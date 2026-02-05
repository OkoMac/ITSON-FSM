import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { getFileUrl } from '../middleware/upload';

export const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next(new ApiError('No file uploaded', 400));
    }

    const fileUrl = getFileUrl(req, req.file.path);

    res.status(200).json({
      status: 'success',
      data: {
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          path: req.file.path,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleFiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return next(new ApiError('No files uploaded', 400));
    }

    const files = (req.files as Express.Multer.File[]).map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: getFileUrl(req, file.path),
      path: file.path,
    }));

    res.status(200).json({
      status: 'success',
      results: files.length,
      data: { files },
    });
  } catch (error) {
    next(error);
  }
};
