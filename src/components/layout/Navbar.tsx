
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Navbar = () => {
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
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link to="/tenders">Tenders</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/suppliers">Suppliers</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/flowchart">Flowchart</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/about">About</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
