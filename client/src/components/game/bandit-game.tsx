import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useProfileContext } from '@/contexts/profile-context';
import { useEegSimulator } from '@/lib/eeg-simulator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { BrainCircuit, Coins, BarChart3, Award, Brain, AlertCircle, BatteryLow, Coffee } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type BanditArm = {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
};

const BANDIT_ARMS: BanditArm[] = [
  { id: 0, name: 'Left', icon: '🔵', color: 'bg-blue-500' },
  { id: 1, name: 'Middle', icon: '🟢', color: 'bg-green-500' },
  { id: 2, name: 'Right', icon: '🟠', color: 'bg-orange-500' },
];

// Learning parameters (starting values, will adapt dynamically)
const BASE_LEARNING_RATE = 0.1;
const BASE_EXPLORATION_RATE = 0.2;

export default function BanditGame() {
  const { selectedProfile } = useProfileContext();
  const { eegData } = useEegSimulator();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gameSessionId, setGameSessionId] = useState<number | null>(null);
  const [qValues, setQValues] = useState<number[]>([0, 0, 0]);
  const [rewards, setRewards] = useState<number[]>([]);
  const [choices, setChoices] = useState<number[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [maxTrials, setMaxTrials] = useState(20);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameTab, setGameTab] = useState<string>('game');
  const [isGameEnded, setIsGameEnded] = useState(false);
  
  // Game adaptation parameters based on EEG
  const [transitionDelay, setTransitionDelay] = useState(300); // ms between state changes
  const [visualFeedbackIntensity, setVisualFeedbackIntensity] = useState(1); // 1-3 scale
  const [rewardVolatility, setRewardVolatility] = useState(1); // 0.5-1.5 scale
  const [explorationBoost, setExplorationBoost] = useState(0); // 0-0.3 boost to exploration
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [simplifiedUI, setSimplifiedUI] = useState(false);
  
  // EEG pattern detection
  const eegState = useMemo(() => {
    // Default state
    let state = "normal";
    
    // Check if the EEG contains all necessary data points
    if (!eegData?.theta || !eegData?.alpha || !eegData?.beta || !eegData?.blinkRate) {
      return state;
    }
    
    // 1. Overloaded / distracted: High theta/alpha ratio
    const thetaAlphaRatio = eegData.theta / Math.max(1, eegData.alpha);
    if (thetaAlphaRatio > 1.3) {
      state = "overloaded";
    }
    
    // 2. Stress / agitation: High beta
    if (eegData.beta > 70) {
      state = "stressed";
    }
    
    // 3. Fatigue: Low alpha and high blink rate
    if (eegData.alpha < 30 && eegData.blinkRate > 60) {
      state = "fatigued";
    }
    
    // 4. Calm engagement: Balanced alpha/beta
    const alphaBetaRatio = eegData.alpha / Math.max(1, eegData.beta);
    if (alphaBetaRatio > 0.8 && alphaBetaRatio < 1.2) {
      state = "engaged";
    }
    
    return state;
  }, [eegData]);
  
  // Adapt the game based on EEG state
  useEffect(() => {
    if (!gameSessionId) return; // Only adapt when game is active
    
    switch (eegState) {
      case "overloaded":
        // Increase reward salience, simplify UI
        setVisualFeedbackIntensity(3);
        setSimplifiedUI(true);
        break;
      
      case "stressed":
        // Slow down transitions, soft prompts
        setTransitionDelay(1000); // Slower transitions
        // Soft prompts will be handled in the UI with conditional rendering
        break;
        
      case "fatigued":
        // Suggest a break, reduce reward volatility
        setShowBreakPrompt(true);
        setRewardVolatility(0.5);
        break;
        
      case "engaged":
        // Increase difficulty with exploration incentives
        setExplorationBoost(0.2);
        break;
        
      default: // "normal"
        // Reset to defaults
        setTransitionDelay(300);
        setVisualFeedbackIntensity(1);
        setRewardVolatility(1);
        setExplorationBoost(0);
        setShowBreakPrompt(false);
        setSimplifiedUI(false);
    }
  }, [eegState, gameSessionId]);

  // Get reward probabilities - in a real implementation, these would be dynamic based on
  // the patient's cognitive state and would be generated from the backend
  const rewardProbabilities = [0.3, 0.5, 0.7];

  type BanditGameSessionResponse = {
    id: number;
    totalTrials?: number;
    optimalChoices?: number;
    learningRate?: number;
    explorationRate?: number;
    avgResponseTime?: number;
  };

  // Start a game session
  const startSessionMutation = useMutation<BanditGameSessionResponse>({
    mutationFn: async () => {
      if (!selectedProfile) throw new Error("No profile selected");
      return apiRequest('POST', '/api/bandit-game-sessions', { profileId: selectedProfile.id }, true);
    },
    onSuccess: (data: BanditGameSessionResponse) => {
      setGameSessionId(data.id);
      resetGame();
      toast({
        title: "Game Started",
        description: "3-Armed Bandit Memory Trainer has begun.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start game",
        description: error.message,
      });
    },
  });

  // Record a trial
  const recordTrialMutation = useMutation({
    mutationFn: async (data: { choice: number, reward: number, responseTime: number }) => {
      if (!gameSessionId) throw new Error("No active game session");
      return apiRequest('POST', '/api/bandit-game-trials', {
        sessionId: gameSessionId,
        trialNumber: currentTrial,
        choice: data.choice,
        reward: data.reward,
        responseTime: data.responseTime,
      }, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bandit-game-trials'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to record trial",
        description: error.message,
      });
    },
  });

  // End a game session
  const endSessionMutation = useMutation<BanditGameSessionResponse>({
    mutationFn: async () => {
      if (!gameSessionId) throw new Error("No active game session");
      return apiRequest('PATCH', `/api/bandit-game-sessions/${gameSessionId}/end`, undefined, true);
    },
    onSuccess: (data: BanditGameSessionResponse) => {
      setIsGameEnded(true);
      toast({
        title: "Game Complete",
        description: `You completed ${data.totalTrials || 0} trials with ${data.optimalChoices || 0} optimal choices.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bandit-game-sessions'] });
      
      // Create a cognitive profile based on the session
      createCognitiveProfileMutation.mutate();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to end game",
        description: error.message,
      });
    },
  });

  // Get session stats
  const { data: sessionStats = {} as BanditGameSessionResponse } = useQuery<BanditGameSessionResponse>({
    queryKey: ['/api/bandit-game-sessions', gameSessionId, 'stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!gameSessionId && isGameEnded,
  });

  // Create a cognitive profile
  const createCognitiveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfile || !gameSessionId) throw new Error("Missing required data");
      
      // Generate scores based on gameplay and EEG data
      // In a real implementation, this would use more sophisticated algorithms
      const attentionScore = Math.min(100, Math.max(0, eegData.attention));
      const memoryScore = Math.min(100, Math.max(0, calculateMemoryScore()));
      const cognitiveControl = Math.min(100, Math.max(0, 
        (eegData.relaxation + 100 - eegData.stress) / 2));
      
      return apiRequest('POST', '/api/eeg-cognitive-profiles', {
        profileId: selectedProfile.id,
        alzheimersLikelihood: calculateAlzheimersLikelihood(),
        attentionScore: attentionScore,
        memoryScore: memoryScore,
        cognitiveControl: cognitiveControl,
        fatigueLevel: 100 - eegData.relaxation,
        dataPoints: currentTrial
      }, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/eeg-cognitive-profiles'] });
      setGameTab('results');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create cognitive profile",
        description: error.message,
      });
    },
  });

  // Calculate memory score based on game performance
  const calculateMemoryScore = () => {
    if (choices.length < 5) return 50; // Default value for short games
    
    // Calculate how well the player remembered the high-reward arm
    const optimalChoice = rewardProbabilities.indexOf(Math.max(...rewardProbabilities));
    const recentChoices = choices.slice(-10);
    const optimalCount = recentChoices.filter(c => c === optimalChoice).length;
    
    return (optimalCount / recentChoices.length) * 100;
  };

  // Calculate Alzheimer's likelihood based on game performance and EEG
  const calculateAlzheimersLikelihood = () => {
    if (choices.length < 10) return 50; // Default value for short games
    
    // Simplified algorithm - in a real implementation, this would be based on
    // machine learning models trained on actual Alzheimer's vs control EEG data
    
    // Factors that influence Alzheimer's likelihood:
    // 1. Exploration rate (decreased exploration can indicate cognitive decline)
    // 2. Learning rate (slower learning can indicate memory impairment)
    // 3. EEG patterns (particularly recognition score)
    // 4. Choice consistency (erratic choices can indicate decision-making issues)
    
    // Calculate exploration (variety of choices)
    const choiceCounts = [0, 0, 0];
    choices.forEach(c => choiceCounts[c]++);
    const maxCount = Math.max(...choiceCounts);
    const explorationFactor = 1 - (maxCount / choices.length);
    
    // Calculate learning (improvement over time)
    const firstHalf = choices.slice(0, Math.floor(choices.length / 2));
    const secondHalf = choices.slice(Math.floor(choices.length / 2));
    const optimalChoice = rewardProbabilities.indexOf(Math.max(...rewardProbabilities));
    
    const firstHalfOptimal = firstHalf.filter(c => c === optimalChoice).length / firstHalf.length;
    const secondHalfOptimal = secondHalf.filter(c => c === optimalChoice).length / secondHalf.length;
    const learningFactor = secondHalfOptimal - firstHalfOptimal;
    
    // Combine factors (lower is better cognitive health)
    const combinedScore = (
      (1 - explorationFactor) * 30 +
      (1 - Math.max(0, learningFactor)) * 40 +
      (1 - (eegData.recognition / 100)) * 30
    );
    
    return Math.min(100, Math.max(0, combinedScore));
  };

  // Reset the game state
  const resetGame = () => {
    setQValues([0, 0, 0]);
    setRewards([]);
    setChoices([]);
    setCurrentTrial(1);
    setIsGameEnded(false);
    setGameTab('game');
  };

  // Start a new game
  const startGame = () => {
    if (!selectedProfile) {
      toast({
        title: "Error",
        description: "Please select a profile first.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Starting game with profile:", selectedProfile);
    try {
      startSessionMutation.mutate();
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "Error",
        description: "Failed to start game: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  };

  // Handle arm selection
  const selectArm = (armIndex: number) => {
    if (!startTime) {
      setStartTime(Date.now());
      return;
    }
    
    const endTime = Date.now();
    const rt = endTime - startTime;
    setResponseTime(rt);
    setStartTime(null);
    
    // Get reward based on probability
    const rewardProb = rewardProbabilities[armIndex];
    const reward = Math.random() < rewardProb ? 1 : 0;
    
    // Update Q-values using Q-learning algorithm
    const newQValues = [...qValues];
    newQValues[armIndex] = newQValues[armIndex] + LEARNING_RATE * (reward - newQValues[armIndex]);
    setQValues(newQValues);
    
    // Record choices and rewards
    setRewards([...rewards, reward]);
    setChoices([...choices, armIndex]);
    
    // Record trial in database
    recordTrialMutation.mutate({
      choice: armIndex,
      reward,
      responseTime: rt
    });
    
    // Update trial counter
    const nextTrial = currentTrial + 1;
    setCurrentTrial(nextTrial);
    
    // Show reward feedback
    toast({
      title: reward ? "Reward Received! 🎉" : "No Reward 😢",
      description: reward 
        ? `Great choice! You earned a reward from the ${BANDIT_ARMS[armIndex].name} arm.` 
        : `No reward this time from the ${BANDIT_ARMS[armIndex].name} arm. Try again!`
    });
    
    // End game if we've reached max trials
    if (nextTrial > maxTrials) {
      endSessionMutation.mutate();
    }
  };

  // Display different arms with different probabilities of reward
  const renderArms = () => {
    return BANDIT_ARMS.map(arm => {
      // Apply EEG-based adaptations to game mechanics
      const effectiveExplorationRate = Math.max(0, Math.min(1, EXPLORATION_RATE - explorationBoost));
      const shouldExploit = Math.random() > effectiveExplorationRate;
      
      // Apply reward volatility adaptation
      const adjustedProbabilities = rewardProbabilities.map(p => 
        Math.max(0.1, Math.min(0.9, p * rewardVolatility))
      );
      
      const bestArm = qValues.indexOf(Math.max(...qValues));
      const highlighted = shouldExploit && arm.id === bestArm;
      
      // Apply visual feedback intensity
      let highlightClasses = '';
      let animationClass = '';
      
      if (highlighted) {
        // Base highlighting
        highlightClasses = 'ring-4 ring-yellow-400';
        
        // Intensify based on EEG state
        if (visualFeedbackIntensity >= 2) {
          highlightClasses += ' ring-offset-2';
          animationClass = 'animate-pulse';
        }
        if (visualFeedbackIntensity >= 3) {
          highlightClasses += ' shadow-lg shadow-yellow-200';
          animationClass = 'animate-bounce';
        }
      }
      
      // Apply UI simplification if needed
      const buttonSize = simplifiedUI ? 'h-44 w-32' : 'h-40 w-28';
      const fontSize = simplifiedUI ? 'text-3xl' : 'text-2xl';
      const iconSize = simplifiedUI ? 'text-5xl' : 'text-4xl';
      
      // Apply transition delay based on EEG state
      const transitionStyle = {
        transition: `all ${transitionDelay}ms ease-in-out`
      };

      return (
        <Button
          key={arm.id}
          onClick={() => selectArm(arm.id)}
          disabled={currentTrial > maxTrials || !gameSessionId}
          className={`${buttonSize} ${fontSize} text-center flex flex-col items-center justify-center 
            ${highlightClasses} ${animationClass}`}
          style={transitionStyle}
          variant="outline"
        >
          <div className={`${iconSize} mb-2`}>{arm.icon}</div>
          <div>{arm.name}</div>
          {highlighted && (
            <Badge 
              className={`mt-2 ${
                visualFeedbackIntensity >= 3 ? 'bg-yellow-500 text-lg px-3 py-1' : 
                visualFeedbackIntensity >= 2 ? 'bg-yellow-500 text-base' : 
                'bg-yellow-500'
              }`}
            >
              {simplifiedUI ? 'PICK ME!' : 'Recommended'}
            </Badge>
          )}
        </Button>
      );
    });
  };

  // Render game results and stats
  const renderResults = () => {
    if (!sessionStats) return <div>Loading results...</div>;
    
    // Default values for stats
    const optimalChoices = sessionStats.optimalChoices || 0;
    const totalTrials = sessionStats.totalTrials || 0;
    const learningRate = sessionStats.learningRate || 0;
    const explorationRate = sessionStats.explorationRate || 0;
    const avgResponseTime = sessionStats.avgResponseTime || 0;
    
    // Calculate percentage for optimal choices
    const optimalPercentage = totalTrials > 0 ? (optimalChoices / totalTrials) * 100 : 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="mr-2" /> Reward History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {rewards.map((reward, index) => (
                <div 
                  key={index} 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                    ${reward ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {reward}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span>Optimal Choices</span>
                <span>{optimalChoices} / {totalTrials}</span>
              </div>
              <Progress value={optimalPercentage} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BrainCircuit className="mr-2" /> Cognitive Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Learning Rate</span>
                  <span>{learningRate}%</span>
                </div>
                <Progress value={learningRate} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Exploration Rate</span>
                  <span>{explorationRate}%</span>
                </div>
                <Progress value={explorationRate} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Response Time</span>
                  <span>{avgResponseTime}ms</span>
                </div>
                <Progress 
                  value={Math.min(100, (3000 - avgResponseTime) / 30)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <BarChart3 className="mr-2" /> 3-Armed Bandit Memory Trainer
      </h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">How to Play</h2>
        <p>Choose one of the three arms to pull. Each arm has a different probability of giving you a reward. 
           Your goal is to maximize your total reward by learning which arm is best. 
           The game tracks your decision-making patterns to help assess memory function.</p>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <Badge variant="outline" className="mr-2">
            Trial: {currentTrial}/{maxTrials}
          </Badge>
          {responseTime && (
            <Badge variant="outline">
              Response Time: {responseTime}ms
            </Badge>
          )}
        </div>
        {!gameSessionId ? (
          <Button onClick={startGame}>
            Start Game
          </Button>
        ) : (
          <Button 
            onClick={() => endSessionMutation.mutate()} 
            variant="outline"
            disabled={isGameEnded}
          >
            End Game
          </Button>
        )}
      </div>

      <Tabs value={gameTab} onValueChange={setGameTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="game">Game</TabsTrigger>
          <TabsTrigger value="results" disabled={!isGameEnded}>Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="game">
          {/* EEG State Alerts */}
          {showBreakPrompt && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Coffee className="h-4 w-4" />
              <AlertTitle>Fatigue Detected</AlertTitle>
              <AlertDescription>
                Taking short breaks can improve memory recall. Consider a brief rest before continuing.
              </AlertDescription>
            </Alert>
          )}
          
          {eegState === "stressed" && (
            <Alert className="mb-4 bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Stress Level Elevated</AlertTitle>
              <AlertDescription>
                Take a deep breath. The game will slow down to make choices easier.
              </AlertDescription>
            </Alert>
          )}
          
          {eegState === "overloaded" && (
            <Alert className="mb-4 bg-indigo-50 border-indigo-200">
              <Brain className="h-4 w-4" />
              <AlertTitle>Cognitive Load High</AlertTitle>
              <AlertDescription>
                Interface simplified to help you focus on essential information.
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardContent className="pt-6">
              {/* EEG State Indicator */}
              {gameSessionId && eegData && (
                <div className="mb-4 flex items-center justify-center">
                  <div className="bg-gray-100 rounded-full px-4 py-1 flex items-center space-x-2">
                    <span className="font-medium">Brain State:</span>
                    {eegState === "normal" && <Badge className="bg-green-500">Normal</Badge>}
                    {eegState === "engaged" && <Badge className="bg-blue-500">Engaged</Badge>}
                    {eegState === "overloaded" && <Badge className="bg-indigo-500">Overloaded</Badge>}
                    {eegState === "stressed" && <Badge className="bg-orange-500">Stressed</Badge>}
                    {eegState === "fatigued" && <Badge className="bg-yellow-500">Fatigued</Badge>}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center space-x-6 mb-6">
                {renderArms()}
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Total Rewards:</span> {rewards.reduce((a, b) => a + b, 0)}
                </div>
                {eegData && (
                  <div className="text-sm text-gray-500">
                    <div>Attention: {eegData.attention}%</div>
                    <div>Recognition: {eegData.recognition}%</div>
                    {!simplifiedUI && (
                      <>
                        <div>Alpha/Beta: {(eegData.alpha / Math.max(1, eegData.beta)).toFixed(2)}</div>
                        <div>Theta/Alpha: {(eegData.theta / Math.max(1, eegData.alpha)).toFixed(2)}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          {renderResults()}
        </TabsContent>
      </Tabs>
    </div>
  );
}