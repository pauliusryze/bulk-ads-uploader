import React from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { CalendarIcon, Play, Info, Globe, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { BulkAdItem, FacebookCampaign, FacebookPage, FacebookPixel, MediaSetupOption, AdvantagePlusEnhancements } from '../types';

interface AdRowProps {
  ad: BulkAdItem;
  campaigns: FacebookCampaign[];
  facebookPages: FacebookPage[];
  instagramPages: FacebookPage[];
  pixels: FacebookPixel[];
  templates: any[];
  selectedTemplateId: string;
  onUpdate: (updatedAd: BulkAdItem) => void;
  onRemove: () => void;
  onTemplateChange: (templateId: string) => void;
}

export function AdRow({ ad, campaigns, facebookPages, instagramPages, pixels, templates, selectedTemplateId, onUpdate, onRemove, onTemplateChange }: AdRowProps) {
  const handleFieldChange = (field: keyof BulkAdItem, value: any) => {
    onUpdate({ ...ad, [field]: value });
  };

  const handleAdvantagePlusChange = (enhancement: keyof AdvantagePlusEnhancements, value: boolean) => {
    onUpdate({
      ...ad,
      advantagePlusEnhancements: {
        ...ad.advantagePlusEnhancements,
        [enhancement]: value
      }
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Media Thumbnail */}
          <div className="flex items-center space-x-3">
            <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              {ad.mediaType === 'video' ? (
                <Play className="w-6 h-6 text-gray-500" />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{ad.filename}</p>
              <Badge variant="secondary" className="text-xs">
                {ad.mediaType.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Campaign Selection */}
          <div className="space-y-2">
            <Label>Campaign</Label>
            <select
              value={ad.campaignId}
              onChange={(e) => handleFieldChange('campaignId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ad Set & Ad Name */}
          <div className="space-y-2">
            <Label>Adset Name</Label>
            <Input
              value={ad.adSetName}
              onChange={(e) => handleFieldChange('adSetName', e.target.value)}
              placeholder="Adset Name"
            />
          </div>

          <div className="space-y-2">
            <Label>Ad Name</Label>
            <Input
              value={ad.adName}
              onChange={(e) => handleFieldChange('adName', e.target.value)}
              placeholder="Ad Name"
            />
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Budget</Label>
            <Input
              type="number"
              value={ad.budget}
              onChange={(e) => handleFieldChange('budget', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          {/* Bid Strategy */}
          <div className="space-y-2">
            <Label>Bid Strategy</Label>
            <select
              value={ad.bidStrategy || 'LOWEST_COST_WITHOUT_CAP'}
              onChange={(e) => handleFieldChange('bidStrategy', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="LOWEST_COST_WITHOUT_CAP">Lowest Cost (Recommended)</option>
              <option value="LOWEST_COST_WITH_BID_CAP">Lowest Cost with Bid Cap</option>
              <option value="COST_CAP">Cost Cap</option>
              <option value="BID_CAP">Bid Cap</option>
              <option value="ABSOLUTE_OCPM">Absolute oCPM</option>
            </select>
          </div>

          {/* Bid Amount - Only show for strategies that need it */}
          {(ad.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || 
            ad.bidStrategy === 'COST_CAP' || 
            ad.bidStrategy === 'BID_CAP' || 
            ad.bidStrategy === 'ABSOLUTE_OCPM') && (
            <div className="space-y-2">
              <Label>Bid Amount</Label>
              <Input
                type="number"
                value={ad.bidAmount || ''}
                onChange={(e) => handleFieldChange('bidAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !ad.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {ad.startDate ? format(ad.startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                                  <Calendar
                    mode="single"
                    selected={ad.startDate || undefined}
                    onSelect={(date) => handleFieldChange('startDate', date)}
                    initialFocus
                  />
              </PopoverContent>
            </Popover>
          </div>

          {/* Facebook Page Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Facebook Page
            </Label>
            <select
              value={ad.facebookPageId}
              onChange={(e) => handleFieldChange('facebookPageId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Facebook Page</option>
              {facebookPages.filter(page => page.type === 'facebook' || page.type === 'both').map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

          {/* Instagram Page Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram Page
            </Label>
            <select
              value={ad.instagramPageId}
              onChange={(e) => handleFieldChange('instagramPageId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Instagram Page</option>
              {instagramPages.filter(page => page.type === 'instagram' || page.type === 'both').map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <select
              value={selectedTemplateId}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Media Setup */}
          <div className="space-y-2">
            <Label>Media Setup</Label>
            <div className="text-sm text-muted-foreground">
              Manual upload - Upload your own media files
            </div>
          </div>

          {/* Pixel Selection */}
          <div className="space-y-2">
            <Label>Pixel</Label>
            <select
              value={ad.pixelId}
              onChange={(e) => handleFieldChange('pixelId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Pixel</option>
              {pixels.map((pixel) => (
                <option key={pixel.id} value={pixel.id}>
                  {pixel.name}
                </option>
              ))}
            </select>
          </div>

          {/* URL Parameters */}
          <div className="space-y-2">
            <Label>URL Params</Label>
            <Input
              value={ad.urlParams}
              onChange={(e) => handleFieldChange('urlParams', e.target.value)}
              placeholder="key1=value1&key2=value2"
            />
          </div>
        </div>

        {/* Advantage+ Creative Enhancements */}
        <div className="mt-6 border-t pt-4">
          <Label className="text-lg font-semibold mb-4 block">Advantage+ Creative Enhancements</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'translateText', label: 'Translate text', description: 'Translating primary text and headline into other languages.' },
              { key: 'showProducts', label: 'Show products', description: 'We\'ll add product tiles under your media.' },
              { key: 'visualTouchUps', label: 'Visual touch-ups', description: 'Automatically enhance your media visuals.' },
              { key: 'textImprovements', label: 'Text improvements', description: 'Any text you provide may appear as primary text, headline or description.' },
              { key: 'enhanceCTA', label: 'Enhance CTA', description: 'We\'ll pair key phrases with your CTA and optimize CTA text.' },
              { key: 'addVideoEffects', label: 'Add video effects', description: 'Automatically add effects to your videos.' }
            ].map((enhancement) => (
              <div key={enhancement.key} className="flex items-start space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id={`${enhancement.key}-${ad.id}`}
                  checked={ad.advantagePlusEnhancements[enhancement.key as keyof AdvantagePlusEnhancements]}
                  onChange={(e) => handleAdvantagePlusChange(
                    enhancement.key as keyof AdvantagePlusEnhancements,
                    e.target.checked
                  )}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={`${enhancement.key}-${ad.id}`} className="font-medium text-sm">
                    {enhancement.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{enhancement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remove Button */}
        <div className="mt-4 flex justify-end">
          <Button variant="destructive" onClick={onRemove} size="sm">
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 