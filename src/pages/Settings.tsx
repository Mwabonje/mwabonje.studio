import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getResolvedTheme } from '../lib/theme';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../components/ThemeProvider';

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          const MAX_DIMENSION = 400;
          if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.floor((MAX_DIMENSION / targetWidth) * targetHeight);
              targetWidth = MAX_DIMENSION;
            } else {
              targetWidth = Math.floor((MAX_DIMENSION / targetHeight) * targetWidth);
              targetHeight = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let minX = canvas.width;
          let minY = canvas.height;
          let maxX = 0;
          let maxY = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate brightness
            const brightness = (r + g + b) / 3;
            
            if (brightness < 160) {
              // It's the dark ink. Enhance it to a clean deep blue.
              data[i] = 10;     // R
              data[i+1] = 20;   // G
              data[i+2] = 100;  // B
              
              const alpha = ((160 - brightness) / 160) * 255;
              data[i+3] = alpha > 255 ? 255 : alpha;
              
              if (alpha > 50) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            } else {
              // Paper or faint lines
              data[i+3] = 0;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Crop the canvas to the bounding box if we found ink
          if (minX < maxX && minY < maxY) {
            const padding = 20;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(canvas.width, maxX + padding);
            maxY = Math.min(canvas.height, maxY + padding);
            
            const croppedCanvas = document.createElement("canvas");
            const croppedCtx = croppedCanvas.getContext("2d");
            if (croppedCtx) {
               croppedCanvas.width = maxX - minX;
               croppedCanvas.height = maxY - minY;
               croppedCtx.drawImage(canvas, minX, minY, croppedCanvas.width, croppedCanvas.height, 0, 0, croppedCanvas.width, croppedCanvas.height);
               setFormData((prev) => ({ ...prev, companySignature: croppedCanvas.toDataURL("image/png") }));
               return;
            }
          }
          
          setFormData((prev) => ({ ...prev, companySignature: canvas.toDataURL("image/png") }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error('Failed to save settings. Please check your connection.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company profile and invoice template settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>
              Your company details as they will appear on invoices and quotes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 opacity-50 pointer-events-none">
              <Label>Company Logo (Coming Soon)</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-md border flex items-center justify-center bg-slate-50 overflow-hidden">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled
                  />
                  <div
                    className="cursor-not-allowed inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm h-9 px-4 py-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </div>
                  {formData.logoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-destructive"
                      disabled
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. CaptureCRM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name / Photographer Name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                value={formData.ownerName || ''}
                onChange={handleChange}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email Address</Label>
              <Input
                id="companyEmail"
                name="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={handleChange}
                placeholder="e.g. hello@capturecrm.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone Number</Label>
              <Input
                id="companyPhone"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleChange}
                placeholder="e.g. +254 700 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Website</Label>
              <Input
                id="companyWebsite"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                placeholder="e.g. www.capturecrm.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Textarea
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                placeholder="e.g. 123 Studio Lane, Nairobi"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Template</CardTitle>
              <CardDescription>
                Customize how your invoices look.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="colorScheme">Color Scheme</Label>
                <Select
                  value={formData.colorScheme}
                  onValueChange={(value) => handleSelectChange('colorScheme', value)}
                >
                  <SelectTrigger id="colorScheme">
                    <SelectValue placeholder="Select a color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slate">Slate (Default)</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="rose">Rose</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="violet">Violet</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This color will be used for accents and headers on your invoices.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Default payment instructions for your invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="paymentDetails">Bank / Mobile Money Details</Label>
                <Textarea
                  id="paymentDetails"
                  name="paymentDetails"
                  value={formData.paymentDetails}
                  onChange={handleChange}
                  placeholder="e.g. Bank: Standard Chartered&#10;Acc Name: CaptureCRM&#10;Acc No: 0100000000000"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-75">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  Signatures & Branding
                  <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider">Coming Soon</Badge>
                </CardTitle>
                <CardDescription>
                  Upload images for your signatures.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pointer-events-none">
              <div className="space-y-2">
                <Label>Company Signature / Owner Signature</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-40 rounded-md border border-dashed flex items-center justify-center bg-slate-50/50 overflow-hidden">
                    {formData.companySignature ? (
                      <img src={formData.companySignature} alt="Signature" className="h-full w-full object-contain mix-blend-multiply opacity-50" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-200" />
                    )}
                  </div>
                  <div>
                    <Input
                      id="signature"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSignatureUpload}
                      disabled
                    />
                    <Label
                      htmlFor="signature"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background/50 shadow-sm h-9 px-4 py-2 opacity-50 select-none"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Signature
                    </Label>
                    {formData.companySignature && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-destructive"
                        onClick={() => setFormData(prev => ({ ...prev, companySignature: "" }))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Upload a signature with a transparent background for best results.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>App Theme</CardTitle>
            <CardDescription>
              Choose the color mode for the application interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label>Color Mode</Label>
                <Select 
                  value={theme} 
                  onValueChange={(val: any) => setTheme(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color mode..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  This setting is saved to your browser and applies instantly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Document Preferences</CardTitle>
            <CardDescription>
              Choose the visual theme for your generated quotes and invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={getResolvedTheme(formData.documentTheme, formData.companyEmail)} 
                  onValueChange={(val) => handleSelectChange('documentTheme', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(auth.currentUser?.email === 'ringa.michael@gmail.com' || formData.companyEmail === 'ringa.michael@gmail.com') && (
                      <SelectItem value="classic">Classic</SelectItem>
                    )}
                    <SelectItem value="modern">Modern Light</SelectItem>
                    <SelectItem value="minimal">Minimalist Monochrome</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  This will apply globally. Try out different themes by viewing a Quote or Invoice!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
