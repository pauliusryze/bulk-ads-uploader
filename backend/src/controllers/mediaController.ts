import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { UploadedMedia, UploadResponse } from '../types';
import fs from 'fs-extra';
import path from 'path';

// In-memory storage for uploaded media (in production, use a database)
const uploadedMediaMap: Map<string, UploadedMedia> = new Map();

/**
 * Upload multiple media files (images and videos)
 * POST /api/media/upload
 */
export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const files = req.files as Express.Multer.File[];
    const uploadedMedia: UploadedMedia[] = [];
    const failedUploads: string[] = [];

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.ensureDir(uploadsDir);

    for (const file of files) {
      try {
        const mediaId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const filename = `${mediaId}${fileExtension}`;
        const filePath = path.join(uploadsDir, filename);

        // Determine media type
        const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';

        let dimensions = { width: 0, height: 0 };
        let duration: number | undefined;

        if (mediaType === 'image') {
          // Process image with sharp
          const image = sharp(file.buffer);
          const metadata = await image.metadata();
          dimensions = {
            width: metadata.width || 0,
            height: metadata.height || 0
          };

          // Save processed image
          await image.toFile(filePath);
        } else {
          // For videos, just save the file (in production, you might want to process videos)
          await fs.writeFile(filePath, file.buffer);
          // Note: Getting video dimensions and duration would require additional libraries
          dimensions = { width: 0, height: 0 };
          duration = undefined;
        }

        const uploadedMediaItem: UploadedMedia = {
          id: mediaId,
          filename: filename,
          originalName: file.originalname,
          url: `/uploads/${filename}`,
          size: file.size,
          mimeType: file.mimetype,
          mediaType: mediaType,
          dimensions: dimensions,
          duration: duration,
          uploadedAt: new Date().toISOString()
        };

        uploadedMediaMap.set(mediaId, uploadedMediaItem);
        uploadedMedia.push(uploadedMediaItem);

        logger.info('Media uploaded successfully', {
          mediaId: mediaId,
          originalName: file.originalname,
          mediaType: mediaType,
          size: file.size
        });

      } catch (error) {
        const errorMsg = `Failed to upload ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        failedUploads.push(errorMsg);
        logger.error('Media upload failed', {
          originalName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const response: UploadResponse = {
      uploadedMedia,
      totalUploaded: uploadedMedia.length,
      failedUploads
    };

    res.status(200).json({
      success: true,
      data: response,
      message: `Successfully uploaded ${uploadedMedia.length} media files`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to upload media', {
      error: error instanceof Error ? error.message : 'Unknown error',
      files: req.files?.length || 0
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code || 'UPLOAD_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to upload media. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all uploaded media
 * GET /api/media
 */
export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = Array.from(uploadedMediaMap.values());

    res.status(200).json({
      success: true,
      data: {
        media,
        total: media.length
      },
      message: `Retrieved ${media.length} media files`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get media', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve media',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete a specific media file
 * DELETE /api/media/:id
 */
export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const media = uploadedMediaMap.get(id);

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', media.filename);
    try {
      await fs.remove(filePath);
    } catch (error) {
      logger.warn('Failed to delete file from filesystem', {
        mediaId: id,
        filePath: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Remove from memory storage
    uploadedMediaMap.delete(id);

    logger.info('Media deleted successfully', {
      mediaId: id,
      originalName: media.originalName
    });

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to delete media', {
      error: error instanceof Error ? error.message : 'Unknown error',
      mediaId: req.params.id
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code || 'DELETE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete media',
      timestamp: new Date().toISOString()
    });
  }
}; 