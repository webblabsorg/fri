/**
 * Storage Service Abstraction
 * 
 * Provides a unified interface for file storage operations.
 * Currently supports Vercel Blob storage with S3 fallback capability.
 */

import { put, del, head } from '@vercel/blob';

export interface UploadFileParams {
  file: File | Buffer;
  fileName: string;
  contentType: string;
  metadata?: {
    projectId?: string;
    workspaceId?: string;
    organizationId?: string;
    userId: string;
    [key: string]: string | undefined;
  };
}

export interface UploadFileResult {
  storageKey: string;
  url: string;
  size: number;
}

export interface GetFileUrlParams {
  storageKey: string;
  expiresIn?: number; // seconds
}

/**
 * Upload a file to storage
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
  const { file, fileName, contentType, metadata } = params;

  try {
    // Use Vercel Blob for storage
    const blob = await put(fileName, file, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });

    return {
      storageKey: blob.url, // Using URL as storage key for Vercel Blob
      url: blob.url,
      size: blob.size,
    };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Get a signed URL for file access
 */
export async function getSignedUrl(params: GetFileUrlParams): Promise<string> {
  const { storageKey, expiresIn = 3600 } = params;

  // For Vercel Blob, the storageKey IS the URL
  // If using S3, implement signed URL generation here
  return storageKey;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(storageKey: string): Promise<{
  size: number;
  contentType: string;
  uploadedAt: Date;
} | null> {
  try {
    const headResult = await head(storageKey);
    
    if (!headResult) {
      return null;
    }

    return {
      size: headResult.size,
      contentType: headResult.contentType || 'application/octet-stream',
      uploadedAt: headResult.uploadedAt,
    };
  } catch (error) {
    console.error('[Storage] Get metadata error:', error);
    return null;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(storageKey: string): Promise<void> {
  try {
    await del(storageKey);
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Generate a presigned upload URL (for client-side direct uploads)
 */
export async function generateUploadUrl(params: {
  fileName: string;
  contentType: string;
  maxSize?: number;
}): Promise<{
  uploadUrl: string;
  storageKey: string;
}> {
  const { fileName, contentType } = params;

  // For Vercel Blob, we'll handle uploads server-side
  // This is a placeholder for future enhancement
  throw new Error('Direct client uploads not yet implemented');
}

/**
 * Validate file before upload
 */
export function validateFile(file: {
  name: string;
  size: number;
  type: string;
}, options: {
  maxSize?: number; // bytes
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  const { maxSize = 50 * 1024 * 1024, allowedTypes } = options; // Default 50MB

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Generate a safe storage key
 */
export function generateStorageKey(params: {
  projectId: string;
  fileName: string;
  userId: string;
}): string {
  const { projectId, fileName, userId } = params;
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `projects/${projectId}/${userId}/${timestamp}-${sanitizedName}`;
}
