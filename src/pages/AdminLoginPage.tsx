import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAdminAuth, token } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (token || sessionStorage.getItem('adminToken')) {
      navigate('/admin/dashboard');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminAuth(data.admin, data.token);
        toast({
          title: "Login Successful",
          description: "Welcome to the administration portal.",
        });
        navigate('/admin/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: data.message || "Invalid credentials or unauthorized access.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the authentication server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Subtle background patterns */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#006600]" />
      <div className="absolute top-1 left-0 w-full h-1 bg-[#bb0000]" />
      
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#006600]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#bb0000]/10 blur-[120px] rounded-full" />

      <Card className="w-full max-w-md border-none shadow-2xl z-10 bg-white">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-[#0f172a] text-white ring-4 ring-[#006600]/20">
              <Shield className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-[#0f172a]">
              e-Procurement Administration
            </CardTitle>
            <CardDescription className="text-sm font-medium text-[#bb0000] uppercase tracking-widest">
              Authorized Personnel Only
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@procurement.go.ke"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-200 focus-visible:ring-[#006600]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-slate-700 font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-200 focus-visible:ring-[#006600]"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#006600] hover:bg-[#004d00] text-white font-bold py-6 mt-2 shadow-lg transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "SECURE LOGIN"}
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-8 pt-4">
          <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
            <div className="h-px w-8 bg-slate-200" />
            <span>Republic of Kenya Government Portal</span>
            <div className="h-px w-8 bg-slate-200" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
