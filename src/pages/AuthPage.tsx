
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AuthPage = () => {
  const { user, loadingInitial } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingInitial && user) {
      navigate('/'); // Redirect if user is already logged in
    }
  }, [user, loadingInitial, navigate]);

  if (loadingInitial) {
    return <MainLayout><div className="container py-8 text-center">Loading...</div></MainLayout>;
  }
  
  // If user becomes non-null after initial load but before navigation, prevent rendering forms
  if (user) {
     return <MainLayout><div className="container py-8 text-center">Redirecting...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container flex flex-col items-center justify-center py-12">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AuthPage;
