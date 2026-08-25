import { v2 as cloudinary } from 'cloudinary';
import config from './index.js';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export const uploadToCloudinary = async (filePath, options = {}) => {
  const defaults = {
    folder: 'civicsedu',
    resource_type: 'auto',
    quality: 'auto:good',
    fetch_format: 'auto',
  };

  try {
    const result = await cloudinary.uploader.upload(filePath, { ...defaults, ...options });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    logger.error('Cloudinary upload failed:', error.message);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    logger.error('Cloudinary delete failed:', error.message);
    return false;
  }
};

export default cloudinary;
