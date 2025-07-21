import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Eye, Play, ExternalLink } from 'lucide-react';

interface AdPreviewProps {
  previewUrl: string;
  adName: string;
  adFormat: string;
  onApprove?: () => void;
  onReject?: () => void;
  onViewInFacebook?: () => void;
}

export function AdPreview({ 
  previewUrl, 
  adName, 
  adFormat, 
  onApprove, 
  onReject, 
  onViewInFacebook 
}: AdPreviewProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{adName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {adFormat.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ad Preview */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div 
            className="w-full h-64 bg-gray-100"
            dangerouslySetInnerHTML={{ __html: previewUrl }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onApprove && (
            <Button 
              size="sm" 
              onClick={onApprove}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {onReject && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onReject}
              className="flex-1"
            >
              Reject
            </Button>
          )}
          {onViewInFacebook && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onViewInFacebook}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BulkAdPreviewProps {
  previews: Array<{
    adId: string;
    previewUrl: string;
    adFormat: string;
    adName: string;
  }>;
  onApproveAll?: () => void;
  onRejectAll?: () => void;
  onViewInFacebook?: (adId: string) => void;
}

export function BulkAdPreview({ 
  previews, 
  onApproveAll, 
  onRejectAll, 
  onViewInFacebook 
}: BulkAdPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ad Previews</h3>
        <div className="flex gap-2">
          {onApproveAll && (
            <Button size="sm" onClick={onApproveAll}>
              <Eye className="w-4 h-4 mr-2" />
              Approve All
            </Button>
          )}
          {onRejectAll && (
            <Button size="sm" variant="outline" onClick={onRejectAll}>
              Reject All
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {previews.map((preview) => (
          <AdPreview
            key={preview.adId}
            previewUrl={preview.previewUrl}
            adName={preview.adName}
            adFormat={preview.adFormat}
            onViewInFacebook={() => onViewInFacebook?.(preview.adId)}
          />
        ))}
      </div>
    </div>
  );
} 