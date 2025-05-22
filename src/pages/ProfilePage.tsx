
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge"; // Import Badge

const ProfilePage = () => {
  const { user, profile, loadingInitial, loadingProfile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingInitial && !user) {
      navigate('/auth');
    }
  }, [user, loadingInitial, navigate]);

  if (loadingInitial || loadingProfile) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">Loading profile...</div>
      </MainLayout>
    );
  }

  if (!user || !profile) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <p>Could not load profile. Please try logging in again.</p>
          <Button asChild className="mt-4"><Link to="/auth">Login</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Profile</CardTitle>
              {profile.is_admin && <Badge variant="destructive">Admin</Badge>}
            </div>
            <CardDescription>Manage your account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
            <p><strong>User Type:</strong> {profile.user_type === 'supplier' ? 'Supplier' : 'Government Entity'}</p>
            {profile.user_type === 'supplier' && (
              <>
                <p><strong>Service Category:</strong> {profile.service_category?.name || 'Not set'}</p>
                <p><strong>Registration Number:</strong> {profile.registration_number || 'Not set'}</p>
                <p><strong>Location:</strong> {profile.location || 'Not set'}</p>
                <p><strong>Status:</strong> {profile.supplier_status || 'Not set'}</p>
              </>
            )}
            {profile.user_type === 'government_entity' && (
              <p><strong>Entity Name:</strong> {profile.entity_name || 'Not set'}</p>
            )}
            {/* Display admin status if not already shown as a badge or for clarity */}
            {/* <p><strong>Administrator:</strong> {profile.is_admin ? 'Yes' : 'No'}</p> */}
            <Button variant="outline" onClick={signOut} className="mr-2">
              Logout
            </Button>
            {/* TODO: Add Edit Profile button and functionality */}
             <Button disabled>Edit Profile (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;

