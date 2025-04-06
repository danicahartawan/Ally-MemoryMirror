import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Tabs from "@/components/layout/tabs";
import EegStatusBar from "@/components/eeg/eeg-status-bar";
import FamiliarFacesGame from "@/components/game/familiar-faces-game";
import MemoryChat from "@/components/game/memory-chat";
import FeedbackModal from "@/components/game/feedback-modal";
import { useProfileContext } from "@/contexts/profile-context";
import { usePhotoContext } from "@/contexts/photo-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Game() {
  const [_, navigate] = useLocation();
  const { selectedProfile } = useProfileContext();
  const { photos } = usePhotoContext();
  const { toast } = useToast();
  
  const [showChat, setShowChat] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameProgress, setGameProgress] = useState({ current: 0, total: 0 });
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  // Create a new game session when component mounts
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfile) return null;
      
      const res = await apiRequest("POST", "/api/game-sessions", {
        profileId: selectedProfile.id
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setSessionId(data.id);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start game session",
        description: error.message
      });
    }
  });
  
  // End the game session when component unmounts
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return null;
      
      const res = await apiRequest("PATCH", `/api/game-sessions/${sessionId}/end`, {});
      return res.json();
    }
  });
  
  useEffect(() => {
    if (selectedProfile && photos.length > 0) {
      createSessionMutation.mutate();
      setGameProgress({
        current: 1,
        total: Math.min(photos.length, 8) // Limit to 8 photos per session
      });
    }
    
    return () => {
      if (sessionId) {
        endSessionMutation.mutate();
      }
    };
  }, [selectedProfile, photos]);
  
  // Redirect if no profile is selected or no photos available
  useEffect(() => {
    if (!selectedProfile) {
      toast({
        title: "No profile selected",
        description: "Please select a profile to play games.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    if (photos.length === 0) {
      toast({
        title: "No photos available",
        description: "Please upload some photos first.",
        variant: "destructive"
      });
      navigate("/photos");
    }
  }, [selectedProfile, photos]);

  // Handle answer selection
  const handleSelectAnswer = (selectedName: string) => {
    if (!photos[currentPhotoIndex]) return;
    
    const isAnswerCorrect = selectedName === photos[currentPhotoIndex].name;
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);
    
    // Record answer
    if (sessionId) {
      apiRequest("PATCH", `/api/game-sessions/${sessionId}/answer`, {
        correct: isAnswerCorrect
      }).catch(console.error);
    }
  };
  
  // Handle next photo
  const handleNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1 && gameProgress.current < gameProgress.total) {
      setCurrentPhotoIndex(prev => prev + 1);
      setGameProgress(prev => ({ ...prev, current: prev.current + 1 }));
      setShowChat(false);
    } else {
      // End of game
      toast({
        title: "Game completed!",
        description: "You've completed all photos for this session.",
      });
      navigate("/insights");
    }
  };
  
  // Handle start chat
  const handleStartChat = () => {
    setShowChat(true);
    setShowFeedback(false);
  };
  
  // Skip current photo
  const handleSkip = () => {
    setIsCorrect(false);
    setShowFeedback(true);
  };
  
  if (!selectedProfile || photos.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      <Tabs active="game" />
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-dark">Familiar Faces Game</h2>
        <EegStatusBar />
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-neutral-light">
        {!showChat ? (
          <FamiliarFacesGame
            photo={photos[currentPhotoIndex]}
            options={photos}
            onSelectAnswer={handleSelectAnswer}
            onSkip={handleSkip}
            progress={gameProgress}
          />
        ) : (
          <MemoryChat
            photo={photos[currentPhotoIndex]}
            sessionId={sessionId}
            profileId={selectedProfile.id}
          />
        )}
      </div>
      
      {showFeedback && (
        <FeedbackModal
          isOpen={showFeedback}
          isCorrect={isCorrect}
          photoName={photos[currentPhotoIndex]?.name || ""}
          relationship={photos[currentPhotoIndex]?.relationship || ""}
          onClose={() => setShowFeedback(false)}
          onContinueGame={handleNextPhoto}
          onStartChat={handleStartChat}
        />
      )}
    </div>
  );
}
