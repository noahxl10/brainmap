import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Phone, MessageSquare } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const requestCodeMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; name?: string }) => {
      return await apiRequest('POST', '/api/auth/request-code', data);
    },
    onSuccess: () => {
      setStep('verify');
      toast({
        title: "Code sent!",
        description: "Check your phone for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; code: string }) => {
      return await apiRequest('POST', '/api/auth/verify-code', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setLocation('/');
      toast({
        title: "Welcome!",
        description: "You've been logged in successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid code",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    },
  });

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    requestCodeMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      name: name.trim() || undefined,
    });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast({
        title: "Code required",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }
    verifyCodeMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      code: verificationCode.trim(),
    });
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length > 0 && !cleaned.startsWith('1')) {
      return '+1' + cleaned;
    } else if (cleaned.startsWith('1')) {
      return '+' + cleaned;
    }
    return '+' + cleaned;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">
                Br<span className="text-purple-600">AI</span>n Map
              </h1>
            </div>
          </div>
          <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your phone number to get started' 
              : 'Enter the code sent to your phone'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={requestCodeMutation.isPending}
              >
                {requestCodeMutation.isPending ? 'Sending...' : 'Send Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center text-sm text-slate-600 mb-4">
                Code sent to {phoneNumber}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? 'Verifying...' : 'Verify Code'}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep('phone')}
              >
                Back to phone number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}