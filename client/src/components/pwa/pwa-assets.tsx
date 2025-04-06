import { useEffect } from 'react';

export function PwaAssets() {
  useEffect(() => {
    // Add manifest link dynamically
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          
          // Check if service worker update is available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('New version available, refresh to update.');
                }
              });
            }
          });
          
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        } catch (error) {
          console.error('ServiceWorker registration failed: ', error);
        }
      });
      
      // Handle service worker updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }
    
    // Add a single Apple touch icon
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = '/generated-icon.png';
    document.head.appendChild(appleIcon);
    
    // Add a single favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = '/generated-icon.png';
    document.head.appendChild(favicon);
    
    // Add splash screen for iOS (just a basic one)
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) {
      const splashScreen = document.createElement('link');
      splashScreen.rel = 'apple-touch-startup-image';
      splashScreen.href = '/generated-icon.png';
      document.head.appendChild(splashScreen);
    }
  }, []);

  return null;
}