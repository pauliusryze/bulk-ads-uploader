import { Request, Response } from 'express';
import { UploadedImage, UploadResponse } from '../types';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for uploaded images (in production, use a database)
const uploadedImagesMap: Map<string, UploadedImage> = new Map();

/**
 * Upload multiple images
 * POST /api/images/upload
 */
export const uploadImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'FILE_UPLOAD_ERROR',
        message: 'No files uploaded',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const uploadedImages: UploadedImage[] = [];
    const failedUploads: string[] = [];

    for (const file of files) {
      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          failedUploads.push(`${file.originalname} - Invalid file type`);
          continue;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          failedUploads.push(`${file.originalname} - File too large (max 10MB)`);
          continue;
        }

        // Process image with Sharp
        const imageBuffer = await sharp(file.buffer)
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Get image dimensions
        const metadata = await sharp(file.buffer).metadata();
        
        // Generate unique filename
        const imageId = uuidv4();
        const filename = `${imageId}.jpg`;
        const uploadPath = path.join(process.cwd(), 'uploads', filename);

        // Ensure uploads directory exists
        await fs.ensureDir(path.dirname(uploadPath));

        // Save processed image
        await fs.writeFile(uploadPath, imageBuffer);

        // Create image record
        const uploadedImage: UploadedImage = {
          id: imageId,
          filename: filename,
          originalName: file.originalname,
          url: `/uploads/${filename}`,
          size: imageBuffer.length,
          mimeType: 'image/jpeg',
          dimensions: {
            width: metadata.width || 0,
            height: metadata.height || 0
          },
          uploadedAt: new Date()
        };

        // Store in memory (in production, save to database)
        uploadedImagesMap.set(imageId, uploadedImage);
        uploadedImages.push(uploadedImage);

        logger.info('Image uploaded successfully', {
          imageId: imageId,
          originalName: file.originalname,
          size: imageBuffer.length
        });

      } catch (error) {
        logger.error('Failed to process image', {
          originalName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failedUploads.push(`${file.originalname} - Processing failed`);
      }
    }

    const response: UploadResponse = {
      uploadedMedia: uploadedImages.map(img => ({
        ...img,
        mediaType: 'image' as const,
        uploadedAt: img.uploadedAt.toISOString()
      })),
      totalUploaded: uploadedImages.length,
      failedUploads
    };

    res.status(200).json({
      success: true,
      data: response,
      message: `Successfully uploaded ${uploadedImages.length} images`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Image upload error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'FILE_UPLOAD_ERROR',
      message: 'Failed to upload images. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all uploaded images
 * GET /api/images
 */
export const getImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const images = Array.from(uploadedImagesMap.values());
    
    res.status(200).json({
      success: true,
      data: {
        images,
        total: images.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get images', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve images',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete a specific image
 * DELETE /api/images/:id
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const image = uploadedImagesMap.get(id);

    if (!image) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Image not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', image.filename);
    try {
      await fs.remove(filePath);
    } catch (fileError) {
      logger.warn('Failed to delete image file', {
        imageId: id,
        filename: image.filename,
        error: fileError instanceof Error ? fileError.message : 'Unknown error'
      });
    }

    // Remove from memory
    uploadedImagesMap.delete(id);

    logger.info('Image deleted successfully', {
      imageId: id,
      filename: image.filename
    });

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to delete image', {
      imageId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete image',
      timestamp: new Date().toISOString()
    });
  }
}; 