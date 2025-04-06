import { useState, useEffect } from "react";

// Mock EEG data structure
export type EegData = {
  attention: number;    // 0-100
  relaxation: number;   // 0-100
  stress: number;       // 0-100
  recognition: number;  // 0-100
  theta: number;        // 0-100 (brainwave band power)
  alpha: number;        // 0-100 (brainwave band power)
  beta: number;         // 0-100 (brainwave band power)
  blinkRate: number;    // 0-100 (blinks per minute normalized)
};

// Initial EEG data
const initialEegData: EegData = {
  attention: 50,
  relaxation: 60,
  stress: 20,
  recognition: 40,
  theta: 40,
  alpha: 50,
  beta: 30,
  blinkRate: 20,
};

// Global simulation state
let simulationInterval: NodeJS.Timeout | null = null;
let currentEegData: EegData = { ...initialEegData };
let isEegConnected = false;
let listeners: ((data: EegData) => void)[] = [];

// Function to fluctuate a value naturally within bounds
const fluctuate = (value: number, magnitude = 5): number => {
  const change = (Math.random() * magnitude * 2) - magnitude;
  return Math.max(0, Math.min(100, value + change));
};

// Function to start the EEG simulation
const startSimulation = () => {
  if (simulationInterval) return;
  
  isEegConnected = true;
  
  // Update EEG data every 1 second
  simulationInterval = setInterval(() => {
    currentEegData = {
      attention: fluctuate(currentEegData.attention),
      relaxation: fluctuate(currentEegData.relaxation),
      stress: fluctuate(currentEegData.stress),
      recognition: fluctuate(currentEegData.recognition),
      theta: fluctuate(currentEegData.theta),
      alpha: fluctuate(currentEegData.alpha),
      beta: fluctuate(currentEegData.beta),
      blinkRate: fluctuate(currentEegData.blinkRate),
    };
    
    // Notify all listeners
    listeners.forEach(listener => listener(currentEegData));
  }, 1000);
};

// Function to stop the EEG simulation
const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isEegConnected = false;
};

// Adjust EEG parameters based on user input
const adjustEegParameters = (params: Partial<EegData>) => {
  currentEegData = {
    ...currentEegData,
    ...params
  };
};

// Setup simulated stress response
const simulateStressResponse = (stressLevel: number) => {
  adjustEegParameters({
    stress: Math.min(100, currentEegData.stress + stressLevel),
    relaxation: Math.max(0, currentEegData.relaxation - stressLevel/2),
    attention: Math.min(100, currentEegData.attention + stressLevel/3),
  });
};

// Setup simulated relaxation response
const simulateRelaxationResponse = (relaxationLevel: number) => {
  adjustEegParameters({
    relaxation: Math.min(100, currentEegData.relaxation + relaxationLevel),
    stress: Math.max(0, currentEegData.stress - relaxationLevel/2),
    attention: Math.max(0, currentEegData.attention - relaxationLevel/4),
  });
};

// Setup simulated recognition response
const simulateRecognitionResponse = (recognized: boolean) => {
  if (recognized) {
    adjustEegParameters({
      recognition: Math.min(100, currentEegData.recognition + 30),
      attention: Math.min(100, currentEegData.attention + 10),
    });
  } else {
    adjustEegParameters({
      recognition: Math.max(0, currentEegData.recognition - 20),
      stress: Math.min(100, currentEegData.stress + 15),
    });
  }
};

// React hook to use the EEG simulator
export const useEegSimulator = () => {
  const [eegData, setEegData] = useState<EegData>(currentEegData);
  
  useEffect(() => {
    // Add this component as a listener
    const listener = (data: EegData) => setEegData({ ...data });
    listeners.push(listener);
    
    // Remove listener on cleanup
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  return {
    eegData,
    isConnected: isEegConnected,
    startSimulation,
    stopSimulation,
    simulateStressResponse,
    simulateRelaxationResponse,
    simulateRecognitionResponse,
  };
};
