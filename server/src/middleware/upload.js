import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploads.dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp|svg/;
  const allowedVideos = /mp4|avi|mov|mkv|webm/;
  const allowedDocs = /pdf|doc|docx|ppt|pptx|xls|xlsx/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const isAllowed = allowedImages.test(ext) || allowedVideos.test(ext) || allowedDocs.test(ext);

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type .${ext} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads.maxSize,
    files: 10,
  },
});

export const uploadSingle = (fieldName = 'file') => upload.single(fieldName);
export const uploadMultiple = (fieldName = 'files', maxCount = 10) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);

export default upload;
