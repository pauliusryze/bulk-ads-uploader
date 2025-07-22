"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/validate', validation_1.validateAuthRequest, authController_1.validateFacebookCredentials);
router.get('/status', authController_1.getAuthStatus);
exports.default = router;
//# sourceMappingURL=auth.js.map