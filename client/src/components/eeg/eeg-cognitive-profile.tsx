import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useProfileContext } from '@/contexts/profile-context';
import { useQuery } from '@tanstack/react-query';
import { useEegSimulator } from '@/lib/eeg-simulator';
import { BrainCircuit, AlertTriangle, Info, FileBarChart, Activity } from 'lucide-react';

export default function EegCognitiveProfile() {
  const { selectedProfile } = useProfileContext();
  const { eegData } = useEegSimulator();
  
  // Fetch latest cognitive profile
  const { data: cognitiveProfile, isLoading, error } = useQuery({
    queryKey: ['/api/eeg-cognitive-profiles/latest', selectedProfile?.id],
    queryFn: async () => {
      if (!selectedProfile) return null;
      const response = await fetch(`/api/eeg-cognitive-profiles/latest?profileId=${selectedProfile.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No profile found is not an error
        }
        throw new Error('Failed to fetch cognitive profile');
      }
      return response.json();
    },
    enabled: !!selectedProfile,
  });

  if (!selectedProfile) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No profile selected</AlertTitle>
        <AlertDescription>
          Please select a profile to view EEG cognitive analysis.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div>Loading cognitive profile...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load cognitive profile. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!cognitiveProfile) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Cognitive Profile Available</AlertTitle>
        <AlertDescription>
          Try playing the 3-Armed Bandit Memory Trainer game to generate a cognitive profile.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper function to determine risk level color
  const getRiskColor = (value: number) => {
    if (value < 30) return 'bg-green-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to determine score color
  const getScoreColor = (value: number) => {
    if (value > 70) return 'bg-green-500';
    if (value > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to get text description based on score
  const getAlzheimersRiskDescription = (score: number) => {
    if (score < 30) return 'Low risk - cognitive patterns similar to healthy individuals';
    if (score < 70) return 'Moderate risk - some patterns similar to early Alzheimer\'s';
    return 'High risk - cognitive patterns similar to Alzheimer\'s patients';
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <BrainCircuit className="mr-2" /> EEG-Based Cognitive Profile
      </h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          <Info className="mr-2 h-5 w-5" /> About This Analysis
        </h2>
        <p>
          This profile analyzes EEG patterns to compare brain activity with both healthy individuals and 
          those with Alzheimer's disease. The analysis is based on machine learning models trained on 
          EEG data from the Healthy Brain Network (HBN) and Alzheimer's datasets.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Alzheimer's Likelihood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>Risk Level</span>
                <span>{cognitiveProfile.alzheimersLikelihood}%</span>
              </div>
              <Progress 
                value={cognitiveProfile.alzheimersLikelihood} 
                className={getRiskColor(cognitiveProfile.alzheimersLikelihood)} 
              />
            </div>
            <p className="text-sm text-gray-600">
              {getAlzheimersRiskDescription(cognitiveProfile.alzheimersLikelihood)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Based on analysis of {cognitiveProfile.dataPoints} data points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileBarChart className="mr-2 h-5 w-5" /> Cognitive Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Attention</span>
                  <span>{cognitiveProfile.attentionScore}%</span>
                </div>
                <Progress 
                  value={cognitiveProfile.attentionScore} 
                  className={getScoreColor(cognitiveProfile.attentionScore)} 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Memory</span>
                  <span>{cognitiveProfile.memoryScore}%</span>
                </div>
                <Progress 
                  value={cognitiveProfile.memoryScore} 
                  className={getScoreColor(cognitiveProfile.memoryScore)} 
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Cognitive Control</span>
                  <span>{cognitiveProfile.cognitiveControl}%</span>
                </div>
                <Progress 
                  value={cognitiveProfile.cognitiveControl} 
                  className={getScoreColor(cognitiveProfile.cognitiveControl)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" /> Current Brain Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Attention</span>
                <span>{eegData.attention}%</span>
              </div>
              <Progress value={eegData.attention} className="bg-blue-100" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Relaxation</span>
                <span>{eegData.relaxation}%</span>
              </div>
              <Progress value={eegData.relaxation} className="bg-green-100" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Stress</span>
                <span>{eegData.stress}%</span>
              </div>
              <Progress value={eegData.stress} className="bg-red-100" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Recognition</span>
                <span>{eegData.recognition}%</span>
              </div>
              <Progress value={eegData.recognition} className="bg-purple-100" />
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Feature Importance in ML Model</h3>
            {cognitiveProfile.featureImportance && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(cognitiveProfile.featureImportance).map(([feature, value]) => (
                  <div key={feature}>
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">{feature}</span>
                      <span>{(Number(value) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={Number(value) * 100} className="bg-gray-100" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}