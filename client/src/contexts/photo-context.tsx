import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfileContext } from "./profile-context";
import { getQueryFn } from "@/lib/queryClient";

type PhotoContextType = {
  photos: any[];
  isLoading: boolean;
};

const PhotoContext = createContext<PhotoContextType>({
  photos: [],
  isLoading: false,
});

export const PhotoProvider = ({ children }: { children: ReactNode }) => {
  const { selectedProfile } = useProfileContext();
  
  // Fetch photos for selected profile
  const { 
    data: photos = [], 
    isLoading 
  } = useQuery({
    queryKey: ['/api/photos', selectedProfile?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedProfile,
  });
  
  return (
    <PhotoContext.Provider value={{ photos, isLoading }}>
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhotoContext = () => useContext(PhotoContext);
