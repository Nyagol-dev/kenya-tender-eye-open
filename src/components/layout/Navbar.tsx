
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, UserCircle, LogOut, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut, loadingInitial } = useAuth(); // Get user and signOut from context

  return (
    <header className="sticky top-0 z-50 w-full border-b border-kenya-black/10 bg-white">
      <div className="container flex h-16 items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex flex-col justify-center">
              <span className="h-1 w-8 bg-kenya-green mb-0.5"></span>
              <span className="h-1 w-8 bg-kenya-red mb-0.5"></span>
              <span className="h-1 w-8 bg-kenya-black"></span>
            </div>
            <span className="font-bold text-lg md:text-xl">Kenya e-Procurement</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg hidden md:flex">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tenders..."
              className="w-full pl-8"
            />
          </div>
          <nav className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/tenders">Tenders</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/suppliers">Suppliers</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link to="/about">About</Link>
            </Button>
            
            {loadingInitial ? (
              <div className="h-8 w-20 animate-pulse bg-gray-200 rounded-md"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <UserCircle className="h-6 w-6" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="sm:hidden" asChild>
                     <Link to="/tenders">Tenders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="sm:hidden" asChild>
                     <Link to="/suppliers">Suppliers</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="md:hidden" asChild>
                     <Link to="/about">About</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login/Sign Up
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
