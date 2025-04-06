import { useState, useEffect } from "react";
import { useEegSimulator } from "@/lib/eeg-simulator";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfileContext } from "@/contexts/profile-context";

type FamiliarFacesGameProps = {
  photo: any;
  options: any[];
  onSelectAnswer: (name: string) => void;
  onSkip: () => void;
  progress: {
    current: number;
    total: number;
  };
};

export default function FamiliarFacesGame({
  photo,
  options,
  onSelectAnswer,
  onSkip,
  progress,
}: FamiliarFacesGameProps) {
  const { selectedProfile } = useProfileContext();
  const { eegData } = useEegSimulator();
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  
  // Generate name options including the correct answer and some distractors
  useEffect(() => {
    if (!photo || !options.length) return;
    
    // Always include correct answer
    const correctName = photo.name;
    
    // Get random distractors (different from correct answer)
    const distractors = options
      .filter((opt) => opt.name !== correctName)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((opt) => opt.name);
    
    // Combine and shuffle
    const namesList = [correctName, ...distractors].sort(() => 0.5 - Math.random());
    
    setNameOptions(namesList);
  }, [photo, options]);
  
  // Handle EEG data changes
  useEffect(() => {
    if (!eegData) return;
    
    // Show hint if stress is high or recognition is low
    if (eegData.stress > 70 || eegData.recognition < 30) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
    
    // Record EEG data in backend
    if (selectedProfile) {
      apiRequest("POST", "/api/eeg-readings", {
        profileId: selectedProfile.id,
        sessionId: 1, // This should be the actual session ID
        ...eegData
      }).catch(console.error);
    }
  }, [eegData, selectedProfile]);

  if (!photo) return null;
  
  const getHint = () => {
    if (photo.relationship) {
      return `This person is your ${photo.relationship}.`;
    } else if (photo.place) {
      return `You often see this person at ${photo.place}.`;
    } else if (photo.memoryNotes) {
      return photo.memoryNotes;
    }
    return "Try to remember who this person is.";
  };
  
  const progressPercentage = (progress.current / progress.total) * 100;
  
  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Photo Display Area */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="bg-neutral-lightest rounded-lg p-2 mb-4">
            <img 
              src={`data:image/jpeg;base64,${photo.imageBase64}`}
              alt="Person to recognize"
              className="w-full h-64 sm:h-80 object-cover rounded-md"
            />
          </div>
          
          {/* Hint Area */}
          <div 
            className={`bg-accent/10 rounded-lg p-4 border-l-4 border-accent mb-4 transition-all ${
              showHint ? "border-l-8" : ""
            }`}
          >
            <h4 className="font-medium text-lg text-accent mb-1">Hint</h4>
            <p>{getHint()}</p>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-medium">Progress</span>
              <span className="font-medium">{progress.current}/{progress.total} Photos</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
        
        {/* Game Interaction Area */}
        <div className="lg:w-1/2">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-6 text-center lg:text-left">
            Who is this person?
          </h3>
          
          {/* Name Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {nameOptions.map((name, index) => (
              <Button
                key={index}
                variant="outline"
                className="py-4 px-6 bg-neutral-lightest hover:bg-primary/10 text-lg text-neutral-dark rounded-lg border border-neutral-light transition-colors h-auto"
                onClick={() => onSelectAnswer(name)}
              >
                {name}
              </Button>
            ))}
          </div>
          
          {/* Voice Input Option */}
          <div className="flex flex-col items-center justify-center bg-secondary/5 rounded-lg p-6 mb-6">
            <p className="text-lg mb-4">Or say the name out loud</p>
            <Button 
              variant="secondary"
              className="w-16 h-16 rounded-full flex items-center justify-center text-white"
            >
              <i className="fas fa-microphone text-2xl"></i>
            </Button>
          </div>
          
          {/* Game Controls */}
          <div className="flex justify-between">
            <Button 
              variant="outline"
              className="py-3 px-6 text-lg"
              onClick={onSkip}
            >
              <i className="fas fa-step-forward mr-2"></i>Skip
            </Button>
            <Button 
              className="py-3 px-6 text-lg"
              onClick={() => setShowHint(true)}
            >
              <i className="fas fa-lightbulb mr-2"></i>I Need Help
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
