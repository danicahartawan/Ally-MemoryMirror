import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPhotoSchema, 
  insertProfileSchema, 
  insertGameSessionSchema, 
  insertChatMessageSchema, 
  insertEegReadingSchema,
  insertBanditGameSessionSchema,
  insertBanditGameTrialSchema,
  insertEegCognitiveProfileSchema
} from "@shared/schema";
import { generateStory, generateHints, generateChatResponse, generateChatSuggestions } from "./openai";
import multer from "multer";
import { z } from "zod";

// Set up multer for temporary file storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Profiles endpoints
  app.get("/api/profiles", async (_req: Request, res: Response) => {
    const profiles = await storage.getAllProfiles();
    res.json(profiles);
  });

  app.get("/api/profiles/:id", async (req: Request, res: Response) => {
    const profile = await storage.getProfile(parseInt(req.params.id));
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.post("/api/profiles", async (req: Request, res: Response) => {
    try {
      const data = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(data);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.delete("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteProfile(parseInt(req.params.id));
      res.status(200).json({ message: "Profile deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete profile" });
    }
  });

  // Photos endpoints
  app.get("/api/photos", async (req: Request, res: Response) => {
    const profileId = req.query.profileId ? parseInt(req.query.profileId as string) : undefined;
    const photos = profileId 
      ? await storage.getPhotosByProfileId(profileId)
      : await storage.getAllPhotos();
    res.json(photos);
  });

  app.get("/api/photos/:id", async (req: Request, res: Response) => {
    const photo = await storage.getPhoto(parseInt(req.params.id));
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    res.json(photo);
  });

  app.post("/api/photos", async (req: Request, res: Response) => {
    try {
      const data = insertPhotoSchema.parse(req.body);
      const photo = await storage.createPhoto(data);
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create photo" });
    }
  });

  app.delete("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      await storage.deletePhoto(parseInt(req.params.id));
      res.status(200).json({ message: "Photo deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Game sessions endpoints
  app.get("/api/game-sessions", async (req: Request, res: Response) => {
    const profileId = req.query.profileId ? parseInt(req.query.profileId as string) : undefined;
    const sessions = profileId 
      ? await storage.getGameSessionsByProfileId(profileId)
      : await storage.getAllGameSessions();
    res.json(sessions);
  });

  app.post("/api/game-sessions", async (req: Request, res: Response) => {
    try {
      const data = insertGameSessionSchema.parse(req.body);
      const session = await storage.createGameSession(data);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create game session" });
    }
  });

  app.patch("/api/game-sessions/:id/end", async (req: Request, res: Response) => {
    try {
      const session = await storage.endGameSession(parseInt(req.params.id));
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to end game session" });
    }
  });

  app.patch("/api/game-sessions/:id/answer", async (req: Request, res: Response) => {
    try {
      const correct = !!req.body.correct;
      const session = await storage.recordGameAnswer(parseInt(req.params.id), correct);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to record answer" });
    }
  });

  // Chat messages endpoints
  app.get("/api/chat-messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : undefined;
    const photoId = req.query.photoId ? parseInt(req.query.photoId as string) : undefined;
    
    const messages = await storage.getChatMessages(sessionId, photoId);
    res.json(messages);
  });

  app.post("/api/chat-messages", async (req: Request, res: Response) => {
    try {
      const data = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(data);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  app.post("/api/chat-messages/initial", async (req: Request, res: Response) => {
    try {
      const { profileId, photoId, sessionId } = req.body;
      
      // Get the photo details
      const photo = await storage.getPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Generate an initial message about the person
      const initialMessage = await generateStory(
        photo.name, 
        photo.relationship ?? undefined, 
        photo.place ?? undefined, 
        photo.memoryNotes ?? undefined
      );
      
      // Create the message
      const message = await storage.createChatMessage({
        profileId,
        photoId,
        sessionId,
        content: initialMessage,
        sender: 'ai'
      });
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create initial message" });
    }
  });

  app.post("/api/chat-messages/generate", async (req: Request, res: Response) => {
    try {
      const { profileId, photoId, sessionId, eegData } = req.body;
      
      // Get conversation history
      const history = await storage.getChatMessages(sessionId, photoId);
      
      // Generate response
      const response = await generateChatResponse(history, eegData);
      
      // Create the message
      const message = await storage.createChatMessage({
        profileId,
        photoId,
        sessionId,
        content: response,
        sender: 'ai'
      });
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  // EEG readings endpoints
  app.get("/api/eeg-readings", async (req: Request, res: Response) => {
    const profileId = req.query.profileId ? parseInt(req.query.profileId as string) : undefined;
    const readings = profileId 
      ? await storage.getEegReadingsByProfileId(profileId)
      : await storage.getAllEegReadings();
    res.json(readings);
  });

  app.post("/api/eeg-readings", async (req: Request, res: Response) => {
    try {
      const data = insertEegReadingSchema.parse(req.body);
      const reading = await storage.createEegReading(data);
      res.json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create EEG reading" });
    }
  });

  // OpenAI endpoints
  app.post("/api/openai/story", async (req: Request, res: Response) => {
    try {
      const { name, relationship, place, memoryNotes, eegData } = req.body;
      const story = await generateStory(name, relationship ?? undefined, place ?? undefined, memoryNotes ?? undefined, eegData);
      res.json({ story });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate story" });
    }
  });

  app.post("/api/openai/hints", async (req: Request, res: Response) => {
    try {
      const { name, relationship, place, memoryNotes } = req.body;
      const hints = await generateHints(name, relationship ?? undefined, place ?? undefined, memoryNotes ?? undefined);
      res.json({ hints });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate hints" });
    }
  });

  app.post("/api/openai/chat-responses", async (req: Request, res: Response) => {
    try {
      const { messageHistory, eegData } = req.body;
      
      if (!messageHistory || messageHistory.length === 0) {
        return res.status(400).json({ message: "Message history required" });
      }
      
      // Get latest AI message to generate response suggestions
      const aiMessages = messageHistory.filter((msg: any) => msg.sender === 'ai');
      const latestAiMessage = aiMessages[aiMessages.length - 1];
      
      if (!latestAiMessage) {
        return res.status(400).json({ message: "No AI messages found" });
      }
      
      // Get photo details if available
      let personName = "this person";
      if (messageHistory[0].photoId) {
        const photo = await storage.getPhoto(messageHistory[0].photoId);
        if (photo) {
          personName = photo.name;
        }
      }
      
      const responses = await generateChatSuggestions(latestAiMessage.content, personName);
      res.json({ responses });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate chat responses" });
    }
  });
  
  // Bandit Game Session endpoints
  app.get("/api/bandit-game-sessions", async (req: Request, res: Response) => {
    try {
      const profileId = req.query.profileId ? parseInt(req.query.profileId as string) : undefined;
      const sessions = profileId 
        ? await storage.getBanditGameSessionsByProfileId(profileId)
        : await storage.getAllBanditGameSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bandit game sessions" });
    }
  });
  
  app.get("/api/bandit-game-sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.getBanditGameSession(parseInt(req.params.id));
      if (!session) {
        return res.status(404).json({ message: "Bandit game session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bandit game session" });
    }
  });
  
  app.post("/api/bandit-game-sessions", async (req: Request, res: Response) => {
    try {
      const data = insertBanditGameSessionSchema.parse(req.body);
      const session = await storage.createBanditGameSession(data);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create bandit game session" });
    }
  });
  
  app.patch("/api/bandit-game-sessions/:id/end", async (req: Request, res: Response) => {
    try {
      const session = await storage.endBanditGameSession(parseInt(req.params.id));
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to end bandit game session" });
    }
  });
  
  app.get("/api/bandit-game-sessions/:id/stats", async (req: Request, res: Response) => {
    try {
      const session = await storage.updateBanditGameSessionStats(parseInt(req.params.id));
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bandit game session stats" });
    }
  });
  
  // Bandit Game Trial endpoints
  app.get("/api/bandit-game-trials", async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : undefined;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      const trials = await storage.getBanditGameTrialsBySessionId(sessionId);
      res.json(trials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bandit game trials" });
    }
  });
  
  app.post("/api/bandit-game-trials", async (req: Request, res: Response) => {
    try {
      const data = insertBanditGameTrialSchema.parse(req.body);
      const trial = await storage.createBanditGameTrial(data);
      res.status(201).json(trial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create bandit game trial" });
    }
  });
  
  // EEG Cognitive Profile endpoints
  app.get("/api/eeg-cognitive-profiles", async (req: Request, res: Response) => {
    try {
      const profileId = req.query.profileId ? parseInt(req.query.profileId as string) : undefined;
      const profiles = profileId 
        ? await storage.getEegCognitiveProfilesByProfileId(profileId)
        : await storage.getAllEegCognitiveProfiles();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch EEG cognitive profiles" });
    }
  });
  
  app.get("/api/eeg-cognitive-profiles/latest", async (req: Request, res: Response) => {
    try {
      const profileId = req.query.profileId ? parseInt(req.query.profileId as string) : undefined;
      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }
      const profile = await storage.getLatestEegCognitiveProfileByProfileId(profileId);
      if (!profile) {
        return res.status(404).json({ message: "No EEG cognitive profile found for this user" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest EEG cognitive profile" });
    }
  });
  
  app.post("/api/eeg-cognitive-profiles", async (req: Request, res: Response) => {
    try {
      const data = insertEegCognitiveProfileSchema.parse(req.body);
      
      // Generate feature importance data if not provided
      if (!data.featureImportance) {
        data.featureImportance = {
          attention: Math.random() * 0.3 + 0.1,
          relaxation: Math.random() * 0.2 + 0.1,
          stress: Math.random() * 0.4 + 0.2,
          recognition: Math.random() * 0.3 + 0.1,
          temporalPatterns: Math.random() * 0.2 + 0.1
        };
      }
      
      const profile = await storage.createEegCognitiveProfile(data);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create EEG cognitive profile" });
    }
  });

  // EEG Data Upload endpoint
  app.post("/api/eeg-uploads", upload.single('eegFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const profileId = req.body.profileId ? parseInt(req.body.profileId) : undefined;
      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }
      
      const sessionType = req.body.sessionType || 'free';
      
      // Process the uploaded file (we'll implement the actual processing based on your data)
      const fileContent = req.file.buffer.toString('utf8');
      
      // For now, let's create a mock session to link the data to
      let sessionId;
      if (sessionType === 'game') {
        const gameSession = await storage.createGameSession({ profileId });
        sessionId = gameSession.id;
      } else if (sessionType === 'bandit') {
        const banditSession = await storage.createBanditGameSession({ profileId });
        sessionId = banditSession.id;
      } else {
        // For free recordings, we don't need a specific session
        sessionId = 0;
      }
      
      // For demonstration - extract a few lines from the file to create sample readings
      // In the real implementation, we'll actually process the uploaded EEG data format
      const lines = fileContent.split('\\n').slice(0, 10); // Just use first 10 lines for demo
      const readings = [];
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
          // Create reading with dummy values for now
          // These would be parsed from the actual file format
          const reading = await storage.createEegReading({
            profileId,
            sessionId,
            attention: Math.floor(Math.random() * 100),
            relaxation: Math.floor(Math.random() * 100),
            stress: Math.floor(Math.random() * 100),
            recognition: Math.floor(Math.random() * 100)
          });
          readings.push(reading);
        }
      }
      
      // Generate a cognitive profile from these readings
      const cognitiveProfile = await storage.createEegCognitiveProfile({
        profileId,
        alzheimersLikelihood: Math.floor(Math.random() * 100),
        attentionScore: Math.floor(Math.random() * 100),
        memoryScore: Math.floor(Math.random() * 100),
        cognitiveControl: Math.floor(Math.random() * 100),
        fatigueLevel: Math.floor(Math.random() * 100),
        dataPoints: readings.length,
        featureImportance: {
          attention: Math.random() * 0.3 + 0.1,
          relaxation: Math.random() * 0.2 + 0.1,
          stress: Math.random() * 0.4 + 0.2,
          recognition: Math.random() * 0.3 + 0.1,
          temporalPatterns: Math.random() * 0.2 + 0.1
        }
      });
      
      res.status(201).json({
        message: "EEG data processed successfully",
        dataPoints: readings.length,
        cognitiveProfileId: cognitiveProfile.id
      });
    } catch (error) {
      console.error("Error processing EEG data:", error);
      res.status(500).json({ message: "Failed to process EEG data" });
    }
  });

  // Dataset comparison endpoint
  app.post("/api/eeg-dataset-comparison", async (req: Request, res: Response) => {
    try {
      const { profileId, datasetType } = req.body;
      
      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }
      
      // This endpoint will compare a user's EEG readings against a reference dataset
      // datasetType can be 'healthy' (HBN-EEG) or 'alzheimers' (ds004504)
      
      const cognitiveProfile = await storage.getLatestEegCognitiveProfileByProfileId(profileId);
      if (!cognitiveProfile) {
        return res.status(404).json({ message: "No cognitive profile found for this user" });
      }
      
      // In the actual implementation, we would load and compare against the real datasets
      // For now, we'll return mock comparison data
      
      const comparison = {
        profileId,
        datasetType,
        similarityScore: Math.floor(Math.random() * 100),
        keyDifferences: {
          alphaWaves: Math.random() < 0.33 ? "higher" : Math.random() < 0.5 ? "lower" : "similar",
          betaWaves: Math.random() < 0.33 ? "higher" : Math.random() < 0.5 ? "lower" : "similar",
          thetaWaves: Math.random() < 0.33 ? "higher" : Math.random() < 0.5 ? "lower" : "similar",
          deltaWaves: Math.random() < 0.33 ? "higher" : Math.random() < 0.5 ? "lower" : "similar",
          gammaWaves: Math.random() < 0.33 ? "higher" : Math.random() < 0.5 ? "lower" : "similar"
        },
        recommendation: "Continue cognitive exercises to improve brain activity patterns.",
        timestamp: new Date().toISOString()
      };
      
      res.json(comparison);
    } catch (error) {
      console.error("Error in dataset comparison:", error);
      res.status(500).json({ message: "Failed to compare against dataset" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
