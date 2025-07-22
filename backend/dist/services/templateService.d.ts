import { AdTemplate, CreateTemplateRequest, UpdateTemplateRequest, TemplateListResponse } from '../types';
export declare class TemplateService {
    private static instance;
    private constructor();
    static getInstance(): TemplateService;
    createTemplate(data: CreateTemplateRequest): Promise<AdTemplate>;
    getTemplates(page?: number, limit?: number, search?: string): Promise<TemplateListResponse>;
    getTemplate(templateId: string): Promise<AdTemplate>;
    updateTemplate(templateId: string, data: UpdateTemplateRequest): Promise<AdTemplate>;
    deleteTemplate(templateId: string): Promise<void>;
    getTemplateCount(): number;
}
//# sourceMappingURL=templateService.d.ts.map