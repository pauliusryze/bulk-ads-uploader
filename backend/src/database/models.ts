import supabase from './config';

// Database table schemas (these will be created in Supabase dashboard)
export const createTables = async (): Promise<void> => {
  // Tables are created via Supabase dashboard or migrations
  // This function is kept for compatibility but tables should be created in Supabase
  console.log('Tables should be created in Supabase dashboard');
};

// User model
export class User {
  static async create(facebookUserId: string, accessToken: string, adAccountId: string, permissions?: any) {
    const { data, error } = await supabase
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

    if (error) throw error;
    return data;
  }

  static async findByFacebookId(facebookUserId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('facebook_user_id', facebookUserId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

// Job model
export class Job {
  static async create(userId: number, jobId: string, totalItems: number) {
    const { data, error } = await supabase
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

    if (error) throw error;
    return data;
  }

  static async updateProgress(jobId: string, progress: number, completedItems: number, failedItems: number) {
    const { data, error } = await supabase
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

    if (error) throw error;
    return data;
  }

  static async updateStatus(jobId: string, status: string, resultData?: any, errorMessage?: string) {
    const { data, error } = await supabase
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

    if (error) throw error;
    return data;
  }

  static async findById(jobId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByUserId(userId: number) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

// Ad History model
export class AdHistory {
  static async create(userId: number, jobId: string, adData: any) {
    const { data, error } = await supabase
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

    if (error) throw error;
    return data;
  }

  static async findByJobId(jobId: string) {
    const { data, error } = await supabase
      .from('ad_history')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
} 