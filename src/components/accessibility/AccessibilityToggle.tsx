
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Accessibility, ZoomIn, ZoomOut, Contrast, Volume2, Keyboard, Play } from "lucide-react";

const FONT_SIZE_KEY = 'app-font-size';
const HIGH_CONTRAST_KEY = 'app-high-contrast';
const REDUCED_MOTION_KEY = 'app-reduced-motion';
const SCREEN_READER_KEY = 'app-screen-reader';

const AccessibilityToggle = () => {
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load saved preferences on component mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    const savedHighContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
    const savedReducedMotion = localStorage.getItem(REDUCED_MOTION_KEY);
    const savedScreenReader = localStorage.getItem(SCREEN_READER_KEY);
    
    if (savedFontSize) {
      setFontSizeLevel(parseInt(savedFontSize));
      applyFontSize(parseInt(savedFontSize));
    }
    
    if (savedHighContrast === 'true') {
      setHighContrast(true);
      applyHighContrast(true);
    }

    if (savedReducedMotion === 'true') {
      setReducedMotion(true);
      applyReducedMotion(true);
    }

    if (savedScreenReader === 'true') {
      setScreenReaderMode(true);
      applyScreenReaderMode(true);
    }
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A to toggle accessibility menu
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
      
      // Escape to close menu
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
    
    localStorage.setItem(FONT_SIZE_KEY, level.toString());
  };

  const applyHighContrast = (enabled: boolean) => {
    const htmlElement = document.documentElement;
    
    if (enabled) {
      htmlElement.classList.add('high-contrast');
    } else {
      htmlElement.classList.remove('high-contrast');
    }
    
    localStorage.setItem(HIGH_CONTRAST_KEY, enabled.toString());
  };

  const applyReducedMotion = (enabled: boolean) => {
    const htmlElement = document.documentElement;
    
    if (enabled) {
      htmlElement.style.setProperty('--animation-duration', '0.01ms');
      htmlElement.style.setProperty('--transition-duration', '0.01ms');
      // Add CSS class for reduced motion
      htmlElement.classList.add('reduce-motion');
    } else {
      htmlElement.style.removeProperty('--animation-duration');
      htmlElement.style.removeProperty('--transition-duration');
      htmlElement.classList.remove('reduce-motion');
    }
    
    localStorage.setItem(REDUCED_MOTION_KEY, enabled.toString());
  };

  const applyScreenReaderMode = (enabled: boolean) => {
    const htmlElement = document.documentElement;
    
    if (enabled) {
      // Add enhanced focus indicators and screen reader optimizations
      htmlElement.classList.add('screen-reader-mode');
      // Announce the change
      announceToScreenReader('Screen reader mode enabled');
    } else {
      htmlElement.classList.remove('screen-reader-mode');
      announceToScreenReader('Screen reader mode disabled');
    }
    
    localStorage.setItem(SCREEN_READER_KEY, enabled.toString());
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const increaseFontSize = () => {
    const newLevel = Math.min(fontSizeLevel + 1, 2);
    setFontSizeLevel(newLevel);
    applyFontSize(newLevel);
    announceToScreenReader(`Font size increased to ${getFontSizeLabel(newLevel)}`);
  };

  const decreaseFontSize = () => {
    const newLevel = Math.max(fontSizeLevel - 1, -1);
    setFontSizeLevel(newLevel);
    applyFontSize(newLevel);
    announceToScreenReader(`Font size decreased to ${getFontSizeLabel(newLevel)}`);
  };

  const getFontSizeLabel = (level: number) => {
    switch (level) {
      case -1: return 'Small';
      case 0: return 'Normal';
      case 1: return 'Large';
      case 2: return 'Extra Large';
      default: return 'Normal';
    }
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    applyHighContrast(newValue);
    announceToScreenReader(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    applyReducedMotion(newValue);
    announceToScreenReader(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleScreenReaderMode = () => {
    const newValue = !screenReaderMode;
    setScreenReaderMode(newValue);
    applyScreenReaderMode(newValue);
  };

  return (
    <>
      {/* Screen reader instructions */}
      <div className="sr-only">
        <p>Accessibility options are available. Press Alt + A to open accessibility menu, or use the accessibility button in the bottom right corner.</p>
      </div>
      
      <div className="fixed bottom-20 right-5 z-50">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white shadow-md hover:bg-primary hover:text-primary-foreground focus:ring-4 focus:ring-primary/50"
              aria-label="Open accessibility options (Alt + A)"
              aria-describedby="accessibility-description"
            >
              <Accessibility className="h-5 w-5" />
              <span className="sr-only">Accessibility options</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            className="w-72"
            aria-label="Accessibility options panel"
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Accessibility Options</h4>
                <p className="text-sm text-muted-foreground" id="accessibility-description">
                  Customize your viewing and interaction preferences. Use Tab to navigate, Enter to activate.
                </p>
              </div>
              
              <Separator />
              
              {/* Font Size Controls */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium leading-none">Font Size</h5>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={decreaseFontSize} 
                    disabled={fontSizeLevel <= -1}
                    aria-label="Decrease font size"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm flex-1 text-center" aria-live="polite">
                    {getFontSizeLabel(fontSizeLevel)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={increaseFontSize} 
                    disabled={fontSizeLevel >= 2}
                    aria-label="Increase font size"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* High Contrast */}
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
                    aria-pressed={highContrast}
                    aria-label={`High contrast mode ${highContrast ? 'enabled' : 'disabled'}`}
                  >
                    {highContrast ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Reduced Motion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <h5 className="text-sm font-medium leading-none">Reduced Motion</h5>
                  </div>
                  <Button 
                    variant={reducedMotion ? "default" : "outline"} 
                    size="sm" 
                    onClick={toggleReducedMotion}
                    aria-pressed={reducedMotion}
                    aria-label={`Reduced motion ${reducedMotion ? 'enabled' : 'disabled'}`}
                  >
                    {reducedMotion ? 'On' : 'Off'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reduces animations and transitions for users sensitive to motion
                </p>
              </div>
              
              <Separator />
              
              {/* Screen Reader Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <h5 className="text-sm font-medium leading-none">Screen Reader Mode</h5>
                  </div>
                  <Button 
                    variant={screenReaderMode ? "default" : "outline"} 
                    size="sm" 
                    onClick={toggleScreenReaderMode}
                    aria-pressed={screenReaderMode}
                    aria-label={`Screen reader mode ${screenReaderMode ? 'enabled' : 'disabled'}`}
                  >
                    {screenReaderMode ? 'On' : 'Off'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enhanced focus indicators and screen reader announcements
                </p>
              </div>
              
              <Separator />
              
              {/* Keyboard Navigation Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  <h5 className="text-sm font-medium leading-none">Keyboard Shortcuts</h5>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><kbd className="px-1 py-0.5 bg-muted rounded">Alt + A</kbd> - Open accessibility menu</p>
                  <p><kbd className="px-1 py-0.5 bg-muted rounded">Tab</kbd> - Navigate elements</p>
                  <p><kbd className="px-1 py-0.5 bg-muted rounded">Escape</kbd> - Close menu</p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export default AccessibilityToggle;
