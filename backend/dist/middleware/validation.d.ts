import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export declare const facebookAuthSchema: Joi.ObjectSchema<any>;
export declare const templateSchema: Joi.ObjectSchema<any>;
export declare const bulkAdSchema: Joi.ObjectSchema<any>;
export declare const validateRequest: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAuthRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateTemplateRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateBulkAdRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePagination: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map