
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Accessibility, ZoomIn, ZoomOut, Contrast, Copyright } from "lucide-react";

const FONT_SIZE_KEY = 'app-font-size';
const HIGH_CONTRAST_KEY = 'app-high-contrast';

const AccessibilityToggle = () => {
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const [highContrast, setHighContrast] = useState(false);

  // Load saved preferences on component mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    const savedHighContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
    
    if (savedFontSize) {
      setFontSizeLevel(parseInt(savedFontSize));
      applyFontSize(parseInt(savedFontSize));
    }
    
    if (savedHighContrast === 'true') {
      setHighContrast(true);
      applyHighContrast(true);
    }
  }, []);

  const applyFontSize = (level: number) => {
    const htmlElement = document.documentElement;
    
    // Reset classes first
    htmlElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    
    // Apply new font size class
    switch (level) {
      case -1:
        htmlElement.classList.add('text-sm');
        break;
      case 0:
        htmlElement.classList.add('text-base');
        break;
      case 1:
        htmlElement.classList.add('text-lg');
        break;
      case 2:
        htmlElement.classList.add('text-xl');
        break;
      default:
        htmlElement.classList.add('text-base');
    }
    
    // Save preference
    localStorage.setItem(FONT_SIZE_KEY, level.toString());
  };

  const applyHighContrast = (enabled: boolean) => {
    const htmlElement = document.documentElement;
    
    if (enabled) {
      htmlElement.classList.add('high-contrast');
    } else {
      htmlElement.classList.remove('high-contrast');
    }
    
    // Save preference
    localStorage.setItem(HIGH_CONTRAST_KEY, enabled.toString());
  };

  const increaseFontSize = () => {
    const newLevel = Math.min(fontSizeLevel + 1, 2);
    setFontSizeLevel(newLevel);
    applyFontSize(newLevel);
  };

  const decreaseFontSize = () => {
    const newLevel = Math.max(fontSizeLevel - 1, -1);
    setFontSizeLevel(newLevel);
    applyFontSize(newLevel);
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    applyHighContrast(newValue);
  };

  return (
    <div className="fixed bottom-20 right-5 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full bg-white shadow-md hover:bg-primary hover:text-primary-foreground">
            <Accessibility className="h-5 w-5" />
            <span className="sr-only">Accessibility options</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-56">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Accessibility Options</h4>
              <p className="text-sm text-muted-foreground">Customize your viewing preferences.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h5 className="text-sm font-medium leading-none">Font Size</h5>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={decreaseFontSize} 
                  disabled={fontSizeLevel <= -1}
                >
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Decrease font size</span>
                </Button>
                <span className="text-sm flex-1 text-center">
                  {fontSizeLevel === -1 ? 'Small' : 
                   fontSizeLevel === 0 ? 'Normal' : 
                   fontSizeLevel === 1 ? 'Large' : 'Extra Large'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={increaseFontSize} 
                  disabled={fontSizeLevel >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Increase font size</span>
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  <h5 className="text-sm font-medium leading-none">High Contrast</h5>
                </div>
                <Button 
                  variant={highContrast ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleHighContrast}
                >
                  {highContrast ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AccessibilityToggle;
