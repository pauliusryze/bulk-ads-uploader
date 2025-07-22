"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const media_1 = __importDefault(require("./routes/media"));
const templates_1 = __importDefault(require("./routes/templates"));
const ads_1 = __importDefault(require("./routes/ads"));
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN'] || process.env['FRONTEND_URL'] || 'https://localhost:3000',
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(15 * 60 / 60),
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(15 * 60 / 60),
            timestamp: new Date().toISOString()
        });
    }
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static('uploads'));
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/media', media_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/ads', ads_1.default);
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Route not found',
        timestamp: new Date().toISOString()
    });
});
app.use(errorHandler_1.errorHandler);
const sslOptions = {
    key: fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'localhost-key.pem')),
    cert: fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'localhost.pem'))
};
https_1.default.createServer(sslOptions, app).listen(PORT, () => {
    logger_1.logger.info(`HTTPS Server is running on port ${PORT}`, {
        port: PORT,
        protocol: 'https',
        environment: process.env['NODE_ENV'] || 'development'
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map