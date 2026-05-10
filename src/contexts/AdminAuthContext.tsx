import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  isAdminLoading: boolean;
  adminLogout: () => Promise<void>;
  setAdminAuth: (admin: Admin, token: string) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const navigate = useNavigate();

  const setAdminAuth = (newAdmin: Admin, newToken: string) => {
    setAdmin(newAdmin);
    setToken(newToken);
    sessionStorage.setItem('adminToken', newToken);
    sessionStorage.setItem('admin', JSON.stringify(newAdmin));
  };

  const adminLogout = async () => {
    try {
      const currentToken = sessionStorage.getItem('adminToken');
      if (currentToken) {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('admin');
      setAdmin(null);
      setToken(null);
      navigate('/admin/login');
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      const storedToken = sessionStorage.getItem('adminToken');
      const storedAdmin = sessionStorage.getItem('admin');

      if (storedToken) {
        setToken(storedToken);
        if (storedAdmin) {
            setAdmin(JSON.parse(storedAdmin));
        }

        try {
          const response = await fetch('/api/admin/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setAdmin(data);
            sessionStorage.setItem('admin', JSON.stringify(data));
          } else if (response.status === 401) {
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('admin');
            setAdmin(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Failed to fetch admin profile:', error);
        }
      }
      setIsAdminLoading(false);
    };

    initializeAdmin();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, token, isAdminLoading, adminLogout, setAdminAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
