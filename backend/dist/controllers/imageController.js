"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.getImages = exports.uploadImages = void 0;
const logger_1 = require("../utils/logger");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
const uploadedImagesMap = new Map();
const uploadImages = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({
                success: false,
                error: 'FILE_UPLOAD_ERROR',
                message: 'No files uploaded',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const uploadedImages = [];
        const failedUploads = [];
        for (const file of files) {
            try {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.mimetype)) {
                    failedUploads.push(`${file.originalname} - Invalid file type`);
                    continue;
                }
                const maxSize = 10 * 1024 * 1024;
                if (file.size > maxSize) {
                    failedUploads.push(`${file.originalname} - File too large (max 10MB)`);
                    continue;
                }
                const imageBuffer = await (0, sharp_1.default)(file.buffer)
                    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85 })
                    .toBuffer();
                const metadata = await (0, sharp_1.default)(file.buffer).metadata();
                const imageId = (0, uuid_1.v4)();
                const filename = `${imageId}.jpg`;
                const uploadPath = path_1.default.join(process.cwd(), 'uploads', filename);
                await fs_extra_1.default.ensureDir(path_1.default.dirname(uploadPath));
                await fs_extra_1.default.writeFile(uploadPath, imageBuffer);
                const uploadedImage = {
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
                uploadedImagesMap.set(imageId, uploadedImage);
                uploadedImages.push(uploadedImage);
                logger_1.logger.info('Image uploaded successfully', {
                    imageId: imageId,
                    originalName: file.originalname,
                    size: imageBuffer.length
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to process image', {
                    originalName: file.originalname,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failedUploads.push(`${file.originalname} - Processing failed`);
            }
        }
        const response = {
            uploadedMedia: uploadedImages.map(img => ({
                ...img,
                mediaType: 'image',
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
    }
    catch (error) {
        logger_1.logger.error('Image upload error', {
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
exports.uploadImages = uploadImages;
const getImages = async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get images', {
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
exports.getImages = getImages;
const deleteImage = async (req, res) => {
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
        const filePath = path_1.default.join(process.cwd(), 'uploads', image.filename);
        try {
            await fs_extra_1.default.remove(filePath);
        }
        catch (fileError) {
            logger_1.logger.warn('Failed to delete image file', {
                imageId: id,
                filename: image.filename,
                error: fileError instanceof Error ? fileError.message : 'Unknown error'
            });
        }
        uploadedImagesMap.delete(id);
        logger_1.logger.info('Image deleted successfully', {
            imageId: id,
            filename: image.filename
        });
        res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete image', {
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
exports.deleteImage = deleteImage;
//# sourceMappingURL=imageController.js.map