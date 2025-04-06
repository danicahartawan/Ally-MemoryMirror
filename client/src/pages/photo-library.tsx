import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Tabs from "@/components/layout/tabs";
import PhotoUpload from "@/components/photo/photo-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProfileContext } from "@/contexts/profile-context";
import { useToast } from "@/hooks/use-toast";

export default function PhotoLibrary() {
  const { selectedProfile } = useProfileContext();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  
  // Fetch photos for the selected profile
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['/api/photos', selectedProfile?.id],
    enabled: !!selectedProfile,
  });
  
  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const res = await apiRequest("DELETE", `/api/photos/${photoId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', selectedProfile?.id] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from your library."
      });
      setSelectedPhoto(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete photo",
        description: error.message
      });
    }
  });
  
  const handleDeletePhoto = () => {
    if (selectedPhoto) {
      deletePhotoMutation.mutate(selectedPhoto.id);
    }
  };
  
  if (!selectedProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Please select a profile</h2>
        <p className="text-neutral-medium">
          You need to select a profile to view and manage photos.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <Tabs active="photos" />
      
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-semibold">Photo Library</h2>
        <Button onClick={() => setShowUploadDialog(true)}>
          <i className="fas fa-plus mr-2"></i>
          Add Photos
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse">
              <CardContent className="h-full flex items-center justify-center p-0">
                <div className="w-full h-full bg-neutral-light"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="flex flex-col items-center pt-6">
            <i className="fas fa-images text-4xl text-neutral-light mb-4"></i>
            <h3 className="text-xl font-medium mb-2">No photos yet</h3>
            <p className="text-neutral-medium mb-6">
              Add photos of family and friends to use in memory games
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              Upload First Photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {photos.map((photo: any) => (
            <Card 
              key={photo.id} 
              className="h-64 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPhoto(photo)}
            >
              <CardContent className="h-full p-0 relative">
                <img 
                  src={`data:image/jpeg;base64,${photo.imageBase64}`} 
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
                  <h3 className="font-medium">{photo.name}</h3>
                  {photo.relationship && (
                    <p className="text-sm opacity-90">{photo.relationship}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <PhotoUpload 
            profileId={selectedProfile.id} 
            onSuccess={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPhoto.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={`data:image/jpeg;base64,${selectedPhoto.imageBase64}`} 
                    alt={selectedPhoto.name}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-medium">Relationship</h4>
                    <p>{selectedPhoto.relationship || "Not specified"}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-medium">Place</h4>
                    <p>{selectedPhoto.place || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-medium">Memory Notes</h4>
                    <p className="whitespace-pre-line">{selectedPhoto.memoryNotes || "No memory notes provided"}</p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="destructive" onClick={handleDeletePhoto}>
                  <i className="fas fa-trash mr-2"></i>
                  Delete Photo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
