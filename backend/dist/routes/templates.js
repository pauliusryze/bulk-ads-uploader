"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../middleware/validation");
const templateController_1 = require("../controllers/templateController");
const router = (0, express_1.Router)();
router.post('/', validation_1.validateTemplateRequest, templateController_1.createTemplate);
router.get('/', validation_2.validatePagination, templateController_1.getTemplates);
router.get('/:id', templateController_1.getTemplate);
router.put('/:id', validation_1.validateTemplateRequest, templateController_1.updateTemplate);
router.delete('/:id', templateController_1.deleteTemplate);
exports.default = router;
//# sourceMappingURL=templates.js.map