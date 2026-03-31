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

export default function Settings() {
  const { settings, updateSettings } = useStore();
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
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
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
                  />
                  <Label
                    htmlFor="logo"
                    className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Label>
                  {formData.logoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-destructive"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
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
                placeholder="e.g. Mwabonje Studio"
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
                placeholder="e.g. hello@mwabonje.com"
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
                placeholder="e.g. www.mwabonje.com"
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
                  placeholder="e.g. Bank: Standard Chartered&#10;Acc Name: Mwabonje Photography&#10;Acc No: 0100000000000"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
