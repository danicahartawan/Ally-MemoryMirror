import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Tabs from "@/components/layout/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfileContext } from "@/contexts/profile-context";
import { useToast } from "@/hooks/use-toast";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export default function Settings() {
  const { selectedProfile, setSelectedProfile } = useProfileContext();
  const { toast } = useToast();
  const [showAddProfileDialog, setShowAddProfileDialog] = useState(false);

  // Profile form
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch all profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['/api/profiles'],
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      // Generate initials from name
      const initials = data.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
        
      const res = await apiRequest("POST", "/api/profiles", {
        name: data.name,
        avatarInitials: initials,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      setShowAddProfileDialog(false);
      form.reset();
      toast({
        title: "Profile created",
        description: `Profile for ${data.name} has been created.`
      });
      setSelectedProfile(data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create profile",
        description: error.message
      });
    }
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const res = await apiRequest("DELETE", `/api/profiles/${profileId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      if (selectedProfile && profiles.length > 1) {
        const otherProfile = profiles.find((p: any) => p.id !== selectedProfile.id);
        setSelectedProfile(otherProfile);
      } else {
        setSelectedProfile(null);
      }
      toast({
        title: "Profile deleted",
        description: "The profile has been removed."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete profile",
        description: error.message
      });
    }
  });

  const handleSubmit = form.handleSubmit((data) => {
    createProfileMutation.mutate(data);
  });

  const handleDeleteProfile = (profileId: number) => {
    if (confirm("Are you sure you want to delete this profile? This will remove all associated photos and game data.")) {
      deleteProfileMutation.mutate(profileId);
    }
  };

  return (
    <div>
      <Tabs active="settings" />
      
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold">Settings</h2>
        <p className="text-neutral-medium">
          Manage profiles, application preferences, and data
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-users mr-2"></i>
                Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="py-4 text-center">Loading profiles...</div>
                ) : (
                  <>
                    {profiles.map((profile: any) => (
                      <div 
                        key={profile.id} 
                        className={`p-4 rounded-lg border flex items-center justify-between ${
                          selectedProfile?.id === profile.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-neutral-light'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                            <span className="text-primary font-medium">{profile.avatarInitials}</span>
                          </div>
                          <span className="font-medium">{profile.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedProfile(profile)}
                            disabled={selectedProfile?.id === profile.id}
                          >
                            Select
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteProfile(profile.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setShowAddProfileDialog(true)}
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add New Profile
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-sliders-h mr-2"></i>
                Application Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="gameMode">Game Difficulty</Label>
                  <select 
                    id="gameMode" 
                    className="w-full mt-1 rounded-md border border-neutral-light p-2"
                  >
                    <option value="easy">Easy - More hints, fewer options</option>
                    <option value="medium" selected>Medium - Standard difficulty</option>
                    <option value="hard">Hard - Fewer hints, more options</option>
                  </select>
                </div>
                
                <div>
                  <Label>EEG Settings</Label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="eegEnabled" 
                        defaultChecked 
                        className="mr-2"
                      />
                      <Label htmlFor="eegEnabled">Enable EEG monitoring</Label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="adaptiveDifficulty" 
                        defaultChecked 
                        className="mr-2"
                      />
                      <Label htmlFor="adaptiveDifficulty">
                        Adapt game difficulty based on EEG readings
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="aiMode">AI Conversation Style</Label>
                  <select 
                    id="aiMode" 
                    className="w-full mt-1 rounded-md border border-neutral-light p-2"
                  >
                    <option value="simple">Simple - Basic, clear language</option>
                    <option value="supportive" selected>Supportive - Gentle, encouraging tone</option>
                    <option value="detailed">Detailed - More context and information</option>
                  </select>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full">
                    Save Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Profile Dialog */}
      <Dialog open={showAddProfileDialog} onOpenChange={setShowAddProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter patient's full name"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddProfileDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createProfileMutation.isPending}
              >
                {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
