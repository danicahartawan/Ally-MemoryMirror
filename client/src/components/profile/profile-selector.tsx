import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProfileContext } from "@/contexts/profile-context";
import { useLocation } from "wouter";

export default function ProfileSelector() {
  const [_, navigate] = useLocation();
  const { selectedProfile, setSelectedProfile, profiles } = useProfileContext();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelectProfile = (profile: any) => {
    setSelectedProfile(profile);
    setIsOpen(false);
  };
  
  if (!selectedProfile) {
    return (
      <Button onClick={() => navigate("/settings")}>
        <i className="fas fa-user-plus mr-2"></i>
        <span>Create Profile</span>
      </Button>
    );
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-medium">{selectedProfile.avatarInitials}</span>
          </div>
          <span className="hidden sm:inline font-medium">{selectedProfile.name}</span>
          <i className="fas fa-chevron-down text-neutral-medium"></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            className={profile.id === selectedProfile.id ? "bg-primary/5" : ""}
            onClick={() => handleSelectProfile(profile)}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                <span className="text-primary font-medium text-sm">{profile.avatarInitials}</span>
              </div>
              <span>{profile.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <i className="fas fa-cog mr-2"></i>
          <span>Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
