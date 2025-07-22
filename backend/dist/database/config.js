"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../utils/logger");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseUrl || !supabaseServiceKey) {
    logger_1.logger.error('Missing Supabase configuration', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
    });
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
(async () => {
    try {
        await supabase.from('users').select('count').limit(1);
        logger_1.logger.info('Connected to Supabase database');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Supabase', error);
    }
})();
exports.default = supabase;
//# sourceMappingURL=config.js.map