import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { PhoneIcon, DownloadIcon, XIcon } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isStandalone, isIOS, isAndroid, canInstall, promptInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  // Don't show if already installed or can't be installed
  useEffect(() => {
    if (!isStandalone && (canInstall || isIOS)) {
      // Wait a bit before showing the prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Wait 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isStandalone, canInstall, isIOS]);
  
  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (canInstall) {
      try {
        const installed = await promptInstall();
        if (installed) {
          toast({
            title: "App Installed!",
            description: "Ally has been added to your home screen.",
          });
        }
      } catch (error) {
        console.error('Installation error:', error);
        toast({
          title: "Installation Failed",
          description: "There was a problem installing the app. Please try again.",
          variant: "destructive",
        });
      }
    }
    setShowPrompt(false);
  };
  
  if (!showPrompt && !showIOSInstructions) return null;
  
  return (
    <>
      {/* Standard Install Prompt */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="senior-card max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Ally to Home Screen</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Install this app on your device for a better experience with larger buttons, offline access,
              and easy access from your home screen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center my-4">
            <PhoneIcon className="h-16 w-16 text-primary" />
          </div>
          
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button
              className="w-full senior-button bg-primary hover:bg-primary/90"
              onClick={handleInstall}
            >
              <DownloadIcon className="mr-2 h-5 w-5" />
              Install App
            </Button>
            
            <Button
              variant="outline"
              className="w-full senior-button"
              onClick={() => setShowPrompt(false)}
            >
              <XIcon className="mr-2 h-5 w-5" />
              Not Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* iOS Instructions (separate dialog) */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="senior-card max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Install on iOS</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Follow these steps to add Ally to your home screen:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 text-lg">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full h-7 w-7 flex items-center justify-center mt-1">
                1
              </div>
              <p>Tap the "Share" button in Safari <span className="text-xl">⎙</span></p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full h-7 w-7 flex items-center justify-center mt-1">
                2
              </div>
              <p>Scroll down and tap "Add to Home Screen"</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 rounded-full h-7 w-7 flex items-center justify-center mt-1">
                3
              </div>
              <p>Tap "Add" in the top right corner</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              className="w-full senior-button"
              onClick={() => setShowIOSInstructions(false)}
            >
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}