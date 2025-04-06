import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

type FeedbackModalProps = {
  isOpen: boolean;
  isCorrect: boolean;
  photoName: string;
  relationship: string | undefined;
  onClose: () => void;
  onContinueGame: () => void;
  onStartChat: () => void;
};

export default function FeedbackModal({
  isOpen,
  isCorrect,
  photoName,
  relationship,
  onClose,
  onContinueGame,
  onStartChat,
}: FeedbackModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isCorrect ? "Great job!" : "Not quite right"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-6 text-center py-4">
          <div 
            className={`w-16 h-16 rounded-full ${
              isCorrect 
                ? "bg-status-success/20 text-status-success" 
                : "bg-status-error/20 text-status-error"
            } mx-auto mb-4 flex items-center justify-center`}
          >
            {isCorrect ? (
              <Check className="h-8 w-8" />
            ) : (
              <X className="h-8 w-8" />
            )}
          </div>
          
          <p className="text-lg mb-2">
            {isCorrect 
              ? `Correct! That's ${photoName}.` 
              : `That's ${photoName}.`
            }
          </p>
          
          {relationship && (
            <p>
              {isCorrect 
                ? `They're your ${relationship}.` 
                : `They're your ${relationship}. Try to remember for next time.`
              }
            </p>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={onContinueGame}
          >
            Continue Game
          </Button>
          <Button onClick={onStartChat}>
            Chat About {photoName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
