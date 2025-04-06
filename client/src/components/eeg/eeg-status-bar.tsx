import { useEffect, useState } from "react";
import { useEegSimulator } from "@/lib/eeg-simulator";

export default function EegStatusBar() {
  const { isConnected, startSimulation, stopSimulation } = useEegSimulator();
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    // Start the EEG simulation when component mounts
    startSimulation();
    setIsActive(true);
    
    // Clean up when component unmounts
    return () => {
      stopSimulation();
      setIsActive(false);
    };
  }, []);
  
  return (
    <div className="bg-white p-3 rounded-lg border border-neutral-light flex items-center w-full sm:w-auto">
      <div className="mr-3">
        <span className="block text-sm text-neutral-medium">EEG Status</span>
        <span className="font-medium flex items-center">
          <span 
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              isConnected 
                ? "bg-status-success" 
                : "bg-status-error"
            }`}
          ></span>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      
      <div 
        className={`rounded-md flex-grow sm:w-32 h-[60px] bg-gradient-to-r from-accent/30 via-primary/40 to-secondary/50 bg-[length:200%_100%] ${
          isActive ? "animate-[eegWave_8s_infinite_linear]" : ""
        }`}
      ></div>
      
      <style jsx>{`
        @keyframes eegWave {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
