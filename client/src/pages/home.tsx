import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileContext } from "@/contexts/profile-context";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { selectedProfile } = useProfileContext();

  if (!selectedProfile) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Welcome to Ally AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-neutral-medium">
              Please select a profile to continue.
            </p>
            <Button 
              onClick={() => setLocation("/settings")} 
              className="w-full"
            >
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Welcome, {selectedProfile.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-primary/10 rounded-t-lg">
            <CardTitle className="flex items-center">
              <i className="fas fa-gamepad mr-2 text-primary"></i>
              Memory Games
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">Exercise your memory with face recognition games that adapt to your progress.</p>
            <Button onClick={() => setLocation("/game")} className="w-full">
              Play Games
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-secondary/10 rounded-t-lg">
            <CardTitle className="flex items-center">
              <i className="fas fa-images mr-2 text-secondary"></i>
              Photo Library
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">Browse your collection of photos with faces of friends and family.</p>
            <Button 
              onClick={() => setLocation("/photos")} 
              variant="outline" 
              className="w-full"
            >
              View Photos
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-accent/10 rounded-t-lg">
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-line mr-2 text-accent"></i>
              Memory Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">Track your memory progress and see how you're improving over time.</p>
            <Button 
              onClick={() => setLocation("/insights")} 
              variant="outline" 
              className="w-full"
            >
              View Insights
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-neutral-light rounded-t-lg">
            <CardTitle className="flex items-center">
              <i className="fas fa-cog mr-2 text-neutral-medium"></i>
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">Manage your profile, photos, and application preferences.</p>
            <Button 
              onClick={() => setLocation("/settings")} 
              variant="outline" 
              className="w-full"
            >
              Open Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
