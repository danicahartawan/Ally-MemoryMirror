import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEegSimulator } from "@/lib/eeg-simulator";
import { useToast } from "@/hooks/use-toast";

type MemoryChatProps = {
  photo: any;
  sessionId: number | null;
  profileId: number;
};

export default function MemoryChat({ photo, sessionId, profileId }: MemoryChatProps) {
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { eegData } = useEegSimulator();
  const { toast } = useToast();

  // Fetch chat messages for this session
  const { 
    data: messages = [],
    isLoading 
  } = useQuery({
    queryKey: ['/api/chat-messages', sessionId, photo?.id],
    enabled: !!sessionId && !!photo?.id,
  });

  // Generate initial message if none exist
  useEffect(() => {
    if (!isLoading && messages.length === 0 && photo) {
      generateInitialMessageMutation.mutate();
    }
  }, [isLoading, messages, photo]);

  // Generate initial message mutation
  const generateInitialMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat-messages/initial", {
        profileId,
        photoId: photo.id,
        sessionId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat-messages', sessionId, photo?.id] 
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: error.message
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat-messages", {
        profileId,
        photoId: photo.id,
        sessionId,
        content,
        sender: "user"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat-messages', sessionId, photo?.id] 
      });
      setInputMessage("");
      // Generate AI response after user message
      setTimeout(() => {
        generateResponseMutation.mutate();
      }, 500);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message
      });
    }
  });

  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat-messages/generate", {
        profileId,
        photoId: photo.id,
        sessionId,
        eegData
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/chat-messages', sessionId, photo?.id] 
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to generate response",
        description: error.message
      });
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessageMutation.mutate(inputMessage.trim());
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Get response suggestions based on the last AI message
  const getResponseSuggestions = () => {
    const aiMessages = messages.filter((msg: any) => msg.sender === 'ai');
    if (aiMessages.length === 0) return [];
    
    const lastAiMessage = aiMessages[aiMessages.length - 1].content;
    
    // Simple rule-based suggestions
    if (lastAiMessage.includes('lake')) {
      return [
        "Yes, I remember the lake",
        "Tell me more about the lake",
        "Did we go there recently?"
      ];
    } else if (lastAiMessage.includes('family')) {
      return [
        "Tell me about my family",
        "Who else was there?",
        "When did we last meet?"
      ];
    } else {
      return [
        `Tell me more about ${photo.name}`,
        "What else do you remember?",
        "Can we look at another photo?"
      ];
    }
  };

  const suggestions = getResponseSuggestions();

  return (
    <div className="p-6 sm:p-8 border-t border-neutral-light">
      <h3 className="text-2xl font-semibold mb-6">Let's chat about {photo?.name}</h3>
      
      <div 
        ref={chatContainerRef}
        className="mb-6 bg-neutral-lightest rounded-lg p-4 max-h-80 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center p-4">
            <p>Starting conversation...</p>
          </div>
        ) : (
          messages.map((message: any) => (
            <div key={message.id} className="mb-4 last:mb-0">
              {message.sender === 'ai' ? (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-3 mt-1">
                    <i className="fas fa-robot text-accent/80 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="bg-white p-3 rounded-lg shadow-sm inline-block">
                      {message.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-end">
                  <div className="flex-1 text-right">
                    <p className="bg-primary/10 p-3 rounded-lg shadow-sm inline-block text-left">
                      {message.content}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ml-3 mt-1">
                    <span className="text-primary/80 text-sm font-medium">
                      {photo?.avatarInitials || 'U'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Chat Input */}
      <div className="flex gap-3">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Type your response or question..."
            className="w-full py-3 px-4 text-lg"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
            aria-label="Voice input"
          >
            <i className="fas fa-microphone text-xl"></i>
          </button>
        </div>
        <Button 
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || sendMessageMutation.isPending}
        >
          <i className="fas fa-paper-plane mr-2"></i>Send
        </Button>
      </div>
      
      {/* Response Options */}
      {suggestions.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {suggestions.map((suggestion, index) => (
            <Button 
              key={index}
              variant="outline"
              className="bg-neutral-lightest hover:bg-primary/5"
              onClick={() => {
                setInputMessage(suggestion);
                setTimeout(() => handleSendMessage(), 100);
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
