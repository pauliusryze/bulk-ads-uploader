import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

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
    isLoading: authLoading,
    error: authError,
    login,
    logout,
    selectAdAccount,
    selectPage,
    apiClient
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
      locations: [] as FacebookLocation[],
      interests: [] as string[]
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
    }
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
      urlParams: ''
    } as MassApplyOptions
  });

  // Mock data for pixels
  const mockPixels: FacebookPixel[] = [
    {
      id: '1',
      name: 'Blotout test pixel',
      datasetId: '3982706215295583',
      status: 'ACTIVE',
      type: 'CONVERSIONS_API'
    },
    {
      id: '2',
      name: 'RYZE - ARC - Pixel',
      datasetId: '3376555439287120',
      status: 'ACTIVE',
      type: 'CONVERSIONS_API'
    },
    {
      id: '3',
      name: 'RYZE, LLC\'s Pixel',
      datasetId: '699191640895018',
      status: 'ACTIVE',
      type: 'CONVERSIONS_API'
    },
    {
      id: '4',
      name: 'Hyros Conversions Pixel',
      datasetId: '344903561127876',
      status: 'INACTIVE',
      type: 'PIXEL'
    }
  ];

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

  // Media upload handling for bulk ads session
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

    try {
      const result = await uploadMedia.mutateAsync(files);
      
      // Add uploaded media to the current session
      setBulkAdsForm(prev => ({
        ...prev,
        uploadedMedia: [...prev.uploadedMedia, ...result.uploadedMedia]
      }));

      // Create individual ad items for each uploaded media
      const newAdItems: BulkAdItem[] = result.uploadedMedia.map((media) => ({
        id: `ad-${Date.now()}-${Math.random()}`,
        mediaId: media.id,
        mediaType: media.mediaType,
        filename: media.originalName,
        thumbnailUrl: media.url,
        campaignId: '',
        campaignName: '',
        adSetName: media.originalName.replace(/\.[^/.]+$/, ''), // Remove file extension
        adName: media.originalName.replace(/\.[^/.]+$/, ''), // Remove file extension
        budget: 0,
        startDate: null,
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
        urlParams: ''
      }));

      setBulkAdsForm(prev => ({
        ...prev,
        adItems: [...prev.adItems, ...newAdItems]
      }));

      toast({
        title: 'Media uploaded successfully',
        description: `Uploaded ${result.totalUploaded} files for this bulk ad session`,
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
            description: templateForm.adCopy.description.trim()
          },
          targeting: templateForm.targeting,
          delivery: templateForm.delivery,
          conversion: templateForm.conversion,
          placement: templateForm.placement
        };

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
          locations: [],
          interests: []
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
        }
      });
    } catch (error) {
      toast({
        title: 'Template creation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
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
    if (!isAuthenticated || !selectedAdAccount || !selectedPage || !apiClient) {
      toast({
        title: 'Facebook connection required',
        description: 'Please connect to Facebook and select an ad account and page.',
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
      const enhancedTemplate = {
        ...template,
        adDescription: template.description || '',
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
          ...template.targeting,
          ageMin: template.targeting.ageMin || 18,
          ageMax: template.targeting.ageMax || 65,
          customAudienceExclusion: [],
          languages: [],
          locations: {
            inclusion: template.targeting.locations || [],
            exclusion: []
          }
        }
      };

      // Upload media to Facebook first
      const mediaHashes: string[] = [];
      for (const media of bulkAdsForm.uploadedMedia) {
        try {
          const file = new File([media.data], media.name, { type: media.type });
          const hash = await facebookService.uploadMediaToFacebook(selectedAdAccount.id, file);
          mediaHashes.push(hash);
        } catch (error) {
          toast({
            title: 'Media upload failed',
            description: `Failed to upload ${media.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Show progress modal
      setShowProgress(true);
      setProgress(0);
      setProgressMessage('Starting ad creation...');

      // Create bulk ads with Facebook API
      const result = await facebookService.createBulkAdsWithPreview(
        enhancedTemplate,
        bulkAdsForm.adItems,
        selectedAdAccount.id,
        selectedPage.id,
        bulkAdsForm.massApplyOptions.budget || 10, // Default budget
        (progress, message) => {
          setProgress(progress);
          setProgressMessage(message);
        }
      );

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
              {!isAuthenticated ? (
                <div className="space-y-4">
                  <Button 
                    onClick={login} 
                    disabled={authLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {authLoading ? 'Connecting...' : 'Connect with Facebook'}
                  </Button>
                  {authError && (
                    <div className="text-red-500 text-sm">{authError}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    <p>✅ Secure OAuth authentication</p>
                    <p>✅ Automatic ad account detection</p>
                    <p>✅ No manual credentials needed</p>
                    <p>✅ Automatic token management</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        Connected
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Access Token: {accessToken?.substring(0, 20)}...
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

                  {/* Page Selection */}
                  <div className="space-y-2">
                    <Label>Facebook Page</Label>
                    <Select 
                      value={selectedPage?.id || ''} 
                      onValueChange={(value) => {
                        const page = pages.find(p => p.id === value);
                        if (page) selectPage(page);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Facebook page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name} ({page.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAdAccount && selectedPage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        ✅ Ready to create ads in {selectedAdAccount.name} using {selectedPage.name}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callToAction">Call to Action</Label>
                  <Select 
                    value={templateForm.adCopy.callToAction}
                    onValueChange={(value) => setTemplateForm({ 
                      ...templateForm, 
                      adCopy: { ...templateForm.adCopy, callToAction: value as any }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select call to action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                      <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                      <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                      <SelectItem value="BOOK_NOW">Book Now</SelectItem>
                      <SelectItem value="CONTACT_US">Contact Us</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headline">Ad Headline</Label>
                  <Input
                    id="headline"
                    value={templateForm.adCopy.headline}
                    onChange={(e) => setTemplateForm({ 
                      ...templateForm, 
                      adCopy: { ...templateForm.adCopy, headline: e.target.value }
                    })}
                    placeholder="Enter ad headline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryText">Primary Text</Label>
                  <Input
                    id="primaryText"
                    value={templateForm.adCopy.primaryText}
                    onChange={(e) => setTemplateForm({ 
                      ...templateForm, 
                      adCopy: { ...templateForm.adCopy, primaryText: e.target.value }
                    })}
                    placeholder="Enter primary text"
                  />
                </div>
              </div>

                {/* Conversion Location */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold">Conversion Settings</Label>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Conversion Event</Label>
                      <Select 
                        value={templateForm.conversion.conversionEvent?.id || undefined}
                        onValueChange={(value) => {
                          // TODO: Get conversion events from Facebook API
                          const mockConversionEvents: FacebookConversionEvent[] = [
                            { id: '1', name: 'Purchase', category: 'PURCHASE', description: 'Purchase event' },
                            { id: '2', name: 'Add to Cart', category: 'ADD_TO_CART', description: 'Add to cart event' },
                            { id: '3', name: 'Lead', category: 'LEAD', description: 'Lead generation event' }
                          ];
                          const selectedEvent = mockConversionEvents.find(e => e.id === value);
                          setTemplateForm({ 
                            ...templateForm, 
                            conversion: { ...templateForm.conversion, conversionEvent: selectedEvent || null }
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select conversion event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Purchase</SelectItem>
                          <SelectItem value="2">Add to Cart</SelectItem>
                          <SelectItem value="3">Lead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Dataset</Label>
                      <Select 
                        value={templateForm.conversion.dataset?.id || undefined}
                        onValueChange={(value) => {
                          // TODO: Get datasets from Facebook API
                          const mockDatasets: FacebookDataset[] = [
                            { id: '1', name: 'Blotout test pixel', datasetId: '3982706215295583', type: 'CONVERSIONS_API', isActive: true },
                            { id: '2', name: 'RYZE - ARC - Pixel', datasetId: '3376555439287120', type: 'CONVERSIONS_API', isActive: true },
                            { id: '3', name: 'RYZE, LLC\'s Pixel', datasetId: '699191640895018', type: 'CONVERSIONS_API', isActive: true }
                          ];
                          const selectedDataset = mockDatasets.find(d => d.id === value);
                          setTemplateForm({ 
                            ...templateForm, 
                            conversion: { ...templateForm.conversion, dataset: selectedDataset || null }
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dataset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Blotout test pixel</SelectItem>
                          <SelectItem value="2">RYZE - ARC - Pixel</SelectItem>
                          <SelectItem value="3">RYZE, LLC's Pixel</SelectItem>
                        </SelectContent>
                      </Select>
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

                {/* Enhanced Targeting */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold">Targeting</Label>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Age</Label>
                        <Input
                          type="number"
                          value={templateForm.targeting.ageMin}
                          onChange={(e) => setTemplateForm({ 
                            ...templateForm, 
                            targeting: { ...templateForm.targeting, ageMin: parseInt(e.target.value) || 18 }
                          })}
                          min="13"
                          max="65"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Age</Label>
                        <Input
                          type="number"
                          value={templateForm.targeting.ageMax}
                          onChange={(e) => setTemplateForm({ 
                            ...templateForm, 
                            targeting: { ...templateForm.targeting, ageMax: parseInt(e.target.value) || 65 }
                          })}
                          min="13"
                          max="65"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Country Locations</Label>
                      <Select 
                        onValueChange={(value) => {
                          // TODO: Get countries from Facebook API
                          const mockCountries: FacebookLocation[] = [
                            { id: 'US', name: 'United States', type: 'country', country_code: 'US' },
                            { id: 'CA', name: 'Canada', type: 'country', country_code: 'CA' },
                            { id: 'GB', name: 'United Kingdom', type: 'country', country_code: 'GB' },
                            { id: 'DE', name: 'Germany', type: 'country', country_code: 'DE' },
                            { id: 'FR', name: 'France', type: 'country', country_code: 'FR' }
                          ];
                          const selectedCountry = mockCountries.find(c => c.id === value);
                          if (selectedCountry && !templateForm.targeting.locations.find(l => l.id === selectedCountry.id)) {
                            setTemplateForm({ 
                              ...templateForm, 
                              targeting: { 
                                ...templateForm.targeting, 
                                locations: [...templateForm.targeting.locations, selectedCountry]
                              }
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select countries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Display selected locations */}
                      {templateForm.targeting.locations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {templateForm.targeting.locations.map((location) => (
                            <Badge key={location.id} variant="secondary" className="flex items-center gap-1">
                              {location.name}
                              <button
                                onClick={() => setTemplateForm({ 
                                  ...templateForm, 
                                  targeting: { 
                                    ...templateForm.targeting, 
                                    locations: templateForm.targeting.locations.filter(l => l.id !== location.id)
                                  }
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

              {/* Placement Controls */}
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold bg-blue-600 text-white p-2 rounded-t-lg -mt-6 -mx-6 mb-4 block">
                    Placement controls
                  </Label>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'feeds', label: 'Feeds', description: 'Get high visibility for your business with ads in feeds' },
                    { key: 'storiesAndReels', label: 'Stories and Reels', description: 'Tell a rich, visual story with immersive, fullscreen vertical ads' },
                    { key: 'inStreamAds', label: 'In-stream ads for videos and reels', description: 'Reach people before, during or after they watch a video or reel' },
                    { key: 'searchResults', label: 'Search results', description: 'Get visibility for your business as people search' },
                    { key: 'appsAndSites', label: 'Apps and sites', description: 'Expand your reach with ads in external apps and websites' }
                  ].map((option) => (
                    <div key={option.key} className="flex items-start space-x-3 p-2 rounded border">
                      <input
                        type="checkbox"
                        id={option.key}
                        defaultChecked
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={option.key} className="font-medium">{option.label}</Label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateTemplate}
                disabled={
                  createTemplate.isPending || 
                  !templateForm.name.trim() || 
                  !templateForm.adDescription.trim() ||
                  !templateForm.adCopy.headline.trim() || 
                  !templateForm.adCopy.primaryText.trim() ||
                  !templateForm.targeting.locations.length ||
                  !templateForm.conversion.conversionEvent ||
                  !templateForm.conversion.dataset
                }
                className="w-full"
              >
                {createTemplate.isPending ? 'Creating Template...' : 'Create Template'}
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
                          <p className="text-sm text-muted-foreground">{template.description}</p>
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
                        <Badge variant="outline">Age: {template.targeting.ageMin}-{template.targeting.ageMax}</Badge>
                        <Badge variant="outline">Locations: {template.targeting.locations?.length || 0}</Badge>
                        <Badge variant="outline">{template.budget.currency}</Badge>
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
                Upload media and create multiple ads using templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Media Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Upload Media for This Session</Label>
                  <Badge variant="outline">{bulkAdsForm.uploadedMedia.length} files</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="media">Select Images & Videos</Label>
                  <Input
                    id="media"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploadMedia.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Supported formats: JPG, PNG, GIF, MP4, MOV, AVI
                  </p>
                </div>
                {uploadMedia.isPending && (
                  <Progress value={33} className="w-full" />
                )}
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Select Template *</Label>
                <Select 
                  value={bulkAdsForm.templateId}
                  onValueChange={(value) => setBulkAdsForm({ ...bulkAdsForm, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (required)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.data?.templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!bulkAdsForm.templateId && (
                  <p className="text-sm text-red-500">Template selection is required to create ads</p>
                )}
              </div>

              {/* Individual Ad Items */}
              {bulkAdsForm.adItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Configure Individual Ads</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mass apply campaign
                          if (bulkAdsForm.massApplyOptions.campaignId) {
                            const selectedCampaign = bulkAdsForm.campaigns.find(c => c.id === bulkAdsForm.massApplyOptions.campaignId);
                            setBulkAdsForm(prev => ({
                              ...prev,
                              adItems: prev.adItems.map(item => ({
                                ...item,
                                campaignId: bulkAdsForm.massApplyOptions.campaignId!,
                                campaignName: selectedCampaign?.name || ''
                              }))
                            }));
                          }
                        }}
                      >
                        Apply Campaign to All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mass apply budget
                          if (bulkAdsForm.massApplyOptions.budget) {
                            setBulkAdsForm(prev => ({
                              ...prev,
                              adItems: prev.adItems.map(item => ({
                                ...item,
                                budget: bulkAdsForm.massApplyOptions.budget!
                              }))
                            }));
                          }
                        }}
                      >
                        Apply Budget to All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mass apply Advantage+ Creative Enhancements
                          const enhancements = bulkAdsForm.massApplyOptions.advantagePlusEnhancements;
                          if (enhancements) {
                            setBulkAdsForm(prev => ({
                              ...prev,
                              adItems: prev.adItems.map(item => ({
                                ...item,
                                advantagePlusEnhancements: enhancements
                              }))
                            }));
                          }
                        }}
                      >
                        Apply Advantage+ to All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mass apply pixel
                          if (bulkAdsForm.massApplyOptions.pixelId) {
                            const selectedPixel = mockPixels.find(p => p.id === bulkAdsForm.massApplyOptions.pixelId);
                            setBulkAdsForm(prev => ({
                              ...prev,
                              adItems: prev.adItems.map(item => ({
                                ...item,
                                selectedPixelId: bulkAdsForm.massApplyOptions.pixelId,
                                selectedPixelName: selectedPixel?.name
                              }))
                            }));
                          }
                        }}
                      >
                        Apply Pixel to All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mass apply URL parameters
                          if (bulkAdsForm.massApplyOptions.urlParams) {
                            setBulkAdsForm(prev => ({
                              ...prev,
                              adItems: prev.adItems.map(item => ({
                                ...item,
                                urlParameters: bulkAdsForm.massApplyOptions.urlParams
                              }))
                            }));
                          }
                        }}
                      >
                        Apply URL Params to All
                      </Button>
                    </div>
                  </div>

                  {/* Mass Apply Options */}
                  <div className="grid grid-cols-7 gap-4 p-4 border rounded">
                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply Campaign</Label>
                      <select
                        value={bulkAdsForm.massApplyOptions.campaignId || ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, campaignId: e.target.value }
                        }))}
                        className="w-full text-sm border rounded px-2 py-1"
                      >
                        <option value="">Select Campaign</option>
                        {bulkAdsForm.campaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply Budget</Label>
                      <Input
                        type="number"
                        value={bulkAdsForm.massApplyOptions.budget || ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, budget: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={bulkAdsForm.massApplyOptions.startDate ? bulkAdsForm.massApplyOptions.startDate.toISOString().slice(0, 16) : ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, startDate: e.target.value ? new Date(e.target.value) : null }
                        }))}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply Facebook Page</Label>
                      <select
                        value={bulkAdsForm.massApplyOptions.facebookPageId || ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, facebookPageId: e.target.value }
                        }))}
                        className="w-full text-sm border rounded px-2 py-1"
                      >
                        <option value="">Select Page</option>
                        {bulkAdsForm.facebookPages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply Instagram Page</Label>
                      <select
                        value={bulkAdsForm.massApplyOptions.instagramPageId || ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, instagramPageId: e.target.value }
                        }))}
                        className="w-full text-sm border rounded px-2 py-1"
                      >
                        <option value="">Select Page</option>
                        {bulkAdsForm.instagramPages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.name}
                          </option>
                        ))}
                      </select>
                    </div>

                                         <div className="space-y-2">
                       <Label className="text-xs">Mass Apply Advantage+ Enhancements</Label>
                       <p className="text-xs text-muted-foreground">Configure individual ad settings for Advantage+ features</p>
                     </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply Pixel</Label>
                      <select
                        value={bulkAdsForm.massApplyOptions.pixelId || ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, pixelId: e.target.value }
                        }))}
                        className="w-full text-sm border rounded px-2 py-1"
                      >
                        <option value="">Select Pixel</option>
                        {mockPixels.map((pixel) => (
                          <option key={pixel.id} value={pixel.id}>
                            {pixel.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mass Apply URL Params</Label>
                      <Input
                        value={bulkAdsForm.massApplyOptions.urlParams || ''}
                        onChange={(e) => setBulkAdsForm(prev => ({
                          ...prev,
                          massApplyOptions: { ...prev.massApplyOptions, urlParams: e.target.value }
                        }))}
                        placeholder="key1=value1&key2=value2"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Individual Ad Rows */}
                  <div className="space-y-2">
                    {bulkAdsForm.adItems.map((item) => (
                      <AdRow
                        key={item.id}
                        ad={item}
                        campaigns={bulkAdsForm.campaigns}
                        facebookPages={bulkAdsForm.facebookPages}
                        instagramPages={bulkAdsForm.instagramPages}
                        pixels={mockPixels}
                        templates={templates.data?.templates || []}
                        selectedTemplateId={bulkAdsForm.templateId}
                        onUpdate={(updatedAd) => {
                          setBulkAdsForm(prev => ({
                            ...prev,
                            adItems: prev.adItems.map(item => 
                              item.id === updatedAd.id ? updatedAd : item
                            )
                          }));
                        }}
                        onRemove={() => {
                          setBulkAdsForm(prev => ({
                            ...prev,
                            adItems: prev.adItems.filter(adItem => adItem.id !== item.id),
                            uploadedMedia: prev.uploadedMedia.filter(media => 
                              !prev.adItems.find(adItem => adItem.id === item.id)?.mediaId.includes(media.id)
                            )
                          }));
                        }}
                        onTemplateChange={(templateId) => {
                          setBulkAdsForm(prev => ({
                            ...prev,
                            templateId: templateId
                          }));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (!apiClient || !selectedAdAccount || !selectedPage) {
                      toast({
                        title: 'Preview failed',
                        description: 'Please connect to Facebook and select an ad account and page first.',
                        variant: 'destructive',
                      });
                      return;
                    }

                    try {
                      const service = new FacebookAdService(apiClient);
                      const template = templates.data?.templates.find(t => t.id === bulkAdsForm.templateId);
                      if (!template) {
                        toast({
                          title: 'Preview failed',
                          description: 'Please select a template first.',
                          variant: 'destructive',
                        });
                        return;
                      }

                      // Convert template to EnhancedAdTemplate format
                      const enhancedTemplate = {
                        ...template,
                        adDescription: template.description || '',
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
                          ...template.targeting,
                          ageMin: template.targeting.ageMin || 18,
                          ageMax: template.targeting.ageMax || 65,
                          customAudienceExclusion: [],
                          languages: [],
                          locations: {
                            inclusion: template.targeting.locations || [],
                            exclusion: []
                          }
                        }
                      };

                      // Generate previews for each ad item
                      const previews = [];
                      for (const adItem of bulkAdsForm.adItems) {
                        const creativeData = service['mapTemplateToCreative'](enhancedTemplate, adItem, selectedPage.id);
                        const previewUrl = await service.generateAdPreview(
                          selectedAdAccount.id,
                          creativeData,
                          'DESKTOP_FEED_STANDARD'
                        );
                        previews.push({
                          adId: adItem.id,
                          previewUrl,
                          adFormat: 'DESKTOP_FEED_STANDARD',
                          adName: adItem.adName,
                        });
                      }

                      setAdPreviews(previews);
                      setShowPreview(true);
                    } catch (error) {
                      toast({
                        title: 'Preview failed',
                        description: error instanceof Error ? error.message : 'Failed to generate previews',
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={!isAuthenticated || !selectedAdAccount || !selectedPage || !bulkAdsForm.templateId || bulkAdsForm.adItems.length === 0}
                  className="flex-1"
                >
                  Preview Ads
                </Button>
                <Button 
                  onClick={handleCreateBulkAds}
                  disabled={createEnhancedBulkAds.isPending || !bulkAdsForm.templateId || bulkAdsForm.adItems.length === 0}
                  className="flex-1"
                >
                  {createEnhancedBulkAds.isPending ? 'Creating Ads...' : 'Create Bulk Ads'}
                </Button>
              </div>
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