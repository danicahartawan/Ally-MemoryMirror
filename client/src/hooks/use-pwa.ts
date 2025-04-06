import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstalled: boolean;
  isStandalone: boolean; 
  isIOS: boolean;
  isAndroid: boolean;
  canInstall: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  // Initial state
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    canInstall: false,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Check if app is installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/.test(userAgent);

    setState(prev => ({
      ...prev,
      isStandalone,
      isIOS,
      isAndroid
    }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event so it can be triggered later
      setState(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e as BeforeInstallPromptEvent
      }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        deferredPrompt: null
      }));
    };

    // Listen for standalone mode changes
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        isStandalone: e.matches
      }));
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

    // Clean up
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Function to prompt user to install the app
  const promptInstall = async (): Promise<boolean> => {
    const { deferredPrompt } = state;
    
    if (!deferredPrompt) {
      return false;
    }
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // Reset the deferred prompt
    setState(prev => ({
      ...prev,
      deferredPrompt: null,
      canInstall: false,
      isInstalled: choiceResult.outcome === 'accepted'
    }));
    
    return choiceResult.outcome === 'accepted';
  };

  return {
    ...state,
    promptInstall
  };
}