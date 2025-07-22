"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../middleware/upload");
const imageController_1 = require("../controllers/imageController");
const router = (0, express_1.Router)();
router.post('/upload', upload_1.upload.array('images', 10), imageController_1.uploadImages);
router.get('/', imageController_1.getImages);
router.delete('/:id', imageController_1.deleteImage);
exports.default = router;
//# sourceMappingURL=images.js.map