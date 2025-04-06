import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Game from "@/pages/game";
import PhotoLibrary from "@/pages/photo-library";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ProfileProvider, useProfileContext } from "@/contexts/profile-context";
import { PhotoProvider } from "@/contexts/photo-context";
import { useEffect, useState } from "react";
import { PwaAssets } from "@/components/pwa/pwa-assets";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";

function Router() {
  const [location] = useLocation();
  const { selectedProfile } = useProfileContext();
  const isAuthRoute = location === "/login" || location === "/signup";
  
  // Handle mobile viewport height adjustments for better mobile experience
  useEffect(() => {
    const handleResize = () => {
      // Set a custom CSS variable for viewport height that accounts for mobile browsers
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If there's no selected profile and we're not on an auth route, redirect to login
  useEffect(() => {
    if (!selectedProfile && !isAuthRoute && location !== "/") {
      window.location.href = "/login";
    }
  }, [selectedProfile, isAuthRoute, location]);

  // Don't show header and footer for auth pages
  if (isAuthRoute) {
    return (
      <div className="flex flex-col min-h-screen" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
        <main className="flex-grow">
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
          </Switch>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <Header />
      <main className="flex-grow px-4 sm:px-6 py-6">
        <div className="senior-container">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/game" component={Game} />
            <Route path="/photos" component={PhotoLibrary} />
            <Route path="/insights" component={Insights} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Meta tags to make the app feel more native on mobile
function MobileMetaTags() {
  useEffect(() => {
    // Add meta tags for mobile app-like experience
    const metaTags = [
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Memory Mirror' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#FF9933' }, // Match our primary color
      { name: 'application-name', content: 'Memory Mirror' }
    ];
    
    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });
    
    // Add a link for apple-touch-icon
    let link = document.querySelector('link[rel="apple-touch-icon"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(link);
    }
    link.setAttribute('href', '/generated-icon.png');
  }, []);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <PhotoProvider>
          <MobileMetaTags />
          <PwaAssets />
          <Router />
          <PWAInstallPrompt />
          <Toaster />
        </PhotoProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
