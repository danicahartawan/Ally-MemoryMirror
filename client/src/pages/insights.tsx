import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from "recharts";
import Tabs from "@/components/layout/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProfileContext } from "@/contexts/profile-context";
import { format } from "date-fns";
import { BrainCircuit, BarChart as BarChartIcon, Activity } from 'lucide-react';
import EegCognitiveProfile from "@/components/eeg/eeg-cognitive-profile";
import BanditGame from "@/components/game/bandit-game";

export default function Insights() {
  const { selectedProfile } = useProfileContext();
  
  // Fetch game sessions for charts
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/game-sessions', selectedProfile?.id],
    enabled: !!selectedProfile,
  });
  
  // Fetch EEG readings for charts
  const { data: eegReadings = [], isLoading: eegLoading } = useQuery({
    queryKey: ['/api/eeg-readings', selectedProfile?.id],
    enabled: !!selectedProfile,
  });
  
  // Format sessions data for charts
  const formatSessionData = (sessions: any[]) => {
    return sessions.map(session => ({
      date: format(new Date(session.startedAt), 'MM/dd'),
      accuracy: session.totalQuestions > 0 
        ? Math.round((session.correctAnswers / session.totalQuestions) * 100) 
        : 0,
      attention: session.avgEegAttention,
      relaxation: session.avgEegRelaxation,
    }));
  };
  
  // Format EEG data for charts
  const formatEegData = (readings: any[]) => {
    // Group by day and average values
    const groupedByDay: Record<string, any[]> = {};
    
    readings.forEach(reading => {
      const day = format(new Date(reading.timestamp), 'MM/dd');
      if (!groupedByDay[day]) {
        groupedByDay[day] = [];
      }
      groupedByDay[day].push(reading);
    });
    
    return Object.entries(groupedByDay).map(([day, dayReadings]) => {
      const avgAttention = Math.round(
        dayReadings.reduce((sum, r) => sum + r.attention, 0) / dayReadings.length
      );
      const avgRelaxation = Math.round(
        dayReadings.reduce((sum, r) => sum + r.relaxation, 0) / dayReadings.length
      );
      const avgStress = Math.round(
        dayReadings.reduce((sum, r) => sum + r.stress, 0) / dayReadings.length
      );
      const avgRecognition = Math.round(
        dayReadings.reduce((sum, r) => sum + r.recognition, 0) / dayReadings.length
      );
      
      return {
        date: day,
        attention: avgAttention,
        relaxation: avgRelaxation,
        stress: avgStress,
        recognition: avgRecognition
      };
    });
  };
  
  if (!selectedProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Please select a profile</h2>
        <p className="text-neutral-medium">
          You need to select a profile to view memory insights.
        </p>
      </div>
    );
  }
  
  const sessionData = formatSessionData(sessions);
  const eegData = formatEegData(eegReadings);
  
  return (
    <div>
      <Tabs active="insights" />
      
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold">Memory Insights</h2>
        <p className="text-neutral-medium">
          Track progress and monitor cognitive patterns over time
        </p>
      </div>
      
      <ShadcnTabs defaultValue="charts" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="charts" className="flex items-center">
            <Activity className="mr-2 h-4 w-4" /> Memory Charts
          </TabsTrigger>
          <TabsTrigger value="cognitive-profile" className="flex items-center">
            <BrainCircuit className="mr-2 h-4 w-4" /> Cognitive Profile
          </TabsTrigger>
          <TabsTrigger value="bandit-game" className="flex items-center">
            <BarChartIcon className="mr-2 h-4 w-4" /> 3-Armed Bandit Trainer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Memory Recognition Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p>Loading data...</p>
                  </div>
                ) : sessionData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p>No game sessions recorded yet. Play games to see insights.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sessionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        name="Recognition Accuracy (%)" 
                        stroke="#0078D4" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BrainCircuit className="mr-2 h-5 w-5" />
                  EEG Brain Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eegLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p>Loading data...</p>
                  </div>
                ) : eegData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p>No EEG data recorded yet. Play games to see insights.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={eegData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="attention" 
                        name="Attention" 
                        stroke="#0078D4" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="relaxation" 
                        name="Relaxation" 
                        stroke="#00B294" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stress" 
                        name="Stress" 
                        stroke="#D83B01" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="mr-2 h-5 w-5" />
                Memory Game Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p>Loading data...</p>
                </div>
              ) : sessionData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p>No game sessions recorded yet. Play games to see insights.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" name="Recognition Accuracy (%)" fill="#0078D4" />
                    <Bar dataKey="attention" name="Avg. Attention Level" fill="#5C2D91" />
                    <Bar dataKey="relaxation" name="Avg. Relaxation Level" fill="#00B294" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cognitive-profile">
          <EegCognitiveProfile />
        </TabsContent>
        
        <TabsContent value="bandit-game">
          <BanditGame />
        </TabsContent>
      </ShadcnTabs>
    </div>
  );
}
