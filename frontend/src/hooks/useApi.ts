import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type FacebookCredentials, type CreateTemplateRequest, type UpdateTemplateRequest, type BulkAdRequest, type EnhancedBulkAdRequest } from '../lib/api';

// Auth Hooks
export const useAuthStatus = () => {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => apiClient.getAuthStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useValidateCredentials = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: FacebookCredentials) => apiClient.validateCredentials(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

// Media Hooks (Images and Videos)
export const useMedia = () => {
  return useQuery({
    queryKey: ['media'],
    queryFn: () => apiClient.getMedia(),
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (files: File[]) => apiClient.uploadMedia(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mediaId: string) => apiClient.deleteMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
};

// Template Hooks
export const useTemplates = (page = 1, limit = 10, search?: string) => {
  return useQuery({
    queryKey: ['templates', page, limit, search],
    queryFn: () => apiClient.getTemplates(page, limit, search),
  });
};

export const useTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['templates', templateId],
    queryFn: () => apiClient.getTemplate(templateId),
    enabled: !!templateId,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (template: CreateTemplateRequest) => apiClient.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, updates }: { templateId: string; updates: UpdateTemplateRequest }) =>
      apiClient.updateTemplate(templateId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (templateId: string) => apiClient.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Ad Hooks
export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.getAllJobs(),
  });
};

export const useJobStatus = (jobId: string) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => apiClient.getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: 2000, // Refetch every 2 seconds for active jobs
  });
};

export const useCreateBulkAds = () => {
  return useMutation({
    mutationFn: (request: BulkAdRequest) => apiClient.createBulkAds(request),
  });
};

export const useCreateEnhancedBulkAds = () => {
  return useMutation({
    mutationFn: (request: EnhancedBulkAdRequest) => apiClient.createEnhancedBulkAds(request),
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => apiClient.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}; 