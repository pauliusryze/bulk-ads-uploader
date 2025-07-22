"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
const adController_1 = require("../controllers/adController");
const router = (0, express_1.Router)();
router.post('/bulk', validation_1.validateBulkAdRequest, adController_1.createBulkAds);
router.get('/jobs', adController_1.getAllJobs);
router.get('/jobs/:jobId', adController_1.getJobStatus);
router.delete('/jobs/:jobId', adController_1.deleteJob);
exports.default = router;
//# sourceMappingURL=ads.js.map