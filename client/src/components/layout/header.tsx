import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfileContext } from "@/contexts/profile-context";
// Import from direct path instead of alias
import allyLogo from "../../assets/ally-logo.png";

export default function Header() {
  const [_, navigate] = useLocation();
  const { selectedProfile, profiles } = useProfileContext();
  
  return (
    <header className="bg-white shadow-md px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 rounded-md bg-black flex items-center justify-center mr-3">
            <img src={allyLogo} alt="Ally Logo" className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary font-['Inter']">Ally</h1>
        </div>
        
        {selectedProfile ? (
          <DropdownMenu>
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
                  onClick={() => navigate("/settings")}
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
        ) : (
          <Button onClick={() => navigate("/settings")}>
            <i className="fas fa-user-plus mr-2"></i>
            <span>Create Profile</span>
          </Button>
        )}
      </div>
    </header>
  );
}
