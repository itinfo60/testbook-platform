import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Check,
  Loader2,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadsAPI } from '@/services/api';

/**
 * FileUploadInput: Universal component providing both file upload to Supabase Storage and manual URL entry.
 *
 * Props:
 * - label: string (e.g. "Course Thumbnail", "Logo URL")
 * - value: string (current URL)
 * - onChange: (url: string) => void
 * - type: 'image' | 'video' | 'document' | 'all' (default: 'image')
 * - folder: string (default: 'general')
 * - placeholder: string
 * - hint: string
 * - required: boolean
 * - accept: string (e.g. "image/*", ".pdf,.doc,.docx", "video/*")
 */
export default function FileUploadInput({
  label,
  value = '',
  onChange,
  type = 'image',
  folder = 'general',
  placeholder = 'https://...',
  hint,
  required = false,
  accept,
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const getAccept = () => {
    if (accept) return accept;
    if (type === 'image') return 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
    if (type === 'video') return 'video/mp4,video/webm,video/mkv,video/quicktime';
    if (type === 'document') return '.pdf,.doc,.docx,.zip,.xlsx,.csv';
    return '*/*';
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name} to Supabase...`);

    try {
      let res;
      if (type === 'video') {
        res = await uploadsAPI.uploadVideo(file, folder);
      } else if (type === 'document') {
        res = await uploadsAPI.uploadDocument(file, folder);
      } else {
        res = await uploadsAPI.uploadImage(file, folder);
      }

      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        toast.success('Uploaded successfully!', { id: toastId });
      } else {
        throw new Error('Upload completed but URL not received');
      }
    } catch (err) {
      console.error('Supabase upload failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearValue = () => {
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlInput ? 'Hide URL field' : 'Enter URL manually'}
        </button>
      </div>

      {/* Upload Zone & URL Display */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={getAccept()}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{uploading ? 'Uploading to Supabase...' : 'Upload File'}</span>
          </button>

          {/* Active URL badge or Clear */}
          {value ? (
            <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs min-w-0">
              <span
                className="truncate text-gray-600 dark:text-gray-300 font-mono text-[11px]"
                title={value}
              >
                {value}
              </span>
              <button
                type="button"
                onClick={clearValue}
                className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors ml-2 shrink-0 cursor-pointer"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-gray-400 italic">No file selected</span>
          )}
        </div>

        {/* Manual URL Input (Collapsible or directly editable) */}
        {showUrlInput && (
          <div className="animate-fade-in pt-1">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white font-mono"
            />
          </div>
        )}

        {/* Preview based on type & value */}
        {value && (
          <div className="pt-1">
            {type === 'image' && /^https?:\/\//.test(value) && (
              <div className="relative inline-block group">
                <img
                  src={value}
                  alt="Upload preview"
                  className="h-24 w-auto max-w-xs object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              </div>
            )}
            {type === 'video' && /^https?:\/\//.test(value) && (
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <VideoIcon className="w-4 h-4" />
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate max-w-sm"
                >
                  Preview video in new tab &rarr;
                </a>
              </div>
            )}
            {type === 'document' && /^https?:\/\//.test(value) && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate max-w-sm"
                >
                  View uploaded document &rarr;
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
