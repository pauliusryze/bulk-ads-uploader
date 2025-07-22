"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), 'env.local') });
dotenv_1.default.config();
require("./server");
logger_1.logger.info('Starting Facebook Ads Bulk Uploader Backend...');
//# sourceMappingURL=index.js.map