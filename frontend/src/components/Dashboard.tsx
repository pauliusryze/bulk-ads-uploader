import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import supabase from '../lib/supabase';
import { 
  useAuthStatus, 
  useUploadMedia, 
  useTemplates, 
  useCreateTemplate, 
  useJobs, 
  useCreateEnhancedBulkAds
} from '../hooks/useApi';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Toaster } from './ui/toaster';
import { useToast } from '../hooks/use-toast';
import { Textarea } from './ui/textarea';

import { BulkAdItem, FacebookCampaign, FacebookPage, FacebookPixel, MassApplyOptions } from '../types';
import { AdRow } from './AdRow';
import { FacebookLocation, FacebookConversionEvent, FacebookDataset } from '../types';
import { useFacebookAuth } from '../hooks/useFacebookAuth';
import { FacebookAdService } from '../services/facebook-ad-service';
import { BulkAdPreview } from './AdPreview';
import { ProgressModal } from './ProgressModal';
import { useRealTimeSubscription } from './RealTimeSubscription';
import { testSupabaseConnection, testRealTimeSubscription } from '../utils/supabase-test';
import { testEnvironmentVariables } from '../utils/env-test';



// Create a client
const queryClient = new QueryClient();

function DashboardContent() {
  const { toast } = useToast();
  
  // Facebook Authentication
  const {
    isAuthenticated,
    accessToken,
    adAccounts,
    pages,
    selectedAdAccount,
    selectedPage,
    customAudiences,
    pixels,
    campaigns,
    isLoading: authLoading,
    error: authError,
    login,
    logout,
    selectAdAccount,
    selectPage,
    apiClient,
    manualAccessToken,
    setManualAccessToken,
    handleManualToken,
    createSampleCampaign,
    getInterests,
    getBehaviors,
    getDemographics,
    getConversionEvents
  } = useFacebookAuth();

  // Facebook Ad Service
  const [facebookAdService, setFacebookAdService] = useState<FacebookAdService | null>(null);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [adPreviews, setAdPreviews] = useState<any[]>([]);

  // Progress state
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [creationResult, setCreationResult] = useState<any>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Advanced targeting state
  const [interests, setInterests] = useState<Array<{ id: string; name: string; audience_size: number; path: string[] }>>([]);
  const [behaviors, setBehaviors] = useState<Array<{ id: string; name: string; audience_size: number; path: string[] }>>([]);
  const [demographics, setDemographics] = useState<Array<{ id: string; name: string; description: string; country?: string; category?: string; values?: Array<{ id: string; name: string; description: string }> }>>([]);
  const [localCustomAudiences, setLocalCustomAudiences] = useState<Array<{ id: string; name: string; subtype: string; approximate_count?: number }>>([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showBehaviorsModal, setShowBehaviorsModal] = useState(false);
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);
  const [showExclusionsModal, setShowExclusionsModal] = useState(false);
  const [interestSearchTerm, setInterestSearchTerm] = useState('');
  const [behaviorSearchTerm, setBehaviorSearchTerm] = useState('');
  const [demographicsSearchTerm, setDemographicsSearchTerm] = useState('');
  const [selectedDemographicCategory, setSelectedDemographicCategory] = useState<string | null>(null);
  const [conversionEventsLoading, setConversionEventsLoading] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [locations, setLocations] = useState<FacebookLocation[]>([]);


  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    adDescription: '',
    adCopy: {
      headline: '',
      primaryText: '',
      callToAction: 'LEARN_MORE' as const,
      description: ''
    },
    targeting: {
      ageMin: 18,
      ageMax: 65,
      locations: {
        inclusion: [] as string[],
        exclusion: [] as string[]
      },
      interests: [] as string[],
      behaviors: [] as string[],
      customAudienceExclusion: [] as string[],
      demographics: {
        educationStatuses: [] as number[],
        relationshipStatuses: [] as number[],
        income: [] as string[],
        lifeEvents: [] as string[],
        selectedDemographics: [] as { id: string; name: string; category: string; type: string }[]
      },
      exclusions: {
        interests: [] as string[],
        behaviors: [] as string[],
        demographics: {
          educationStatuses: [] as number[],
          relationshipStatuses: [] as number[]
        }
      },
      devicePlatforms: ['desktop', 'mobile'] as ('desktop' | 'mobile' | 'connected_tv')[]
    },
    delivery: {
      accelerated: false,
      costPerResult: undefined as number | undefined,
      costPerResultCurrency: 'USD' as 'USD' | 'EUR' | 'GBP' | 'CAD'
    },
    conversion: {
      conversionEvent: null as FacebookConversionEvent | null,
      dataset: null as FacebookDataset | null
    },
    placement: {
      facebook: true,
      instagram: true,
      audienceNetwork: false
    },
    specialAdCategories: [] as string[], // NEW FIELD
    optimizationGoal: 'LINK_CLICKS' as 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS', // NEW FIELD
    billingEvent: 'IMPRESSIONS' as 'IMPRESSIONS' | 'LINK_CLICKS' // NEW FIELD
  });

  // Enhanced bulk ads form state
  const [bulkAdsForm, setBulkAdsForm] = useState({
    templateId: '',
    uploadedMedia: [] as any[], // Store uploaded media for this session
    adItems: [] as BulkAdItem[], // Individual ad items
    campaigns: [] as FacebookCampaign[],
    facebookPages: [] as FacebookPage[],
    instagramPages: [] as FacebookPage[],
    pixels: [] as FacebookPixel[],
    massApplyOptions: {
      campaignId: '',
      budget: 0,
      startDate: null as Date | null,
      facebookPageId: '',
      instagramPageId: '',
      mediaSetup: {
        type: 'manual' as const,
        label: 'Manual upload',
        description: 'Manually upload images or videos.'
      },
      advantagePlusEnhancements: {
        translateText: false,
        showProducts: false,
        visualTouchUps: false,
        textImprovements: false,
        enhanceCTA: false,
        addVideoEffects: false
      },
      pixelId: '',
      urlParams: '',
      landingPageUrl: 'https://your-website.com' // NEW: Default landing page URL
    } as MassApplyOptions
  });

  // Convert Facebook API pixels to the expected format
  const formattedPixels = pixels.map(pixel => ({
    id: pixel.pixel_id,
    name: pixel.name,
    datasetId: pixel.pixel_id,
    status: pixel.status === 'ACTIVE' ? 'ACTIVE' as const : 'INACTIVE' as const,
    type: 'CONVERSIONS_API' as const
  }));

  // API Hooks
  const authStatus = useAuthStatus();

  const uploadMedia = useUploadMedia();
  const templates = useTemplates();
  const createTemplate = useCreateTemplate();
  const jobs = useJobs();
  const createEnhancedBulkAds = useCreateEnhancedBulkAds();

  // Real-time subscription for job progress
  useRealTimeSubscription({
    currentJobId,
    onProgressUpdate: (progress, message) => {
      setProgress(progress);
      setProgressMessage(message);
    },
    onJobComplete: (result) => {
      setCreationResult(result);
      setShowProgress(false);
      toast({
        title: "Bulk ads created successfully!",
        description: `Created ${result.completed_items} ads`,
      });
    },
    onJobFailed: (error) => {
      setShowProgress(false);
      toast({
        title: "Bulk ads creation failed",
        description: error,
        variant: "destructive",
      });
    }
  });

  // Media upload handling for bulk ads session - Direct to Facebook
  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if template is selected
    if (!bulkAdsForm.templateId) {
      toast({
        title: 'Template Required',
        description: 'Please select a template before uploading media',
        variant: 'destructive',
      });
      return;
    }

    // Check Facebook authentication
    if (!isAuthenticated || !selectedAdAccount || !apiClient) {
      toast({
        title: 'Facebook connection required',
        description: 'Please connect to Facebook and select an ad account before uploading media.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload directly to Facebook content library
      const facebookService = new FacebookAdService(apiClient);
      const uploadedMedia: any[] = [];
      const newAdItems: BulkAdItem[] = [];

      for (const file of files) {
        try {
          // Upload to Facebook directly using the API client
          const result = await apiClient.uploadMedia(selectedAdAccount.id, file);
          
          // Create media object for our session
          const mediaObj = {
            id: `fb-${Date.now()}-${Math.random()}`,
            mediaType: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            url: URL.createObjectURL(file), // Local preview
            facebookHash: result.hash,
            facebookId: result.id
          };
          
          uploadedMedia.push(mediaObj);

          // Create ad item
          const adItem: BulkAdItem = {
            id: `ad-${mediaObj.id}`,
            mediaId: mediaObj.id,
            mediaType: mediaObj.mediaType,
            filename: mediaObj.filename,
            thumbnailUrl: mediaObj.url,
            facebookMediaHash: result.hash, // Store Facebook media hash
            facebookMediaId: result.id, // Store Facebook media ID
            campaignId: '',
            campaignName: '',
            adSetName: `Ad Set - ${file.name.replace(/\.[^/.]+$/, "")}`, // Remove file extension
            adName: `Ad - ${file.name.replace(/\.[^/.]+$/, "")}`, // Remove file extension
            budget: 10, // Default budget
            startDate: null,
            facebookPageId: '',
            instagramPageId: '',
            landingPageUrl: 'https://your-website.com', // NEW: Default landing page URL
            mediaSetup: {
              type: 'manual' as const,
              label: 'Manual upload',
              description: 'Manually uploaded media to Facebook.'
            },
            advantagePlusEnhancements: {
              translateText: false,
              showProducts: false,
              visualTouchUps: false,
              textImprovements: false,
              enhanceCTA: false,
              addVideoEffects: false
            },
            pixelId: '',
            urlParams: '',
            bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
            bidAmount: undefined
          };

          newAdItems.push(adItem);

        } catch (error) {
          toast({
            title: `Failed to upload ${file.name}`,
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive',
          });
          return;
        }
      }

      // Add uploaded media to the current session
      setBulkAdsForm(prev => ({
        ...prev,
        uploadedMedia: [...prev.uploadedMedia, ...uploadedMedia],
        adItems: [...prev.adItems, ...newAdItems]
      }));

      toast({
        title: 'Media uploaded successfully',
        description: `Uploaded ${files.length} file(s) to Facebook content library`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };





  // Template creation
  const handleCreateTemplate = async () => {
    // Comprehensive validation matching backend requirements
    const errors: string[] = [];

    // Validate template name
    if (!templateForm.name.trim()) {
      errors.push('Template name is required');
    } else if (templateForm.name.trim().length > 100) {
      errors.push('Template name must be less than 100 characters');
    }

    // Validate headline
    if (!templateForm.adCopy.headline.trim()) {
      errors.push('Ad headline is required');
    } else if (templateForm.adCopy.headline.trim().length > 40) {
      errors.push('Headline must be less than 40 characters');
    }

    // Validate primary text
    if (!templateForm.adCopy.primaryText.trim()) {
      errors.push('Primary text is required');
    } else if (templateForm.adCopy.primaryText.trim().length > 125) {
      errors.push('Primary text must be less than 125 characters');
    }

    // Validate description
    if (templateForm.adDescription.trim().length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    // Show all validation errors
    if (errors.length > 0) {
      toast({
        title: 'Template creation failed',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
              const templateData = {
        name: templateForm.name.trim(),
        adDescription: templateForm.adDescription.trim(),
        adCopy: {
          headline: templateForm.adCopy.headline.trim(),
          primaryText: templateForm.adCopy.primaryText.trim(),
          callToAction: templateForm.adCopy.callToAction,
          ...(templateForm.adCopy.description.trim() && { description: templateForm.adCopy.description.trim() })
        },
        targeting: {
          ageMin: templateForm.targeting.ageMin,
          ageMax: templateForm.targeting.ageMax,
          locations: {
            inclusion: templateForm.targeting.locations.inclusion.filter(loc => loc != null && loc !== ''),
            exclusion: templateForm.targeting.locations.exclusion.filter(loc => loc != null && loc !== '')
          },
          interests: templateForm.targeting.interests
        },
        delivery: {
          accelerated: templateForm.delivery.accelerated,
          costPerResult: templateForm.delivery.costPerResult,
          costPerResultCurrency: templateForm.delivery.costPerResultCurrency
        },
        conversion: {
          conversionEvent: templateForm.conversion.conversionEvent ? {
            id: templateForm.conversion.conversionEvent.id,
            name: templateForm.conversion.conversionEvent.name,
            category: templateForm.conversion.conversionEvent.category,
            description: templateForm.conversion.conversionEvent.description
          } : null,
          dataset: templateForm.conversion.dataset ? {
            id: templateForm.conversion.dataset.id,
            name: templateForm.conversion.dataset.name,
            datasetId: templateForm.conversion.dataset.datasetId,
            type: templateForm.conversion.dataset.type,
            isActive: templateForm.conversion.dataset.isActive
          } : null
        },
        placement: templateForm.placement
      };

      console.log('Template data being sent:', templateData);

      await createTemplate.mutateAsync(templateData);
      
      toast({
        title: 'Template created successfully',
        description: 'Your ad template has been saved',
      });
      
      // Reset form
      setTemplateForm({
        name: '',
        adDescription: '',
        adCopy: {
          headline: '',
          primaryText: '',
          callToAction: 'LEARN_MORE',
          description: ''
        },
        targeting: {
          ageMin: 18,
          ageMax: 65,
          locations: {
            inclusion: [],
            exclusion: []
          },
          interests: [],
          behaviors: [],
          customAudienceExclusion: [],
          demographics: {
            educationStatuses: [],
            relationshipStatuses: [],
            income: [],
            lifeEvents: [],
            selectedDemographics: []
          },
          exclusions: {
            interests: [],
            behaviors: [],
            demographics: {
              educationStatuses: [],
              relationshipStatuses: []
            }
          },
          devicePlatforms: ['desktop', 'mobile'] as ('desktop' | 'mobile' | 'connected_tv')[]
        },
        delivery: {
          accelerated: false,
          costPerResult: undefined,
          costPerResultCurrency: 'USD'
        },
        conversion: {
          conversionEvent: null,
          dataset: null
        },
        placement: {
          facebook: true,
          instagram: true,
          audienceNetwork: false
        },
        specialAdCategories: [], // Reset new fields
        optimizationGoal: 'LINK_CLICKS', // Reset new fields
        billingEvent: 'IMPRESSIONS' // Reset new fields
      });
    } catch (error) {
      let errorMessage = 'Unknown error';
      let errorTitle = 'Template creation failed';
      
      if (error instanceof Error) {
        console.error('Template creation error details:', error);
        
        if (error.message.includes('429') || error.message.includes('Too many requests')) {
          errorTitle = 'Rate limit exceeded';
          errorMessage = 'You\'ve made too many requests. Please wait a few minutes and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Bulk ads creation with Facebook API
  const handleCreateBulkAds = async () => {
    if (bulkAdsForm.adItems.length === 0) {
      toast({
        title: 'No ads to create',
        description: 'Please upload media and configure your ads first',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkAdsForm.templateId) {
      toast({
        title: 'Template required',
        description: 'Please select a template for your ads',
        variant: 'destructive',
      });
      return;
    }

    // Check Facebook authentication
    if (!isAuthenticated || !selectedAdAccount || !apiClient) {
      toast({
        title: 'Facebook connection required',
        description: 'Please connect to Facebook and select an ad account.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Initialize Facebook Ad Service
      const facebookService = new FacebookAdService(apiClient);
      
      // Get template
      const template = templates.data?.templates.find(t => t.id === bulkAdsForm.templateId);
      if (!template) {
        toast({
          title: 'Template not found',
          description: 'Please select a valid template.',
          variant: 'destructive',
        });
        return;
      }

      // Convert template to EnhancedAdTemplate format
      // Add type guard/fallback for missing fields
      const safeTemplate = {
        ...template,
        specialAdCategories: (template as any).specialAdCategories || [],
        optimizationGoal: (template as any).optimizationGoal || 'LINK_CLICKS',
        billingEvent: (template as any).billingEvent || 'IMPRESSIONS',
      };
      const enhancedTemplate = {
        ...safeTemplate,
        adDescription: template.adDescription || '',
        delivery: {
          accelerated: false,
          costPerResult: undefined,
          costPerResultCurrency: 'USD' as const
        },
        conversion: {
          conversionEvent: null,
          dataset: null
        },
        targeting: {
          ageMin: template.targeting.ageMin || 18,
          ageMax: template.targeting.ageMax || 65,
          customAudienceExclusion: [],
          languages: [],
          interests: templateForm.targeting.interests || [],
          behaviors: templateForm.targeting.behaviors || [],
          demographics: {
            educationStatuses: [],
            relationshipStatuses: [],
            income: [],
            lifeEvents: [],
            selectedDemographics: templateForm.targeting.demographics.selectedDemographics || []
          },
          exclusions: {
            interests: [],
            behaviors: [],
            demographics: {
              educationStatuses: [],
              relationshipStatuses: []
            }
          },
          devicePlatforms: templateForm.targeting.devicePlatforms || ['desktop', 'mobile'] as ('desktop' | 'mobile' | 'connected_tv')[],
          locations: {
            inclusion: template.targeting.locations?.inclusion || [],
            exclusion: template.targeting.locations?.exclusion || []
          }
        }
      };

      // Media is already uploaded to Facebook, just collect the hashes
      const mediaHashes: string[] = [];
      
      for (const adItem of bulkAdsForm.adItems) {
        if (adItem.facebookMediaHash) {
          mediaHashes.push(adItem.facebookMediaHash);
        } else {
          toast({
            title: "Media upload missing",
            description: `Facebook media hash not found for ${adItem.filename}. Please re-upload the media.`,
            variant: "destructive",
          });
          return;
        }
      }
      // Show progress modal
      setShowProgress(true);
      setProgress(0);
      setProgressMessage('Starting ad creation...');

      // Create bulk ads with Facebook API
      // Use the first ad item's Facebook page ID as default, or use mass apply option
      const defaultPageId = bulkAdsForm.massApplyOptions.facebookPageId || 
                           bulkAdsForm.adItems[0]?.facebookPageId || 
                           pages[0]?.id || '';
      
      if (!defaultPageId) {
        toast({
          title: 'Facebook page required',
          description: 'Please select a Facebook page for your ads in the mass apply options or individual ad settings.',
          variant: 'destructive',
        });
        return;
      }

      const result = await facebookService.createBulkAdsWithPreview(
        enhancedTemplate,
        bulkAdsForm.adItems,
        selectedAdAccount.id,
        defaultPageId,
        bulkAdsForm.massApplyOptions.budget || 10, // Default budget
        (progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
        },
        bulkAdsForm.massApplyOptions.campaignId // Pass the selected campaign ID
      );

      // Check for validation errors
      if (result.errors && result.errors.length > 0) {
        toast({
          title: 'Ad creation failed - Validation errors',
          description: (
            <div className="max-h-40 overflow-y-auto">
              <p className="font-semibold mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-red-600">{error}</li>
                ))}
              </ul>
            </div>
          ),
          variant: 'destructive',
          duration: 10000, // Show for 10 seconds to give time to read
        });
        return;
      }

      // Store result and show completion
      setCreationResult(result);
      setProgress(100);
      setProgressMessage('Ad creation completed!');
      
      // Reset form
      setBulkAdsForm(prev => ({
        ...prev,
        adItems: [],
        uploadedMedia: []
      }));
    } catch (error) {
      toast({
        title: 'Bulk ads creation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Add this handler after the real-time subscription hook
  const handleTestSupabase = async () => {
    const result = await testSupabaseConnection();
    if (result.success) {
      toast({
        title: 'Supabase connection successful!',
        description: result.message,
      });
    } else {
      toast({
        title: 'Supabase connection failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleTestEnvironment = () => {
    const result = testEnvironmentVariables();
    if (result.success) {
      toast({
        title: 'Environment variables loaded!',
        description: result.message,
      });
    } else {
      toast({
        title: 'Environment variables missing!',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleInterestSearch = async () => {
    if (!interestSearchTerm.trim() || !apiClient) return;
    
    try {
      const response = await apiClient.getInterests(interestSearchTerm);
      setInterests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch interests:', error);
      toast({
        title: 'Failed to search interests',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleBehaviorSearch = async () => {
    if (!behaviorSearchTerm.trim() || !apiClient) return;
    
    try {
      const response = await apiClient.getBehaviors(behaviorSearchTerm);
      setBehaviors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch behaviors:', error);
      toast({
        title: 'Failed to fetch behaviors',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };



  const handleAddInterest = (interest: { id: string; name: string; audience_size: number; path: string[] }) => {
    if (!templateForm.targeting.interests.includes(interest.id)) {
      setTemplateForm(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          interests: [...prev.targeting.interests, interest.id]
        }
      }));
    }
  };

  const handleRemoveInterest = (interestId: string) => {
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        interests: prev.targeting.interests.filter(id => id !== interestId)
      }
    }));
  };

  const handleAddBehavior = (behavior: { id: string; name: string; audience_size: number; path: string[] }) => {
    if (!templateForm.targeting.behaviors.includes(behavior.id)) {
      setTemplateForm(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          behaviors: [...prev.targeting.behaviors, behavior.id]
        }
      }));
    }
  };

  const handleRemoveBehavior = (behaviorId: string) => {
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        behaviors: prev.targeting.behaviors.filter(id => id !== behaviorId)
      }
    }));
  };

  const handleAddDemographic = (demo: { id: string; name: string; description: string; country?: string; category?: string; values?: Array<{ id: string; name: string; description: string }> }) => {
    // Add the entire demographic category
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        demographics: {
          ...prev.targeting.demographics,
          // Store the demographic name and category for better UX
          selectedDemographics: [...prev.targeting.demographics.selectedDemographics || [], {
            id: demo.id,
            name: demo.name,
            category: demo.category || 'General',
            type: 'category'
          }]
        }
      }
    }));
    
    toast({
      title: 'Demographic category added',
      description: `Added "${demo.name}" category to targeting`,
    });
  };

  const handleAddDemographicValue = (value: { id: string; name: string; description: string }) => {
    // Add specific demographic value to targeting
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        demographics: {
          ...prev.targeting.demographics,
          // Store the demographic value with proper information
          selectedDemographics: [...prev.targeting.demographics.selectedDemographics || [], {
            id: value.id,
            name: value.name,
            category: 'Specific Value',
            type: 'value'
          }]
        }
      }
    }));
    
    toast({
      title: 'Demographic added',
      description: `Added "${value.name}" to targeting`,
    });
  };

  const handleRemoveExclusionInterest = (interestId: string) => {
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        exclusions: {
          ...prev.targeting.exclusions,
          interests: prev.targeting.exclusions.interests.filter(id => id !== interestId)
        }
      }
    }));
  };

  const handleRemoveExclusionBehavior = (behaviorId: string) => {
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        exclusions: {
          ...prev.targeting.exclusions,
          behaviors: prev.targeting.exclusions.behaviors.filter(id => id !== behaviorId)
        }
      }
    }));
  };

  // Load custom audiences when ad account is selected
  useEffect(() => {
    if (selectedAdAccount && apiClient) {
      const loadCustomAudiences = async () => {
        try {
          const response = await apiClient.getCustomAudiences(selectedAdAccount.id);
          setLocalCustomAudiences(response.data || []);
        } catch (error) {
          console.error('Failed to load custom audiences:', error);
        }
      };
      loadCustomAudiences();
    }
  }, [selectedAdAccount, apiClient]);

  const handleLocationSearch = async () => {
    if (!locationSearchTerm.trim() || !apiClient) return;
    
    try {
      const response = await apiClient.getLocations(locationSearchTerm);
      setLocations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast({
        title: 'Failed to search locations',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleAddLocation = (location: FacebookLocation) => {
    if (!templateForm.targeting.locations.inclusion.includes(location.id)) {
      setTemplateForm(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          locations: {
            ...prev.targeting.locations,
            inclusion: [...prev.targeting.locations.inclusion, location.id]
          }
        }
      }));
    }
  };

  const handleRemoveLocation = (locationId: string) => {
    setTemplateForm(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        locations: {
          ...prev.targeting.locations,
          inclusion: prev.targeting.locations.inclusion.filter(id => id !== locationId)
        }
      }
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Facebook Ads Bulk Uploader</h1>
        <Badge variant={authStatus.data?.isInitialized ? 'default' : 'secondary'}>
          {authStatus.data?.isInitialized ? 'Connected' : 'Disconnected'}
        </Badge>
        <div className="flex gap-2">
          <Button onClick={handleTestEnvironment} variant="outline" size="sm">
            Test Environment
          </Button>
          <Button onClick={handleTestSupabase} variant="outline" size="sm">
            Test Supabase Connection
          </Button>
        </div>
      </div>

      {/* Exclusions Modal */}
      {showExclusionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Exclusions</h3>
            <div className="space-y-4">
              <div>
                <Label>Exclude Interests</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Search interests to exclude..."
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const searchTerm = (e.target as HTMLInputElement).value;
                        if (searchTerm.trim() && apiClient) {
                          try {
                            const response = await apiClient.getInterests(searchTerm);
                            const foundInterests = response.data || [];
                            if (foundInterests.length > 0) {
                              const interest = foundInterests[0];
                              setTemplateForm(prev => ({
                                ...prev,
                                targeting: {
                                  ...prev.targeting,
                                  exclusions: {
                                    ...prev.targeting.exclusions,
                                    interests: [...prev.targeting.exclusions.interests, interest.id]
                                  }
                                }
                              }));
                              (e.target as HTMLInputElement).value = '';
                            }
                          } catch (error) {
                            console.error('Failed to fetch interests:', error);
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Exclude Behaviors</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Search behaviors to exclude..."
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const searchTerm = (e.target as HTMLInputElement).value;
                        if (searchTerm.trim() && apiClient) {
                          try {
                            const response = await apiClient.getBehaviors(searchTerm);
                            const foundBehaviors = response.data || [];
                            if (foundBehaviors.length > 0) {
                              const behavior = foundBehaviors[0];
                              setTemplateForm(prev => ({
                                ...prev,
                                targeting: {
                                  ...prev.targeting,
                                  exclusions: {
                                    ...prev.targeting.exclusions,
                                    behaviors: [...prev.targeting.exclusions.behaviors, behavior.id]
                                  }
                                }
                              }));
                              (e.target as HTMLInputElement).value = '';
                            }
                          } catch (error) {
                            console.error('Failed to fetch behaviors:', error);
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Exclude Custom Audiences</Label>
                <div className="mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (apiClient && selectedAdAccount) {
                        try {
                          const response = await apiClient.getCustomAudiences(selectedAdAccount.id);
                          setLocalCustomAudiences(response.data || []);
                        } catch (error) {
                          console.error('Failed to fetch custom audiences:', error);
                          toast({
                            title: 'Failed to fetch custom audiences',
                            description: error instanceof Error ? error.message : 'Unknown error',
                            variant: 'destructive',
                          });
                        }
                      }
                    }}
                  >
                    Load Custom Audiences
                  </Button>
                  {localCustomAudiences.length > 0 && (
                    <div className="max-h-32 overflow-y-auto border rounded p-2 mt-2">
                      {localCustomAudiences.map((audience) => (
                        <div key={audience.id} className="flex items-center justify-between py-1">
                          <div>
                            <div className="text-sm font-medium">{audience.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {audience.subtype} • {audience.approximate_count?.toLocaleString() || 'Unknown'} people
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTemplateForm(prev => ({
                                ...prev,
                                targeting: {
                                  ...prev.targeting,
                                  customAudienceExclusion: [...prev.targeting.customAudienceExclusion, audience.id]
                                }
                              }));
                            }}
                            disabled={templateForm.targeting.customAudienceExclusion.includes(audience.id)}
                          >
                            {templateForm.targeting.customAudienceExclusion.includes(audience.id) ? 'Added' : 'Exclude'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowExclusionsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="auth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="ads">Bulk Ads</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        {/* Authentication Tab */}
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook Authentication
              </CardTitle>
              <CardDescription>
                Connect your Facebook account to create ads directly in Facebook Ads Manager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facebook Authentication Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Facebook Account</span>
                    {isAuthenticated && <Badge variant="outline">Connected</Badge>}
                  </CardTitle>
                  <CardDescription>
                    Connect your Facebook account to access ad accounts, pages, and targeting options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Debug Info Section */}
                  {process.env.NODE_ENV === 'development' && isAuthenticated && (
                    <div className="bg-gray-50 p-3 rounded border">
                      <h4 className="font-medium text-sm mb-2">🔍 Debug Info (Development Mode)</h4>
                      <div className="text-xs space-y-1">
                        <div><strong>Access Token:</strong> {accessToken ? `${accessToken.substring(0, 20)}...` : 'None'}</div>
                        <div><strong>Ad Accounts:</strong> {adAccounts.length} found</div>
                        <div><strong>Pages:</strong> {pages.length} found</div>
                        <div><strong>Selected Ad Account:</strong> {selectedAdAccount?.name || 'None'}</div>
                        <div><strong>API Client:</strong> {apiClient ? 'Initialized' : 'Not initialized'}</div>
                        {pages.length > 0 && (
                          <div>
                            <strong>Page Details:</strong>
                            <ul className="ml-4">
                              {pages.map(page => (
                                <li key={page.id}>• {page.name} (ID: {page.id}, Category: {page.category})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {pages.length === 0 && isAuthenticated && (
                          <div className="text-orange-600">
                            <strong>⚠️ No pages found!</strong> Check token permissions or try refreshing.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!isAuthenticated && (
                    <div className="space-y-4">
                      {/* Facebook Login Button */}
                      <Button onClick={login} disabled={authLoading} className="w-full">
                        {authLoading ? 'Connecting...' : 'Connect with Facebook'}
                      </Button>
                      
                      {/* Manual Token Input */}
                      <div className="space-y-2">
                        <Label htmlFor="manual-token">Or enter Facebook Access Token manually:</Label>
                        <div className="flex gap-2">
                          <Input
                            id="manual-token"
                            type="password"
                            placeholder="Enter your Facebook access token"
                            value={manualAccessToken}
                            onChange={(e) => setManualAccessToken(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleManualToken} 
                            disabled={!manualAccessToken.trim() || authLoading}
                            variant="outline"
                          >
                            {authLoading ? 'Validating...' : 'Connect'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get your token from <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook Graph API Explorer</a>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {authError && (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
                      <strong>Error:</strong> {authError}
                    </div>
                  )}
                  
                  {isAuthenticated && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-500">
                            Connected
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Ready to use Facebook API
                          </span>
                        </div>
                        <Button variant="outline" size="sm" onClick={logout}>
                          Disconnect
                        </Button>
                      </div>

                      {/* Ad Account Selection */}
                      <div className="space-y-2">
                        <Label>Ad Account</Label>
                        <Select 
                          value={selectedAdAccount?.id || ''} 
                          onValueChange={(value) => {
                            const account = adAccounts.find(acc => acc.id === value);
                            if (account) selectAdAccount(account);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an ad account" />
                          </SelectTrigger>
                          <SelectContent>
                            {adAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.currency})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedAdAccount && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm text-green-800">
                            ✅ Ready to create ads in {selectedAdAccount.name}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Pixels: {pixels.length} • Campaigns: {campaigns.length} • Pages: {pages.length}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>
                Create a new ad template with Facebook Ads optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Template Info */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Ad Description</Label>
                <Input
                  id="templateDescription"
                  value={templateForm.adDescription}
                  onChange={(e) => setTemplateForm({ ...templateForm, adDescription: e.target.value })}
                  placeholder="Enter ad description"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold bg-blue-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 block">
                    Ad copy
                  </Label>
                </div>

                {/* Headline - REQUIRED */}
                <div className="space-y-2">
                  <Label htmlFor="headline" className="flex items-center gap-1">
                    Headline <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground">(1-40 characters)</span>
                  </Label>
                  <Input
                    id="headline"
                    placeholder="Enter your ad headline"
                    value={templateForm.adCopy.headline}
                    onChange={(e) => setTemplateForm({
                      ...templateForm,
                      adCopy: { ...templateForm.adCopy, headline: e.target.value }
                    })}
                    maxLength={40}
                    className={!templateForm.adCopy.headline.trim() ? "border-red-300" : ""}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{templateForm.adCopy.headline.trim() ? "✓ Required field filled" : "Required field"}</span>
                    <span>{templateForm.adCopy.headline.length}/40</span>
                  </div>
                </div>

                {/* Primary Text - REQUIRED */}
                <div className="space-y-2">
                  <Label htmlFor="primary-text" className="flex items-center gap-1">
                    Primary text <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground">(1-125 characters)</span>
                  </Label>
                  <Textarea
                    id="primary-text"
                    placeholder="Enter your ad primary text"
                    value={templateForm.adCopy.primaryText}
                    onChange={(e) => setTemplateForm({
                      ...templateForm,
                      adCopy: { ...templateForm.adCopy, primaryText: e.target.value }
                    })}
                    maxLength={125}
                    className={!templateForm.adCopy.primaryText.trim() ? "border-red-300" : ""}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{templateForm.adCopy.primaryText.trim() ? "✓ Required field filled" : "Required field"}</span>
                    <span>{templateForm.adCopy.primaryText.length}/125</span>
                  </div>
                </div>

                {/* Call to Action - OPTIONAL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Call to action
                    <span className="text-xs text-muted-foreground">(optional, defaults to 'Learn More')</span>
                  </Label>
                  <Select 
                    value={templateForm.adCopy.callToAction}
                    onValueChange={(value: any) => setTemplateForm({
                      ...templateForm,
                      adCopy: { ...templateForm.adCopy, callToAction: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                      <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                      <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                      <SelectItem value="BOOK_NOW">Book Now</SelectItem>
                      <SelectItem value="CONTACT_US">Contact Us</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description - OPTIONAL */}
                <div className="space-y-2">
                  <Label htmlFor="ad-description" className="flex items-center gap-1">
                    Description
                    <span className="text-xs text-muted-foreground">(optional, max 125 characters)</span>
                  </Label>
                  <Input
                    id="ad-description"
                    placeholder="Additional description (optional)"
                    value={templateForm.adCopy.description}
                    onChange={(e) => setTemplateForm({
                      ...templateForm,
                      adCopy: { ...templateForm.adCopy, description: e.target.value }
                    })}
                    maxLength={125}
                  />
                  <div className="flex justify-end text-xs text-muted-foreground">
                    <span>{templateForm.adCopy.description.length}/125</span>
                  </div>
                </div>
              </div>

              {/* Conversion Location */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Conversion Settings</Label>
                </div>
                {templateForm.conversion.dataset && !templateForm.conversion.dataset.isActive && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                    <div className="font-semibold mb-1">⚠️ Inactive Pixel Warning</div>
                    <div>This pixel is inactive. You can still create templates, but conversion tracking won't work until the pixel is activated in Facebook Ads Manager.</div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Conversion Event</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={templateForm.conversion.conversionEvent?.id || undefined}
                        onValueChange={async (value) => {
                          // Get conversion events from Facebook API if pixel is selected
                          if (templateForm.conversion.dataset?.id && apiClient) {
                            try {
                              const conversionEvents = await apiClient.getConversionEvents(templateForm.conversion.dataset.id);
                              const selectedEvent = conversionEvents.data.find(e => e.id === value);
                              setTemplateForm({ 
                                ...templateForm, 
                                conversion: { ...templateForm.conversion, conversionEvent: selectedEvent || null }
                              });
                            } catch (error) {
                              console.error('Failed to fetch conversion events:', error);
                              toast({
                                title: 'Failed to fetch conversion events',
                                description: 'No conversion events found for this pixel. You can create a Purchase event.',
                                variant: 'destructive',
                              });
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select conversion event" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateForm.conversion.dataset?.id ? (
                            conversionEventsLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading conversion events...
                              </SelectItem>
                            ) : templateForm.conversion.conversionEvent ? (
                              <SelectItem value={templateForm.conversion.conversionEvent.id}>
                                {templateForm.conversion.conversionEvent.name} ({templateForm.conversion.conversionEvent.category})
                              </SelectItem>
                            ) : (
                              <SelectItem value="no-events" disabled>
                                No conversion events found for this pixel
                              </SelectItem>
                            )
                          ) : (
                            <SelectItem value="no-pixel" disabled>
                              Select a pixel first
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {/* Debug: Show dataset info */}
                      {templateForm.conversion.dataset?.id && (
                        <div className="text-xs text-gray-500">
                          Dataset ID: {templateForm.conversion.dataset.id}
                        </div>
                      )}
                      {templateForm.conversion.dataset?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            console.log('Create Purchase Event clicked for dataset:', templateForm.conversion.dataset?.id);
                            if (apiClient && templateForm.conversion.dataset?.id) {
                              try {
                                await apiClient.createPurchaseEvent(templateForm.conversion.dataset.id);
                                toast({
                                  title: 'Purchase event created!',
                                  description: 'A Purchase conversion event has been created for your pixel.',
                                });
                                // Refresh conversion events
                                const conversionEvents = await apiClient.getConversionEvents(templateForm.conversion.dataset.id);
                                // Set the newly created purchase event
                                const purchaseEvent = conversionEvents.data.find(e => e.name === 'Purchase');
                                if (purchaseEvent) {
                                  setTemplateForm({ 
                                    ...templateForm, 
                                    conversion: { ...templateForm.conversion, conversionEvent: purchaseEvent }
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: 'Failed to create purchase event',
                                  description: error instanceof Error ? error.message : 'Unknown error',
                                  variant: 'destructive',
                                });
                              }
                            }
                          }}
                        >
                          Create Purchase Event
                        </Button>
                      )}
                    </div>
                    {templateForm.conversion.dataset && !templateForm.conversion.conversionEvent && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                        ⚠️ {templateForm.conversion.dataset.isActive 
                          ? 'No conversion events found for this pixel. Click "Create Purchase Event" to add one.'
                          : 'This pixel is inactive. You can create a Purchase event for testing, but it won\'t track conversions until activated in Facebook Ads Manager.'
                        }
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Dataset</Label>
                    <Select 
                      value={templateForm.conversion.dataset?.id || undefined}
                      onValueChange={async (value) => {
                        // Use real Facebook pixels as datasets
                        const selectedDataset = formattedPixels.find(p => p.id === value);
                        if (selectedDataset) {
                          const dataset: FacebookDataset = {
                            id: selectedDataset.id,
                            name: selectedDataset.name,
                            datasetId: selectedDataset.datasetId,
                            type: selectedDataset.type,
                            isActive: selectedDataset.status === 'ACTIVE'
                          };
                          setTemplateForm({ 
                            ...templateForm, 
                            conversion: { ...templateForm.conversion, dataset, conversionEvent: null }
                          });
                          
                          // Load conversion events for this pixel
                          if (apiClient && selectedDataset.status === 'ACTIVE') {
                            setConversionEventsLoading(true);
                            try {
                              const conversionEvents = await apiClient.getConversionEvents(selectedDataset.id);
                              console.log('Loaded conversion events:', conversionEvents);
                              if (conversionEvents.data && conversionEvents.data.length > 0) {
                                // Auto-select the first event if available
                                setTemplateForm(prev => ({ 
                                  ...prev, 
                                  conversion: { ...prev.conversion, conversionEvent: conversionEvents.data[0] }
                                }));
                              }
                            } catch (error) {
                              console.error('Failed to load conversion events:', error);
                              toast({
                                title: 'No conversion events found',
                                description: 'This pixel has no conversion events. You can create a Purchase event.',
                                variant: 'destructive',
                              });
                            } finally {
                              setConversionEventsLoading(false);
                            }
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {formattedPixels.map((pixel) => (
                          <SelectItem key={pixel.id} value={pixel.id}>
                            {pixel.name} ({pixel.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {templateForm.conversion.dataset && !templateForm.conversion.dataset.isActive && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                        ⚠️ This pixel is inactive. You can still create templates, but conversion tracking won't work until the pixel is activated in Facebook Ads Manager.
                      </div>
                    )}
                    {templateForm.conversion.dataset && templateForm.conversion.dataset.isActive && !templateForm.conversion.conversionEvent && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
                        ℹ️ This pixel is active but has no conversion events. Click "Create Purchase Event" to add one.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Settings */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Delivery Settings</Label>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="accelerated"
                      checked={templateForm.delivery.accelerated}
                      onChange={(e) => setTemplateForm({ 
                        ...templateForm, 
                        delivery: { ...templateForm.delivery, accelerated: e.target.checked }
                      })}
                      className="mt-1"
                    />
                    <Label htmlFor="accelerated">Accelerated delivery</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cost Per Result</Label>
                      <Input
                        type="number"
                        value={templateForm.delivery.costPerResult || ''}
                        onChange={(e) => setTemplateForm({ 
                          ...templateForm, 
                          delivery: { 
                            ...templateForm.delivery, 
                            costPerResult: e.target.value ? parseFloat(e.target.value) : undefined 
                          }
                        })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={templateForm.delivery.costPerResultCurrency}
                        onValueChange={(value) => setTemplateForm({ 
                          ...templateForm, 
                          delivery: { 
                            ...templateForm.delivery, 
                            costPerResultCurrency: value as 'USD' | 'EUR' | 'GBP' | 'CAD' 
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facebook Ad Settings */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Facebook Ad Settings</Label>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Optimization Goal</Label>
                      <Select 
                        value={templateForm.optimizationGoal}
                        onValueChange={(value) => setTemplateForm({ 
                          ...templateForm, 
                          optimizationGoal: value as 'LINK_CLICKS' | 'CONVERSIONS' | 'REACH' | 'BRAND_AWARENESS' | 'VIDEO_VIEWS'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select optimization goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LINK_CLICKS">Link Clicks</SelectItem>
                          <SelectItem value="CONVERSIONS">Conversions</SelectItem>
                          <SelectItem value="REACH">Reach</SelectItem>
                          <SelectItem value="BRAND_AWARENESS">Brand Awareness</SelectItem>
                          <SelectItem value="VIDEO_VIEWS">Video Views</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Billing Event</Label>
                      <Select 
                        value={templateForm.billingEvent}
                        onValueChange={(value) => setTemplateForm({ 
                          ...templateForm, 
                          billingEvent: value as 'IMPRESSIONS' | 'LINK_CLICKS'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMPRESSIONS">Impressions</SelectItem>
                          <SelectItem value="LINK_CLICKS">Link Clicks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Ad Categories</Label>
                    <Select 
                      onValueChange={(value) => {
                        if (!templateForm.specialAdCategories.includes(value)) {
                          setTemplateForm({ 
                            ...templateForm, 
                            specialAdCategories: [...templateForm.specialAdCategories, value]
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select special ad categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOUSING">Housing</SelectItem>
                        <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                        <SelectItem value="CREDIT">Credit</SelectItem>
                        <SelectItem value="ISSUES_ELECTIONS_POLITICS">Issues, Elections, Politics</SelectItem>
                        <SelectItem value="ONLINE_GAMBLING_AND_GAMING">Online Gambling and Gaming</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Display selected special ad categories */}
                    {templateForm.specialAdCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {templateForm.specialAdCategories.map((category) => (
                          <Badge key={category} variant="secondary" className="flex items-center gap-1">
                            {category}
                            <button
                              onClick={() => setTemplateForm({ 
                                ...templateForm, 
                                specialAdCategories: templateForm.specialAdCategories.filter(c => c !== category)
                              })}
                              className="ml-1 text-xs"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Targeting */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold bg-green-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center gap-1">
                    Advanced targeting
                    <span className="text-xs text-green-200 font-normal">(all fields optional - leave empty for broad targeting)</span>
                  </Label>
                </div>
                <div className="space-y-4">
                  {/* Interests */}
                  <div className="space-y-2">
                    <Label>Interests</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search interests..."
                        value={interestSearchTerm}
                        onChange={(e) => setInterestSearchTerm(e.target.value)}
                        onKeyPress={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            await handleInterestSearch();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInterestSearch}
                      >
                        Search
                      </Button>
                    </div>
                    {interests.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Found Interests:</Label>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 mt-1">
                          {interests.map((interest) => (
                            <div key={interest.id} className="flex items-center justify-between py-1">
                              <div>
                                <div className="text-sm font-medium">{interest.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Audience: {interest.audience_size?.toLocaleString() || 'Unknown'}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddInterest(interest)}
                                disabled={templateForm.targeting.interests.includes(interest.id)}
                              >
                                {templateForm.targeting.interests.includes(interest.id) ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {templateForm.targeting.interests.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Selected Interests:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {templateForm.targeting.interests.map((interestId) => (
                            <Badge key={interestId} variant="secondary" className="flex items-center gap-1">
                              {interestId}
                              <button
                                onClick={() => handleRemoveInterest(interestId)}
                                className="ml-1 text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>



                  {/* Demographics */}
                  <div className="space-y-2">
                    <Label>Demographics</Label>
                    <div className="text-sm text-muted-foreground mb-2">
                      Select demographics categories for targeting
                    </div>
                    
                    {/* Display selected demographics */}
                    {templateForm.targeting.demographics.educationStatuses.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-sm font-medium text-green-700">Selected Demographics:</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {templateForm.targeting.demographics.educationStatuses.map((demoId, index) => {
                            // Find the demographic name from our demographics list
                            const demo = demographics.find(d => d.id === demoId.toString()) || 
                                       demographics.flatMap(d => d.values || []).find(v => v.id === demoId.toString());
                            return (
                              <div
                                key={index}
                                className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs"
                              >
                                <span>{demo?.name || `Demographic ${demoId}`}</span>
                                <button
                                  onClick={() => {
                                    setTemplateForm(prev => ({
                                      ...prev,
                                      targeting: {
                                        ...prev.targeting,
                                        demographics: {
                                          ...prev.targeting.demographics,
                                          educationStatuses: prev.targeting.demographics.educationStatuses.filter((_, i) => i !== index)
                                        }
                                      }
                                    }));
                                  }}
                                  className="text-green-600 hover:text-green-800 ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {templateForm.targeting.demographics.selectedDemographics && templateForm.targeting.demographics.selectedDemographics.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-sm font-medium text-green-700">Selected Demographics:</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {templateForm.targeting.demographics.selectedDemographics.map((demo, index) => (
                            <div
                              key={`${demo.name}-${demo.id}-${index}`}
                              className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs"
                            >
                              <span>{demo.name}</span>
                              <span className="text-green-600 text-xs">({demo.category})</span>
                              <button
                                onClick={() => {
                                  setTemplateForm(prev => ({
                                    ...prev,
                                    targeting: {
                                      ...prev.targeting,
                                      demographics: {
                                        ...prev.targeting.demographics,
                                        selectedDemographics: prev.targeting.demographics.selectedDemographics.filter((_, i) => i !== index)
                                      }
                                    }
                                  }));
                                }}
                                className="text-green-600 hover:text-green-800 ml-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!apiClient) return;
                        
                        try {
                          const response = await apiClient.getDemographics();
                          setDemographics(response.data || []);
                        } catch (error) {
                          console.error('Failed to fetch demographics:', error);
                          toast({
                            title: 'Failed to fetch demographics',
                            description: error instanceof Error ? error.message : 'Unknown error',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Browse Demographics
                    </Button>
                    {demographics.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Available Demographics:</Label>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 mt-1">
                          {demographics.map((demo) => (
                            <div key={demo.id} className="border-b border-gray-100 last:border-b-0 py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{demo.name}</div>
                                  <div className="text-xs text-muted-foreground">{demo.description}</div>
                                  <div className="text-xs text-blue-600">{demo.category}</div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedDemographicCategory(selectedDemographicCategory === demo.id ? null : demo.id)}
                                  >
                                    {selectedDemographicCategory === demo.id ? 'Hide' : 'Browse'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddDemographic(demo)}
                                  >
                                    Add All
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Show detailed values when category is selected */}
                              {selectedDemographicCategory === demo.id && demo.values && (
                                <div className="mt-2 pl-4 border-l-2 border-blue-200">
                                  <div className="text-xs text-gray-500 mb-1">Search within {demo.name}:</div>
                                  <Input
                                    placeholder={`Search ${demo.name.toLowerCase()}...`}
                                    value={demographicsSearchTerm}
                                    onChange={(e) => setDemographicsSearchTerm(e.target.value)}
                                    className="mb-2"
                                  />
                                  <div className="max-h-24 overflow-y-auto">
                                    {demo.values
                                      .filter(value => 
                                        !demographicsSearchTerm || 
                                        value.name.toLowerCase().includes(demographicsSearchTerm.toLowerCase()) ||
                                        value.description.toLowerCase().includes(demographicsSearchTerm.toLowerCase())
                                      )
                                      .map((value) => (
                                        <div key={value.id} className="flex items-center justify-between py-1">
                                          <div>
                                            <div className="text-xs font-medium">{value.name}</div>
                                            <div className="text-xs text-muted-foreground">{value.description}</div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddDemographicValue(value)}
                                          >
                                            Add
                                          </Button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exclusions */}
                  <div className="space-y-2">
                    <Label>Exclusions</Label>
                    <div className="text-sm text-muted-foreground">
                      Exclude specific audiences, interests, or behaviors
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExclusionsModal(true)}
                    >
                      Add Exclusions
                    </Button>
                    {(templateForm.targeting.exclusions.interests.length > 0 || 
                      templateForm.targeting.exclusions.behaviors.length > 0) && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Current Exclusions:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {templateForm.targeting.exclusions.interests.map((interestId) => (
                            <Badge key={`excl-interest-${interestId}`} variant="destructive" className="flex items-center gap-1">
                              Interest: {interestId}
                              <button
                                onClick={() => handleRemoveExclusionInterest(interestId)}
                                className="ml-1 text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          {templateForm.targeting.exclusions.behaviors.map((behaviorId) => (
                            <Badge key={`excl-behavior-${behaviorId}`} variant="destructive" className="flex items-center gap-1">
                              Behavior: {behaviorId}
                              <button
                                onClick={() => handleRemoveExclusionBehavior(behaviorId)}
                                className="ml-1 text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Device Targeting */}
                  <div className="space-y-2">
                    <Label>Device Targeting</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={templateForm.targeting.devicePlatforms.includes('desktop')}
                          onChange={(e) => {
                            setTemplateForm(prev => ({
                              ...prev,
                              targeting: {
                                ...prev.targeting,
                                devicePlatforms: e.target.checked 
                                  ? [...prev.targeting.devicePlatforms, 'desktop']
                                  : prev.targeting.devicePlatforms.filter(p => p !== 'desktop')
                              }
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Desktop</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={templateForm.targeting.devicePlatforms.includes('mobile')}
                          onChange={(e) => {
                            setTemplateForm(prev => ({
                              ...prev,
                              targeting: {
                                ...prev.targeting,
                                devicePlatforms: e.target.checked 
                                  ? [...prev.targeting.devicePlatforms, 'mobile']
                                  : prev.targeting.devicePlatforms.filter(p => p !== 'mobile')
                              }
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Mobile</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={templateForm.targeting.devicePlatforms.includes('connected_tv')}
                          onChange={(e) => {
                            setTemplateForm(prev => ({
                              ...prev,
                              targeting: {
                                ...prev.targeting,
                                devicePlatforms: e.target.checked 
                                  ? [...prev.targeting.devicePlatforms, 'connected_tv']
                                  : prev.targeting.devicePlatforms.filter(p => p !== 'connected_tv')
                              }
                            }));
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">Connected TV</span>
                      </label>
                    </div>
                  </div>

                  {/* Location Targeting */}
                  <div className="space-y-2">
                    <Label>Location Targeting</Label>
                    <div className="text-sm text-muted-foreground mb-2">
                      Target specific countries, regions, or cities
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search locations (e.g., United States, New York, California)..."
                        value={locationSearchTerm}
                        onChange={(e) => setLocationSearchTerm(e.target.value)}
                        onKeyPress={async (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            await handleLocationSearch();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLocationSearch}
                      >
                        Search
                      </Button>
                    </div>
                    {locations.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Found Locations:</Label>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 mt-1">
                          {locations.map((location) => (
                            <div key={location.id} className="flex items-center justify-between py-1">
                              <div>
                                <div className="text-sm font-medium">{location.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Type: {location.type} {location.country_code && `(${location.country_code})`}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddLocation(location)}
                                disabled={templateForm.targeting.locations.inclusion.includes(location.id)}
                              >
                                {templateForm.targeting.locations.inclusion.includes(location.id) ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {templateForm.targeting.locations.inclusion.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Selected Locations:</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {templateForm.targeting.locations.inclusion.map((locationId) => {
                            const location = locations.find(l => l.id === locationId);
                            return (
                              <Badge key={locationId} variant="secondary" className="flex items-center gap-1">
                                {location?.name || locationId}
                                <button
                                  onClick={() => handleRemoveLocation(locationId)}
                                  className="ml-1 text-xs"
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Placement Controls - REQUIRED */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold bg-blue-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center gap-1">
                    Placement controls <span className="text-red-200">*</span>
                    <span className="text-xs text-blue-200 font-normal">(select at least one platform)</span>
                  </Label>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'facebook', label: 'Facebook', description: 'Get high visibility for your business with ads in feeds' },
                    { key: 'instagram', label: 'Instagram', description: 'Tell a rich, visual story with immersive, fullscreen vertical ads' },
                    { key: 'audienceNetwork', label: 'Audience Network', description: 'Expand your reach with ads in external apps and websites' }
                  ].map((option) => (
                    <div key={option.key} className="flex items-start space-x-3 p-2 rounded border">
                      <input
                        type="checkbox"
                        id={option.key}
                        checked={templateForm.placement[option.key as keyof typeof templateForm.placement] as boolean}
                        onChange={(e) => {
                          setTemplateForm(prev => ({
                            ...prev,
                            placement: {
                              ...prev.placement,
                              [option.key]: e.target.checked
                            }
                          }));
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={option.key} className="font-medium">{option.label}</Label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {!Object.values(templateForm.placement).some(Boolean) && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                    ⚠️ Please select at least one placement platform
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCreateTemplate}
                disabled={
                  createTemplate.isPending || 
                  !templateForm.name.trim() || 
                  !templateForm.adDescription.trim() ||
                  !templateForm.adCopy.headline.trim() || 
                  !templateForm.adCopy.primaryText.trim() ||
                  !Object.values(templateForm.placement).some(Boolean)
                }
                className="w-full"
              >
                {createTemplate.isPending ? 'Creating Template...' : 
                 (!templateForm.name.trim() || !templateForm.adDescription.trim() || !templateForm.adCopy.headline.trim() || !templateForm.adCopy.primaryText.trim() || !Object.values(templateForm.placement).some(Boolean)) ?
                 'Fill Required Fields (*)' : 'Create Template'}
              </Button>
              
              {/* Validation Summary */}
              <div className="text-sm space-y-1">
                <div className="font-medium text-muted-foreground">Required fields checklist:</div>
                <div className={`flex items-center gap-2 ${templateForm.name.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {templateForm.name.trim() ? '✅' : '❌'} Template Name
                </div>
                <div className={`flex items-center gap-2 ${templateForm.adDescription.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {templateForm.adDescription.trim() ? '✅' : '❌'} Template Description
                </div>
                <div className={`flex items-center gap-2 ${templateForm.adCopy.headline.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {templateForm.adCopy.headline.trim() ? '✅' : '❌'} Ad Headline
                </div>
                <div className={`flex items-center gap-2 ${templateForm.adCopy.primaryText.trim() ? 'text-green-600' : 'text-red-500'}`}>
                  {templateForm.adCopy.primaryText.trim() ? '✅' : '❌'} Primary Text
                </div>
                <div className={`flex items-center gap-2 ${Object.values(templateForm.placement).some(Boolean) ? 'text-green-600' : 'text-red-500'}`}>
                  {Object.values(templateForm.placement).some(Boolean) ? '✅' : '❌'} At least one placement platform
                </div>
              </div>

              {/* Debug: Test minimal template */}
              <Button 
                variant="outline"
                onClick={async () => {
                  const minimalTemplate = {
                    name: 'Test Template',
                    adDescription: 'Test description',
                    adCopy: {
                      headline: 'Test Headline',
                      primaryText: 'Test primary text',
                      callToAction: 'LEARN_MORE' as const,
                      description: 'Test description'
                    },
                    targeting: {
                      ageMin: 18,
                      ageMax: 65,
                      locations: {
                        inclusion: [],
                        exclusion: []
                      },
                      interests: []
                    },
                    delivery: {
                      accelerated: false,
                      costPerResult: undefined,
                      costPerResultCurrency: 'USD' as const
                    },
                    conversion: {
                      conversionEvent: null,
                      dataset: null
                    },
                    placement: {
                      facebook: true,
                      instagram: true,
                      audienceNetwork: false
                    }
                  };
                  
                  console.log('Testing minimal template:', minimalTemplate);
                  
                  try {
                    await createTemplate.mutateAsync(minimalTemplate);
                    toast({
                      title: 'Minimal template created successfully',
                      description: 'Debug template worked!',
                    });
                  } catch (error) {
                    console.error('Minimal template failed:', error);
                    toast({
                      title: 'Minimal template failed',
                      description: error instanceof Error ? error.message : 'Unknown error',
                      variant: 'destructive',
                    });
                  }
                }}
                className="w-full mt-2"
              >
                Test Minimal Template
              </Button>
            </CardContent>
          </Card>

          {/* Existing Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Templates</CardTitle>
              <CardDescription>
                Your saved ad templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.isLoading ? (
                <div>Loading templates...</div>
              ) : templates.data && templates.data.templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.data.templates.map((template) => (
                    <div key={template.id} className="border rounded p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.adDescription || ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{template.adCopy.callToAction}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement edit functionality
                              toast({
                                title: 'Edit Template',
                                description: 'Edit functionality coming soon',
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement delete functionality
                              toast({
                                title: 'Delete Template',
                                description: 'Delete functionality coming soon',
                              });
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline">Age: {template.targeting.ageMin || 18}-{template.targeting.ageMax || 65}</Badge>
                        <Badge variant="outline">Locations: {template.targeting.locations?.inclusion?.length || 0}</Badge>
                        <Badge variant="outline">{template.delivery?.costPerResultCurrency || 'USD'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No templates found. Create your first template above.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Ads Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Bulk Ads</CardTitle>
              <CardDescription>
                Select a template first, then upload media and configure your ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1: Template Selection - REQUIRED FIRST */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold bg-blue-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center gap-1">
                    Step 1: Select Template <span className="text-red-200">*</span>
                    <span className="text-xs text-blue-200 font-normal">(required to proceed)</span>
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-select" className="flex items-center gap-1">
                    Choose Template <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={bulkAdsForm.templateId}
                    onValueChange={(value) => {
                      setBulkAdsForm({ ...bulkAdsForm, templateId: value });
                      // Clear uploaded media when template changes
                      setBulkAdsForm(prev => ({ ...prev, uploadedMedia: [], adItems: [] }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template to get started" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.data?.templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.adDescription}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!bulkAdsForm.templateId && (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                      ⚠️ Please select a template to continue with bulk ad creation
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Media Upload - Only enabled after template selection */}
              <div className={`space-y-4 ${!bulkAdsForm.templateId ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <Label className="text-lg font-semibold bg-green-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center gap-1">
                    Step 2: Upload Media <span className="text-red-200">*</span>
                    <span className="text-xs text-green-200 font-normal">(images and videos for your ads)</span>
                  </Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="media" className="flex items-center gap-1">
                    Select Images & Videos <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground">(1-20 files)</span>
                  </Label>
                  <Input
                    id="media"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploadMedia.isPending || !bulkAdsForm.templateId}
                  />
                  <p className="text-sm text-muted-foreground">
                    Supported formats: JPG, PNG, GIF, MP4, MOV, AVI (max 20 files)
                  </p>
                  {!bulkAdsForm.templateId && (
                    <p className="text-sm text-orange-600">
                      🔒 Select a template first to unlock media upload
                    </p>
                  )}
                </div>
                
                {uploadMedia.isPending && (
                  <div className="space-y-2">
                    <Progress value={33} className="w-full" />
                    <p className="text-sm text-muted-foreground">Uploading media...</p>
                  </div>
                )}
                
                {bulkAdsForm.uploadedMedia.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {bulkAdsForm.uploadedMedia.length} files uploaded
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Mass Apply Options - Only shown after media upload */}
              {bulkAdsForm.adItems.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold bg-purple-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center gap-1">
                      Step 3: Configure Ad Settings
                      <span className="text-xs text-purple-200 font-normal">(apply to all ads or configure individually)</span>
                    </Label>
                  </div>

                  {/* Campaign Selection - Facebook API */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Campaign <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground">(from your Facebook ad account)</span>
                    </Label>
                    <Select
                      value={bulkAdsForm.massApplyOptions.campaignId}
                      onValueChange={(value) => {
                        const selectedCampaign = campaigns.find(c => c.id === value);
                        setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: {
                            ...prev.massApplyOptions,
                            campaignId: value
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign from your ad account" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.length > 0 ? campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{campaign.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {campaign.objective} • {campaign.status}
                              </span>
                            </div>
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-campaigns" disabled>
                            No campaigns found - connect Facebook account
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {campaigns.length === 0 && isAuthenticated && (
                      <p className="text-sm text-orange-600">
                        No campaigns found in your ad account. Create a campaign in Facebook Ads Manager first.
                      </p>
                    )}
                  </div>

                  {/* Facebook Page Selection - Facebook API */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Facebook Page <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground">(from your connected pages)</span>
                    </Label>
                    <Select
                      value={bulkAdsForm.massApplyOptions.facebookPageId}
                      onValueChange={(value) => setBulkAdsForm(prev => ({
                        ...prev,
                        massApplyOptions: { ...prev.massApplyOptions, facebookPageId: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Facebook page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages && pages.length > 0 ? 
                          pages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{page.name}</span>
                              <span className="text-xs text-muted-foreground">{page.category}</span>
                            </div>
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-pages" disabled>
                            No Facebook pages found - connect pages first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Instagram Page Selection - Facebook API */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Instagram Account
                      <span className="text-xs text-muted-foreground">(optional - for Instagram placement)</span>
                    </Label>
                    <Select
                      value={bulkAdsForm.massApplyOptions.instagramPageId || "none"}
                      onValueChange={(value) => setBulkAdsForm(prev => ({
                        ...prev,
                        massApplyOptions: { 
                          ...prev.massApplyOptions, 
                          instagramPageId: value === "none" ? "" : value 
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Instagram account (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Facebook only)</SelectItem>
                        {pages && pages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{page.name}</span>
                              <span className="text-xs text-muted-foreground">{page.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget - Mass Apply */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Daily Budget <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground">(per ad, minimum $1.00)</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="10.00"
                      value={bulkAdsForm.massApplyOptions.budget || ''}
                      onChange={(e) => setBulkAdsForm(prev => ({
                        ...prev,
                        massApplyOptions: { 
                          ...prev.massApplyOptions, 
                          budget: parseFloat(e.target.value) || 0 
                        }
                      }))}
                      className={!bulkAdsForm.massApplyOptions.budget || bulkAdsForm.massApplyOptions.budget < 1 ? "border-red-300" : ""}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {bulkAdsForm.massApplyOptions.budget && bulkAdsForm.massApplyOptions.budget >= 1 ? 
                          "✓ Valid budget" : "Minimum $1.00 required"}
                      </span>
                      <span>Per ad daily budget</span>
                    </div>
                  </div>

                  {/* Landing Page URL - Mass Apply */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Landing Page URL <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground">(where ads will lead)</span>
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://your-website.com"
                      value={bulkAdsForm.massApplyOptions.landingPageUrl || ''}
                      onChange={(e) => setBulkAdsForm(prev => ({
                        ...prev,
                        massApplyOptions: { 
                          ...prev.massApplyOptions, 
                          landingPageUrl: e.target.value 
                        }
                      }))}
                      className={!bulkAdsForm.massApplyOptions.landingPageUrl ? "border-red-300" : ""}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {bulkAdsForm.massApplyOptions.landingPageUrl ? 
                          "✓ Valid URL" : "Required for ad creation"}
                      </span>
                      <span>Destination for ad clicks</span>
                    </div>
                  </div>

                  {/* Apply to All Button */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Apply all settings to all ad items
                        setBulkAdsForm(prev => ({
                          ...prev,
                          adItems: prev.adItems.map(item => ({
                            ...item,
                            campaignId: prev.massApplyOptions.campaignId || '',
                            campaignName: campaigns.find(c => c.id === prev.massApplyOptions.campaignId)?.name || '',
                            facebookPageId: prev.massApplyOptions.facebookPageId || '',
                            instagramPageId: (prev.massApplyOptions.instagramPageId === "none" || !prev.massApplyOptions.instagramPageId) ? '' : prev.massApplyOptions.instagramPageId,
                            budget: prev.massApplyOptions.budget || 0,
                            landingPageUrl: prev.massApplyOptions.landingPageUrl || 'https://your-website.com'
                          }))
                        }));
                        toast({
                          title: 'Settings applied to all ads',
                          description: `Updated ${bulkAdsForm.adItems.length} ads`,
                        });
                      }}
                      disabled={!bulkAdsForm.massApplyOptions.campaignId || !bulkAdsForm.massApplyOptions.facebookPageId || !bulkAdsForm.massApplyOptions.budget || !bulkAdsForm.massApplyOptions.landingPageUrl}
                    >
                      Apply Settings to All {bulkAdsForm.adItems.length} Ads
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Individual Ad Configuration & Create */}
              {bulkAdsForm.adItems.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold bg-orange-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 flex items-center gap-1">
                      Step 4: Review & Create Ads
                      <span className="text-xs text-orange-200 font-normal">({bulkAdsForm.adItems.length} ads ready)</span>
                    </Label>
                  </div>

                  {/* Validation Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-800">Pre-flight Checklist:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className={`flex items-center gap-2 ${bulkAdsForm.templateId ? 'text-green-600' : 'text-red-500'}`}>
                        {bulkAdsForm.templateId ? '✅' : '❌'} Template Selected
                      </div>
                      <div className={`flex items-center gap-2 ${bulkAdsForm.uploadedMedia.length > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {bulkAdsForm.uploadedMedia.length > 0 ? '✅' : '❌'} Media Uploaded ({bulkAdsForm.uploadedMedia.length} files)
                      </div>
                      <div className={`flex items-center gap-2 ${bulkAdsForm.massApplyOptions.campaignId ? 'text-green-600' : 'text-red-500'}`}>
                        {bulkAdsForm.massApplyOptions.campaignId ? '✅' : '❌'} Campaign Selected
                      </div>
                      <div className={`flex items-center gap-2 ${bulkAdsForm.massApplyOptions.facebookPageId ? 'text-green-600' : 'text-red-500'}`}>
                        {bulkAdsForm.massApplyOptions.facebookPageId ? '✅' : '❌'} Facebook Page Selected
                      </div>
                      <div className={`flex items-center gap-2 ${bulkAdsForm.massApplyOptions.budget && bulkAdsForm.massApplyOptions.budget >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                        {bulkAdsForm.massApplyOptions.budget && bulkAdsForm.massApplyOptions.budget >= 1 ? '✅' : '❌'} Valid Budget (${bulkAdsForm.massApplyOptions.budget || 0}/day per ad)
                      </div>
                      <div className={`flex items-center gap-2 ${bulkAdsForm.massApplyOptions.landingPageUrl ? 'text-green-600' : 'text-red-500'}`}>
                        {bulkAdsForm.massApplyOptions.landingPageUrl ? '✅' : '❌'} Landing Page URL Set
                      </div>
                      <div className={`flex items-center gap-2 ${isAuthenticated && selectedAdAccount ? 'text-green-600' : 'text-red-500'}`}>
                        {isAuthenticated && selectedAdAccount ? '✅' : '❌'} Facebook Account Connected
                      </div>
                    </div>
                  </div>

                  {/* Individual Ad Items Preview */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      Your Ads ({bulkAdsForm.adItems.length})
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Configure individually
                      </Badge>
                    </h4>
                    
                    {/* Individual Ad Configuration */}
                    <div className="border rounded-lg">
                      <div className="bg-gray-50 p-3 border-b">
                        <h5 className="font-medium text-sm">Individual Ad Configuration</h5>
                        <p className="text-xs text-muted-foreground">Configure each ad individually or use mass apply settings above</p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {bulkAdsForm.adItems.map((item, index) => (
                          <div key={item.id} className="p-4 border-b last:border-b-0">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                              
                              {/* Ad Preview */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                  Ad #{index + 1}
                                </Label>
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                    {item.mediaType === 'video' ? '🎥' : '🖼️'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{item.filename}</div>
                                    <Badge variant="outline" className="text-xs">
                                      {item.mediaType}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Basic Settings */}
                              <div className="space-y-3">
                                {/* Ad Set Name */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">
                                    Ad Set Name <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    value={item.adSetName}
                                    onChange={(e) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, adSetName: e.target.value } : ad
                                        )
                                      }));
                                    }}
                                    placeholder="Ad Set Name"
                                    className="text-xs"
                                  />
                                </div>

                                {/* Ad Name */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">
                                    Ad Name <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    value={item.adName}
                                    onChange={(e) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, adName: e.target.value } : ad
                                        )
                                      }));
                                    }}
                                    placeholder="Ad Name"
                                    className="text-xs"
                                  />
                                </div>
                              </div>

                              {/* Budget & Bid Strategy */}
                              <div className="space-y-3">
                                {/* Daily Budget */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">
                                    Daily Budget (USD) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={item.budget}
                                    onChange={(e) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, budget: parseFloat(e.target.value) || 0 } : ad
                                        )
                                      }));
                                    }}
                                    placeholder="10.00"
                                    className="text-xs"
                                  />
                                </div>

                                {/* Bid Strategy */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Bid Strategy</Label>
                                  <Select
                                    value={item.bidStrategy}
                                    onValueChange={(value: any) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, bidStrategy: value } : ad
                                        )
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className="text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="LOWEST_COST_WITHOUT_CAP">Lowest Cost</SelectItem>
                                      <SelectItem value="LOWEST_COST_WITH_BID_CAP">Lowest Cost with Bid Cap</SelectItem>
                                      <SelectItem value="COST_CAP">Cost Cap</SelectItem>
                                      <SelectItem value="BID_CAP">Bid Cap</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Bid Amount (conditional) */}
                                {(item.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || 
                                  item.bidStrategy === 'COST_CAP' || 
                                  item.bidStrategy === 'BID_CAP') && (
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">Bid Amount (USD)</Label>
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      value={item.bidAmount || ''}
                                      onChange={(e) => {
                                        setBulkAdsForm(prev => ({
                                          ...prev,
                                          adItems: prev.adItems.map(ad => 
                                            ad.id === item.id ? { ...ad, bidAmount: parseFloat(e.target.value) || undefined } : ad
                                          )
                                        }));
                                      }}
                                      placeholder="1.00"
                                      className="text-xs"
                                    />
                                  </div>
                                )}

                                {/* Start Date */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Start Date</Label>
                                  <Input
                                    type="datetime-local"
                                    value={item.startDate ? item.startDate.toISOString().slice(0, 16) : ''}
                                    onChange={(e) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, startDate: e.target.value ? new Date(e.target.value) : null } : ad
                                        )
                                      }));
                                    }}
                                    className="text-xs"
                                  />
                                </div>
                              </div>

                              {/* Advanced Settings */}
                              <div className="space-y-3">
                                {/* Landing Page URL */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Landing Page URL <span className="text-red-500">*</span></Label>
                                  <Input
                                    type="url"
                                    value={item.landingPageUrl}
                                    onChange={(e) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, landingPageUrl: e.target.value } : ad
                                        )
                                      }));
                                    }}
                                    placeholder="https://your-website.com"
                                    className="text-xs"
                                  />
                                </div>

                                {/* URL Parameters */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">URL Parameters</Label>
                                  <Input
                                    value={item.urlParams}
                                    onChange={(e) => {
                                      setBulkAdsForm(prev => ({
                                        ...prev,
                                        adItems: prev.adItems.map(ad => 
                                          ad.id === item.id ? { ...ad, urlParams: e.target.value } : ad
                                        )
                                      }));
                                    }}
                                    placeholder="utm_source=facebook&utm_campaign=bulk"
                                    className="text-xs"
                                  />
                                </div>
                              </div>

                              {/* Advantage+ Creative Enhancements */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">Advantage+ Creative</Label>
                                <div className="space-y-1">
                                  {[
                                    { key: 'translateText', label: 'Translate text' },
                                    { key: 'showProducts', label: 'Show products' },
                                    { key: 'visualTouchUps', label: 'Visual touch-ups' },
                                    { key: 'textImprovements', label: 'Text improvements' },
                                    { key: 'enhanceCTA', label: 'Enhance CTA' },
                                    { key: 'addVideoEffects', label: 'Add video effects' }
                                  ].map((enhancement) => (
                                    <label key={enhancement.key} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={item.advantagePlusEnhancements[enhancement.key as keyof typeof item.advantagePlusEnhancements]}
                                        onChange={(e) => {
                                          setBulkAdsForm(prev => ({
                                            ...prev,
                                            adItems: prev.adItems.map(ad => 
                                              ad.id === item.id ? {
                                                ...ad,
                                                advantagePlusEnhancements: {
                                                  ...ad.advantagePlusEnhancements,
                                                  [enhancement.key]: e.target.checked
                                                }
                                              } : ad
                                            )
                                          }));
                                        }}
                                        className="rounded"
                                      />
                                      <span className="text-xs">{enhancement.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Remove Ad Button */}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setBulkAdsForm(prev => ({
                                    ...prev,
                                    adItems: prev.adItems.filter(ad => ad.id !== item.id),
                                    uploadedMedia: prev.uploadedMedia.filter(media => media.id !== item.mediaId)
                                  }));
                                }}
                                className="w-full text-xs"
                              >
                                Remove Ad
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={async () => {
                        // Preview functionality
                        toast({
                          title: 'Preview coming soon',
                          description: 'Ad preview functionality will be added',
                        });
                      }}
                      variant="outline"
                      disabled={!isAuthenticated || !selectedAdAccount || !bulkAdsForm.templateId || bulkAdsForm.adItems.length === 0}
                      className="flex-1"
                    >
                      Preview Ads
                    </Button>
                    <Button 
                      onClick={handleCreateBulkAds}
                      disabled={
                        createEnhancedBulkAds.isPending || 
                        !bulkAdsForm.templateId || 
                        bulkAdsForm.adItems.length === 0 ||
                        !bulkAdsForm.massApplyOptions.campaignId ||
                        !bulkAdsForm.massApplyOptions.facebookPageId ||
                        !bulkAdsForm.massApplyOptions.budget ||
                        bulkAdsForm.massApplyOptions.budget < 1 ||
                        !bulkAdsForm.massApplyOptions.landingPageUrl ||
                        !isAuthenticated || 
                        !selectedAdAccount
                      }
                      className="flex-1"
                    >
                      {createEnhancedBulkAds.isPending ? 'Creating Ads...' : 
                       (!bulkAdsForm.templateId || bulkAdsForm.adItems.length === 0 || !bulkAdsForm.massApplyOptions.campaignId || !bulkAdsForm.massApplyOptions.facebookPageId || !bulkAdsForm.massApplyOptions.budget || bulkAdsForm.massApplyOptions.budget < 1 || !bulkAdsForm.massApplyOptions.landingPageUrl || !isAuthenticated || !selectedAdAccount) ?
                       'Complete Required Fields' : `Create ${bulkAdsForm.adItems.length} Bulk Ads`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Status</CardTitle>
              <CardDescription>
                Monitor the progress of your bulk ad creation jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.isLoading ? (
                <div>Loading jobs...</div>
              ) : jobs.data ? (
                <div className="space-y-4">
                  {jobs.data.jobs.map((job) => (
                    <div key={job.id} className="border rounded p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Job {job.id.slice(0, 8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {job.createdAds} created, {job.failedAds} failed
                          </p>
                        </div>
                        <Badge variant={
                          job.status === 'COMPLETED' ? 'default' :
                          job.status === 'FAILED' ? 'destructive' :
                          'secondary'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      <Progress value={job.progress} className="mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div>No jobs found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ad Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Ad Previews</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <BulkAdPreview 
              previews={adPreviews}
              onApproveAll={() => {
                setShowPreview(false);
                handleCreateBulkAds();
              }}
              onRejectAll={() => setShowPreview(false)}
              onViewInFacebook={(adId) => {
                // Open Facebook Ads Manager in new tab
                window.open(`https://www.facebook.com/adsmanager/manage/ads`, '_blank');
              }}
            />
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={showProgress}
        progress={progress}
        message={progressMessage}
        isComplete={progress === 100}
        hasErrors={creationResult?.errors?.length > 0}
        onClose={() => {
          setShowProgress(false);
          setProgress(0);
          setProgressMessage('');
          setCreationResult(null);
        }}
        onViewInFacebook={() => {
          if (selectedAdAccount) {
            const facebookAdsManagerUrl = `https://www.facebook.com/adsmanager/manage/ads?act=${selectedAdAccount.id}`;
            window.open(facebookAdsManagerUrl, '_blank');
          }
        }}
      />
    </div>
  );
}

export function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
      <Toaster />
    </QueryClientProvider>
  );
} 