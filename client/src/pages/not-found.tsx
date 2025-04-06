import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [isOffline, setIsOffline] = useState(false);
  
  // Check if user is offline
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    // Initial check
    updateOnlineStatus();
    
    // Set up event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Clean up
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="senior-card w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center mb-6 text-center">
            {isOffline ? (
              <>
                <WifiOff className="h-16 w-16 text-amber-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">You're Offline</h1>
                <p className="text-xl text-gray-700 mb-8">
                  It looks like you don't have an internet connection right now. Some features may not be available.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                <p className="text-xl text-gray-700 mb-8">
                  We couldn't find the page you were looking for.
                </p>
              </>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/">
                <Button className="senior-button flex items-center gap-2" size="lg">
                  <Home className="h-5 w-5" />
                  <span>Return to Home</span>
                </Button>
              </Link>
              
              {isOffline && (
                <Button 
                  variant="outline" 
                  className="senior-button flex items-center gap-2" 
                  size="lg"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Try Again</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
