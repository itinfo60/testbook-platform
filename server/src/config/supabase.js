import { createClient } from '@supabase/supabase-js';
import config from './index.js';
import crypto from 'crypto';

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured');
    }
    supabaseClient = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Upload a buffer directly to Supabase Storage and return public URL
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original file name
 * @param {string} mimetype - Content type / MIME type
 * @param {string} folder - Destination folder inside bucket
 * @returns {Promise<{ url: string, path: string, bytes: number, format: string }>}
 */
export async function uploadToSupabaseStorage(buffer, originalname, mimetype, folder = 'general') {
  const supabase = getSupabase();
  const bucketName = config.supabase.bucket;

  // Clean filename and make unique
  const ext = originalname.split('.').pop()?.toLowerCase() || 'bin';
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const cleanBaseName =
    originalname
      .substring(0, originalname.lastIndexOf('.'))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40) || 'file';

  const filePath = `${folder}/${cleanBaseName}-${Date.now()}-${randomSuffix}.${ext}`;

  // Ensure bucket exists if needed
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }
  } catch (err) {
    // Continue if bucket creation check isn't supported or bucket already exists
  }

  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
    contentType: mimetype,
    upsert: true,
  });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return {
    url: publicData.publicUrl,
    path: filePath,
    bytes: buffer.length,
    format: ext,
  };
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - Path in bucket
 */
export async function deleteFromSupabaseStorage(filePath) {
  const supabase = getSupabase();
  const bucketName = config.supabase.bucket;

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) {
    console.error('Supabase storage delete error:', error);
    throw new Error(`Failed to delete file from Supabase: ${error.message}`);
  }
  return true;
}

export default {
  getSupabase,
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage,
};
