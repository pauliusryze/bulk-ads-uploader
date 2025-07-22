"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdHistory = exports.Job = exports.User = exports.createTables = void 0;
const config_1 = __importDefault(require("./config"));
const createTables = async () => {
    console.log('Tables should be created in Supabase dashboard');
};
exports.createTables = createTables;
class User {
    static async create(facebookUserId, accessToken, adAccountId, permissions) {
        const { data, error } = await config_1.default
            .from('users')
            .upsert({
            facebook_user_id: facebookUserId,
            access_token: accessToken,
            ad_account_id: adAccountId,
            permissions: permissions,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'facebook_user_id'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async findByFacebookId(facebookUserId) {
        const { data, error } = await config_1.default
            .from('users')
            .select('*')
            .eq('facebook_user_id', facebookUserId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
}
exports.User = User;
class Job {
    static async create(userId, jobId, totalItems) {
        const { data, error } = await config_1.default
            .from('jobs')
            .insert({
            user_id: userId,
            job_id: jobId,
            total_items: totalItems,
            status: 'pending',
            progress: 0,
            completed_items: 0,
            failed_items: 0
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async updateProgress(jobId, progress, completedItems, failedItems) {
        const { data, error } = await config_1.default
            .from('jobs')
            .update({
            progress: progress,
            completed_items: completedItems,
            failed_items: failedItems,
            updated_at: new Date().toISOString()
        })
            .eq('job_id', jobId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async updateStatus(jobId, status, resultData, errorMessage) {
        const { data, error } = await config_1.default
            .from('jobs')
            .update({
            status: status,
            result: resultData,
            error_message: errorMessage,
            updated_at: new Date().toISOString()
        })
            .eq('job_id', jobId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async findById(jobId) {
        const { data, error } = await config_1.default
            .from('jobs')
            .select('*')
            .eq('job_id', jobId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
    static async findByUserId(userId) {
        const { data, error } = await config_1.default
            .from('jobs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
}
exports.Job = Job;
class AdHistory {
    static async create(userId, jobId, adData) {
        const { data, error } = await config_1.default
            .from('ad_history')
            .insert({
            user_id: userId,
            job_id: jobId,
            campaign_id: adData.campaignId,
            ad_set_id: adData.adSetId,
            ad_id: adData.adId,
            ad_name: adData.adName,
            ad_copy: adData.adCopy,
            media_url: adData.mediaUrl,
            status: adData.status,
            facebook_response: adData.facebookResponse
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async findByJobId(jobId) {
        const { data, error } = await config_1.default
            .from('ad_history')
            .select('*')
            .eq('job_id', jobId)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        return data;
    }
}
exports.AdHistory = AdHistory;
//# sourceMappingURL=models.js.map