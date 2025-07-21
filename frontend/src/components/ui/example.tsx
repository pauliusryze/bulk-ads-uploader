import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Progress } from './progress';

export function ExampleComponent() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facebook Ads Bulk Uploader</CardTitle>
          <CardDescription>
            Upload multiple images and create ads with templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="Enter your email" />
          </div>
          
          <div className="flex gap-2">
            <Button>Primary Action</Button>
            <Button variant="outline">Secondary Action</Button>
            <Button variant="destructive">Delete</Button>
          </div>
          
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Error</Badge>
          </div>
          
          <div className="space-y-2">
            <Label>Upload Progress</Label>
            <Progress value={33} className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 