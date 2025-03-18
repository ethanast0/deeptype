import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ 
  open, 
  onOpenChange,
  onSubmit
}) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>('');
  const [subscription, setSubscription] = useState<'free' | 'pro'>('free');
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  
  useEffect(() => {
    // Load API key from localStorage if available
    const savedApiKey = localStorage.getItem('together_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Load subscription status if available
    const savedSubscription = localStorage.getItem('subscription_tier');
    if (savedSubscription && (savedSubscription === 'free' || savedSubscription === 'pro')) {
      setSubscription(savedSubscription);
    }
  }, []);
  
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save subscription preference (in a real app, this would call a payment processor)
    localStorage.setItem('subscription_tier', subscription);
    
    toast({
      title: subscription === 'free' ? "Free Plan Activated" : "Pro Plan Selected",
      description: subscription === 'free' 
        ? "You're on the free plan with 100 quotes per month."
        : "You've selected the Pro plan! Please complete payment to activate.",
    });
    
    onOpenChange(false);
    if (onSubmit) onSubmit();
    
    // In a real app, if Pro is selected, we'd redirect to payment page
    if (subscription === 'pro') {
      // Simulate opening payment page
      setTimeout(() => {
        toast({
          title: "Payment Required",
          description: "Please complete payment to activate Pro features.",
        });
      }, 1000);
    }
  };
  
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (apiKey.trim()) {
      localStorage.setItem('together_api_key', apiKey);
      toast({
        title: "API Key Saved",
        description: "Your API key has been saved to your browser's local storage.",
      });
    } else {
      localStorage.removeItem('together_api_key');
      toast({
        title: "API Key Removed",
        description: "Using default backend service for quote extraction.",
      });
    }
    
    onOpenChange(false);
    if (onSubmit) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quote Extraction Settings</DialogTitle>
          <DialogDescription>
            Choose your subscription level for quote extraction features.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'user' | 'admin')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">User Settings</TabsTrigger>
            <TabsTrigger value="admin">Advanced (Admin)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user">
            <form onSubmit={handleUserSubmit} className="space-y-4 py-4">
              <div className="space-y-4">
                <RadioGroup value={subscription} onValueChange={(value) => setSubscription(value as 'free' | 'pro')}>
                  <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer" onClick={() => setSubscription('free')}>
                    <RadioGroupItem value="free" id="free" />
                    <div className="flex-1">
                      <Label htmlFor="free" className="text-base font-medium">Free Plan</Label>
                      <p className="text-sm text-gray-500">100 quotes per month</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-500">
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3" /> Basic quote extraction
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3" /> Text & JSON uploads
                        </li>
                      </ul>
                    </div>
                    <div className="font-medium">$0</div>
                  </div>
                  
                  <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer border-blue-200 bg-blue-50" onClick={() => setSubscription('pro')}>
                    <RadioGroupItem value="pro" id="pro" />
                    <div className="flex-1">
                      <Label htmlFor="pro" className="text-base font-medium">Pro Plan</Label>
                      <p className="text-sm text-gray-500">Unlimited quotes</p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-500">
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3" /> Premium quote extraction
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3" /> PDF, DOCX, TXT uploads
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3" /> URL processing
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3" /> Priority processing
                        </li>
                      </ul>
                    </div>
                    <div className="font-medium">$5/mo</div>
                  </div>
                </RadioGroup>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Continue</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="admin">
            <form onSubmit={handleAdminSubmit} className="space-y-4 py-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="apiKey">Custom API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  placeholder="API key for Together.ai..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  For advanced users or self-hosting. Leave empty to use shared backend service.
                  <a href="https://www.together.ai/api" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">Get a Together.ai API key</a>
                </p>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Settings</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
