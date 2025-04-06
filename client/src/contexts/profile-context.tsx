import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

type ProfileContextType = {
  profiles: any[];
  selectedProfile: any | null;
  setSelectedProfile: (profile: any | null) => void;
  isLoading: boolean;
};

const ProfileContext = createContext<ProfileContextType>({
  profiles: [],
  selectedProfile: null,
  setSelectedProfile: () => {},
  isLoading: true,
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  
  // Fetch all profiles
  const { 
    data: profiles = [], 
    isLoading 
  } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Select first profile by default if none selected
  useEffect(() => {
    if (!isLoading && profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, isLoading, selectedProfile]);
  
  // Store selected profile in localStorage
  useEffect(() => {
    if (selectedProfile) {
      localStorage.setItem('selectedProfileId', selectedProfile.id.toString());
    }
  }, [selectedProfile]);
  
  // Load selected profile from localStorage on mount
  useEffect(() => {
    const storedProfileId = localStorage.getItem('selectedProfileId');
    if (storedProfileId && profiles.length > 0) {
      const profile = profiles.find((p: any) => p.id.toString() === storedProfileId);
      if (profile) {
        setSelectedProfile(profile);
      }
    }
  }, [profiles]);
  
  return (
    <ProfileContext.Provider 
      value={{ 
        profiles, 
        selectedProfile, 
        setSelectedProfile,
        isLoading 
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => useContext(ProfileContext);
