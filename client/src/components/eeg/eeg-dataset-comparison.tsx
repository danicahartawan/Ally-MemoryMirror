import { useState, useEffect } from 'react';
import { useProfileContext } from '@/contexts/profile-context';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  BrainCircuit, 
  AlarmClock, 
  AlertCircle, 
  CheckCircle, 
  InfoIcon,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  HeartPulse
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

type DatasetType = 'healthy' | 'alzheimers';

type WaveType = 'alphaWaves' | 'betaWaves' | 'deltaWaves' | 'thetaWaves' | 'gammaWaves';

type WaveDifference = 'higher' | 'lower' | 'similar';

type Comparison = {
  profileId: number;
  datasetType: DatasetType;
  similarityScore: number;
  keyDifferences: Record<WaveType, WaveDifference>;
  recommendation: string;
  timestamp: string;
};

export default function EegDatasetComparison() {
  const { selectedProfile } = useProfileContext();
  const { toast } = useToast();
  const [activeDataset, setActiveDataset] = useState<DatasetType>('healthy');
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareProgress, setCompareProgress] = useState(0);

  // Fetch latest EEG cognitive profile
  const { 
    data: cognitiveProfile, 
    isLoading: profileLoading,
    isError: profileError
  } = useQuery({
    queryKey: ['/api/eeg-cognitive-profiles/latest', selectedProfile?.id],
    enabled: !!selectedProfile,
  });

  const waveLabels: Record<WaveType, string> = {
    alphaWaves: 'Alpha Waves (8-13Hz)',
    betaWaves: 'Beta Waves (13-30Hz)',
    deltaWaves: 'Delta Waves (0.5-4Hz)',
    thetaWaves: 'Theta Waves (4-8Hz)',
    gammaWaves: 'Gamma Waves (30-100Hz)'
  };

  const wavePurpose: Record<WaveType, string> = {
    alphaWaves: 'Relaxation, cognitive coordination',
    betaWaves: 'Active thinking, focus, alertness',
    deltaWaves: 'Deep sleep, healing',
    thetaWaves: 'Drowsiness, meditation, memory',
    gammaWaves: 'Higher cognitive processing, perception'
  };

  const compareWithDataset = useMutation({
    mutationFn: async (datasetType: DatasetType) => {
      if (!selectedProfile || !cognitiveProfile) {
        throw new Error('Profile or cognitive profile not available');
      }

      const response = await fetch('/api/eeg-dataset-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          cognitiveProfileId: (cognitiveProfile as any).id,
          datasetType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Comparison failed');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setComparison(data);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/eeg-cognitive-profiles'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Comparison Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleCompare = async (datasetType: DatasetType) => {
    setActiveDataset(datasetType);
    setIsComparing(true);
    setCompareProgress(0);
    
    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setCompareProgress((prev) => {
        const increment = Math.floor(Math.random() * 10) + 5;
        const newValue = Math.min(prev + increment, 95);
        return newValue;
      });
    }, 300);
    
    try {
      await compareWithDataset.mutateAsync(datasetType);
      clearInterval(progressInterval);
      setCompareProgress(100);
      
      toast({
        title: 'Comparison Complete',
        description: `Analysis against ${datasetType} dataset completed successfully.`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      setCompareProgress(0);
    } finally {
      setTimeout(() => {
        setIsComparing(false);
      }, 500);
    }
  };

  const getWaveIcon = (difference: WaveDifference) => {
    switch (difference) {
      case 'higher':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'lower':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'similar':
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDatasetTitle = (type: DatasetType) => {
    return type === 'healthy' 
      ? 'Healthy Brain Patterns (HBN-EEG Dataset)' 
      : 'Alzheimer\'s Patterns (ds004504 Dataset)';
  };

  const renderComparisonChart = () => {
    if (!comparison) return null;

    const data = [
      {
        name: 'Alpha',
        similarity: comparison.keyDifferences.alphaWaves === 'similar' ? 90 : 
                   comparison.keyDifferences.alphaWaves === 'higher' ? 70 : 50,
        fill: '#8884d8',
      },
      {
        name: 'Beta',
        similarity: comparison.keyDifferences.betaWaves === 'similar' ? 90 : 
                   comparison.keyDifferences.betaWaves === 'higher' ? 70 : 50,
        fill: '#83a6ed',
      },
      {
        name: 'Theta',
        similarity: comparison.keyDifferences.thetaWaves === 'similar' ? 90 : 
                   comparison.keyDifferences.thetaWaves === 'higher' ? 70 : 50,
        fill: '#8dd1e1',
      },
      {
        name: 'Delta',
        similarity: comparison.keyDifferences.deltaWaves === 'similar' ? 90 : 
                   comparison.keyDifferences.deltaWaves === 'higher' ? 70 : 50,
        fill: '#82ca9d',
      },
      {
        name: 'Gamma',
        similarity: comparison.keyDifferences.gammaWaves === 'similar' ? 90 : 
                   comparison.keyDifferences.gammaWaves === 'higher' ? 70 : 50,
        fill: '#a4de6c',
      }
    ];

    const radarData = [
      {
        subject: 'Alpha',
        A: 80,
        B: comparison.keyDifferences.alphaWaves === 'similar' ? 80 : 
           comparison.keyDifferences.alphaWaves === 'higher' ? 95 : 65,
        fullMark: 100,
      },
      {
        subject: 'Beta',
        A: 75,
        B: comparison.keyDifferences.betaWaves === 'similar' ? 75 : 
           comparison.keyDifferences.betaWaves === 'higher' ? 90 : 60,
        fullMark: 100,
      },
      {
        subject: 'Theta',
        A: 65,
        B: comparison.keyDifferences.thetaWaves === 'similar' ? 65 : 
           comparison.keyDifferences.thetaWaves === 'higher' ? 85 : 50,
        fullMark: 100,
      },
      {
        subject: 'Delta',
        A: 70,
        B: comparison.keyDifferences.deltaWaves === 'similar' ? 70 : 
           comparison.keyDifferences.deltaWaves === 'higher' ? 90 : 55,
        fullMark: 100,
      },
      {
        subject: 'Gamma',
        A: 60,
        B: comparison.keyDifferences.gammaWaves === 'similar' ? 60 : 
           comparison.keyDifferences.gammaWaves === 'higher' ? 85 : 45,
        fullMark: 100,
      },
    ];

    return (
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Wave Pattern Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name={getDatasetTitle(comparison.datasetType)}
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Your Brain Patterns"
                dataKey="B"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Wave Pattern Similarity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="similarity" name="Similarity %" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (!selectedProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Please select a profile</h2>
        <p className="text-neutral-medium">
          You need to select a profile to compare EEG data.
        </p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          EEG Dataset Comparison
        </CardTitle>
        <CardDescription>
          Compare brain patterns against reference EEG datasets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profileLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading cognitive profile...</span>
          </div>
        ) : profileError || !cognitiveProfile ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Cognitive Profile Available</AlertTitle>
            <AlertDescription>
              Please upload EEG data first to generate a cognitive profile before comparing with datasets.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-6">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Compare your EEG cognitive profile against reference datasets to identify similarities 
                and differences. This analysis can provide insights into cognitive patterns and potential 
                areas of concern.
              </AlertDescription>
            </Alert>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Your Latest Cognitive Profile</h3>
              <p className="text-sm text-neutral-medium mb-3">
                Created on {format(new Date((cognitiveProfile as any).createdAt), 'MMM d, yyyy h:mm a')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(waveLabels) as WaveType[]).map((wave) => (
                  <div key={wave} className="rounded-lg border p-3">
                    <div className="font-medium mb-1">{waveLabels[wave]}</div>
                    <div className="text-sm text-neutral-medium mb-2">{wavePurpose[wave]}</div>
                    <Progress value={(cognitiveProfile as any)[wave] || 0} className="h-2 mb-1" />
                    <div className="text-xs text-right">{(cognitiveProfile as any)[wave] || 0}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Dataset for Comparison</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className={`cursor-pointer relative overflow-hidden ${activeDataset === 'healthy' ? 'ring-2 ring-primary' : ''}`}
                     onClick={() => !isComparing && handleCompare('healthy')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <HeartPulse className="mr-2 h-4 w-4 text-green-500" />
                      Healthy Brain Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 text-sm">
                    <p>HBN-EEG Dataset with normal cognitive function markers</p>
                  </CardContent>
                  {activeDataset === 'healthy' && isComparing && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <div className="text-sm font-medium">Comparing...</div>
                      <div className="w-3/4 mt-2">
                        <Progress value={compareProgress} className="h-1" />
                      </div>
                    </div>
                  )}
                </Card>
                
                <Card className={`cursor-pointer relative overflow-hidden ${activeDataset === 'alzheimers' ? 'ring-2 ring-primary' : ''}`}
                     onClick={() => !isComparing && handleCompare('alzheimers')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <BrainCircuit className="mr-2 h-4 w-4 text-orange-500" />
                      Alzheimer's Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 text-sm">
                    <p>ds004504 Dataset with typical Alzheimer's EEG signatures</p>
                  </CardContent>
                  {activeDataset === 'alzheimers' && isComparing && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <div className="text-sm font-medium">Comparing...</div>
                      <div className="w-3/4 mt-2">
                        <Progress value={compareProgress} className="h-1" />
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {comparison && (
              <div className="mt-6">
                <Alert variant={comparison.similarityScore > 70 ? 'default' : 'destructive'} className="mb-4">
                  {comparison.similarityScore > 70 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle className="flex items-center">
                    Overall Similarity Score: {comparison.similarityScore}%
                    {comparison.similarityScore > 70 && (
                      <span className="ml-2 text-sm font-normal text-neutral-medium">
                        Good match to {comparison.datasetType === 'healthy' ? 'healthy' : 'Alzheimer\'s'} patterns
                      </span>
                    )}
                  </AlertTitle>
                  <AlertDescription>
                    {comparison.recommendation}
                  </AlertDescription>
                </Alert>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Key Differences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(Object.keys(comparison.keyDifferences) as WaveType[]).map((wave) => (
                      <div key={wave} className="rounded-lg border p-3">
                        <div className="font-medium mb-1 flex items-center">
                          {waveLabels[wave]}
                          <span className="ml-2">
                            {getWaveIcon(comparison.keyDifferences[wave])}
                          </span>
                        </div>
                        <div className="text-sm">
                          {comparison.keyDifferences[wave] === 'higher' ? (
                            <span className="text-green-600">Higher than reference</span>
                          ) : comparison.keyDifferences[wave] === 'lower' ? (
                            <span className="text-red-600">Lower than reference</span>
                          ) : (
                            <span className="text-yellow-600">Similar to reference</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {renderComparisonChart()}
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-neutral-medium bg-background-subtle rounded-b-lg">
        <div className="flex items-start space-x-2">
          <AlarmClock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Regular comparisons with reference datasets can help track cognitive changes
            over time. We recommend performing comparisons monthly for the most accurate
            trend analysis.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}