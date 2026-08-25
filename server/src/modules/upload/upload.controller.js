import cloudinary from 'cloudinary';
import { Readable } from 'stream';
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

// Memory storage for direct Cloudinary streaming (no disk write)
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|mkv|webm|pdf|doc|docx/;
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (allowed.test(ext)) return cb(null, true);
  cb(new ApiError(400, `File type .${ext} is not allowed`));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 52428800, files: 5 }, // 50MB max per file
}).single('file');

const uploadToCloudinary = (buffer, folder, resourceType = 'auto', options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: `civicshub/${folder}`,
        resource_type: resourceType,
        ...options,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });

/**
 * POST /api/v1/uploads/image — Upload image to Cloudinary
 */
export const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const folder = req.query.folder || 'general';
  const result = await uploadToCloudinary(req.file.buffer, folder, 'image', {
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  trackStorageUsed(req.tenantId, result.bytes);

  ApiResponse.ok(
    res,
    {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    },
    'Image uploaded'
  );
});

/**
 * POST /api/v1/uploads/video — Upload video to Cloudinary with eager HLS transcoding
 */
export const uploadVideo = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const result = await uploadToCloudinary(req.file.buffer, 'videos', 'video', {
    eager: [
      { streaming_profile: 'hd', format: 'm3u8' },
      { width: 1280, height: 720, crop: 'scale', format: 'mp4' },
    ],
    eager_async: true,
    eager_notification_url: process.env.CLOUDINARY_WEBHOOK_URL || undefined,
  });

  trackStorageUsed(req.tenantId, result.bytes);

  ApiResponse.ok(
    res,
    {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      hlsUrl: result.eager?.[0]?.secure_url || null,
      mp4Url: result.eager?.[1]?.secure_url || null,
    },
    'Video uploaded. Transcoding in progress.'
  );
});

/**
 * POST /api/v1/uploads/document — Upload PDF/doc to Cloudinary
 */
export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');

  const result = await uploadToCloudinary(req.file.buffer, 'documents', 'raw');

  trackStorageUsed(req.tenantId, result.bytes);

  ApiResponse.ok(
    res,
    {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    },
    'Document uploaded'
  );
});

/**
 * DELETE /api/v1/uploads/:publicId — Delete from Cloudinary
 */
export const deleteFile = catchAsync(async (req, res) => {
  const { publicId } = req.params;
  const { type = 'image' } = req.query;

  const result = await cloudinary.v2.uploader.destroy(publicId, { resource_type: type });

  // Cloudinary returns bytes in destroy result only for some resource types;
  // fetch resource details first if bytes are needed for accurate tracking
  if (result.result === 'ok' && req.tenantId) {
    try {
      const info = await cloudinary.v2.api.resource(publicId, { resource_type: type });
      trackStorageFreed(req.tenantId, info.bytes);
    } catch {
      // Non-critical — storage count will drift slightly, acceptable
    }
  }

  ApiResponse.ok(res, null, 'File deleted');
});
