"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.getMedia = exports.uploadMedia = void 0;
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uploadedMediaMap = new Map();
const uploadMedia = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            throw new errors_1.AppError('No files uploaded', 400);
        }
        const files = req.files;
        const uploadedMedia = [];
        const failedUploads = [];
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
        await fs_extra_1.default.ensureDir(uploadsDir);
        for (const file of files) {
            try {
                const mediaId = (0, uuid_1.v4)();
                const fileExtension = path_1.default.extname(file.originalname);
                const filename = `${mediaId}${fileExtension}`;
                const filePath = path_1.default.join(uploadsDir, filename);
                const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
                let dimensions = { width: 0, height: 0 };
                let duration;
                if (mediaType === 'image') {
                    const image = (0, sharp_1.default)(file.buffer);
                    const metadata = await image.metadata();
                    dimensions = {
                        width: metadata.width || 0,
                        height: metadata.height || 0
                    };
                    await image.toFile(filePath);
                }
                else {
                    await fs_extra_1.default.writeFile(filePath, file.buffer);
                    dimensions = { width: 0, height: 0 };
                    duration = undefined;
                }
                const uploadedMediaItem = {
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
                logger_1.logger.info('Media uploaded successfully', {
                    mediaId: mediaId,
                    originalName: file.originalname,
                    mediaType: mediaType,
                    size: file.size
                });
            }
            catch (error) {
                const errorMsg = `Failed to upload ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                failedUploads.push(errorMsg);
                logger_1.logger.error('Media upload failed', {
                    originalName: file.originalname,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        const response = {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to upload media', {
            error: error instanceof Error ? error.message : 'Unknown error',
            files: req.files?.length || 0
        });
        if (error instanceof errors_1.AppError) {
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
exports.uploadMedia = uploadMedia;
const getMedia = async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get media', {
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
exports.getMedia = getMedia;
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const media = uploadedMediaMap.get(id);
        if (!media) {
            throw new errors_1.AppError('Media not found', 404);
        }
        const filePath = path_1.default.join(process.cwd(), 'uploads', media.filename);
        try {
            await fs_extra_1.default.remove(filePath);
        }
        catch (error) {
            logger_1.logger.warn('Failed to delete file from filesystem', {
                mediaId: id,
                filePath: filePath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        uploadedMediaMap.delete(id);
        logger_1.logger.info('Media deleted successfully', {
            mediaId: id,
            originalName: media.originalName
        });
        res.status(200).json({
            success: true,
            message: 'Media deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete media', {
            error: error instanceof Error ? error.message : 'Unknown error',
            mediaId: req.params.id
        });
        if (error instanceof errors_1.AppError) {
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
exports.deleteMedia = deleteMedia;
//# sourceMappingURL=mediaController.js.map