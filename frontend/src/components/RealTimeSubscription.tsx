import React, { useEffect } from 'react';
import supabase from '../lib/supabase';

interface RealTimeSubscriptionProps {
  currentJobId: string | null;
  onProgressUpdate: (progress: number, message: string) => void;
  onJobComplete: (result: any) => void;
  onJobFailed: (error: string) => void;
}

export function useRealTimeSubscription({
  currentJobId,
  onProgressUpdate,
  onJobComplete,
  onJobFailed
}: RealTimeSubscriptionProps) {
  useEffect(() => {
    if (!currentJobId) return;

    const subscription = supabase
      .channel('job-progress')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: `job_id=eq.${currentJobId}`
      }, (payload) => {
        console.log('Job progress updated:', payload.new);
        
        // Update progress state
        if (payload.new) {
          const jobData = payload.new as any;
          const progress = jobData.progress || 0;
          const message = `Completed: ${jobData.completed_items}/${jobData.total_items} ads`;
          
          onProgressUpdate(progress, message);
          
          // Handle job completion
          if (jobData.status === 'completed') {
            onJobComplete(jobData.result);
          } else if (jobData.status === 'failed') {
            onJobFailed(jobData.error_message || "An error occurred");
          }
        }
      })
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [currentJobId, onProgressUpdate, onJobComplete, onJobFailed]);
} 