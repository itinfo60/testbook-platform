import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '../../config/supabase.js';
import multer from 'multer';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import config from '../../config/index.js';
import prisma from '../../config/prisma.js';

// Increment storageUsed for the tenant (non-blocking)
function trackStorageUsed(tenantId, bytes) {
  if (!tenantId || !bytes) return;
  prisma.institute
    .update({
      where: { id: tenantId },
      data: { storageUsed: { increment: bytes } },
    })
    .catch(() => {});
}

// Decrement storageUsed for the tenant (non-blocking)
function trackStorageFreed(tenantId, bytes) {
  if (!tenantId || !bytes) return;
  prisma.institute
    .update({
      where: { id: tenantId },
      data: { storageUsed: { decrement: bytes } },
    })
    .catch(() => {});
}

// Memory storage for direct Supabase streaming (no disk write)
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|mov|mkv|webm|pdf|doc|docx|zip|csv|xlsx/;
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (allowed.test(ext)) return cb(null, true);
  cb(new ApiError(400, `File type .${ext} is not allowed`));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 104857600, files: 5 }, // 100MB max per file
}).single('file');

/**
 * POST /api/v1/uploads/image — Upload image to Supabase Storage
 */
export const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const folder = req.query.folder || 'images';
  const result = await uploadToSupabaseStorage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder
  );

  trackStorageUsed(req.tenantId, result.bytes);

  ApiResponse.ok(
    res,
    {
      url: result.url,
      publicId: result.path,
      path: result.path,
      format: result.format,
      bytes: result.bytes,
    },
    'Image uploaded successfully'
  );
});

/**
 * POST /api/v1/uploads/video — Upload video to Supabase Storage
 */
export const uploadVideo = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const folder = req.query.folder || 'videos';
  const result = await uploadToSupabaseStorage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder
  );

  trackStorageUsed(req.tenantId, result.bytes);

  ApiResponse.ok(
    res,
    {
      url: result.url,
      publicId: result.path,
      path: result.path,
      format: result.format,
      bytes: result.bytes,
      mp4Url: result.url,
    },
    'Video uploaded successfully'
  );
});

/**
 * POST /api/v1/uploads/document — Upload PDF/doc to Supabase Storage
 */
export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const folder = req.query.folder || 'documents';
  const result = await uploadToSupabaseStorage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder
  );

  trackStorageUsed(req.tenantId, result.bytes);

  ApiResponse.ok(
    res,
    {
      url: result.url,
      publicId: result.path,
      path: result.path,
      bytes: result.bytes,
      format: result.format,
    },
    'Document uploaded successfully'
  );
});

/**
 * DELETE /api/v1/uploads/:publicId — Delete from Supabase Storage
 */
export const deleteFile = catchAsync(async (req, res) => {
  const { publicId } = req.params;
  const decodedPath = decodeURIComponent(publicId);

  await deleteFromSupabaseStorage(decodedPath);

  ApiResponse.ok(res, null, 'File deleted successfully');
});
