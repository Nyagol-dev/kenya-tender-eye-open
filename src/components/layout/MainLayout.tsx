
import Navbar from './Navbar';
import { ReactNode } from 'react';
import AccessibilityToggle from '../accessibility/AccessibilityToggle';
import { Link } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-kenya-black/10 bg-white py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Republic of Kenya. All rights reserved. Developed by Nickson.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <Link to="/documentation" className="text-sm text-muted-foreground hover:text-foreground">
              Terms & Documentation
            </Link>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
      <AccessibilityToggle />
    </div>
  );
};

export default MainLayout;
