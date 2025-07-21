import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  isComplete: boolean;
  hasErrors: boolean;
  onClose: () => void;
  onViewInFacebook?: () => void;
}

export function ProgressModal({
  isOpen,
  progress,
  message,
  isComplete,
  hasErrors,
  onClose,
  onViewInFacebook
}: ProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isComplete ? (
              hasErrors ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {isComplete ? 'Ad Creation Complete' : 'Creating Ads...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{message}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {isComplete && (
            <div className="space-y-3">
              {hasErrors ? (
                <div className="text-sm text-red-600">
                  Ad creation completed with some errors. Check the details above.
                </div>
              ) : (
                <div className="text-sm text-green-600">
                  ✅ All ads created successfully in PAUSED status!
                </div>
              )}
              
              <div className="flex gap-2">
                {onViewInFacebook && (
                  <Button onClick={onViewInFacebook} className="flex-1">
                    View in Facebook
                  </Button>
                )}
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 