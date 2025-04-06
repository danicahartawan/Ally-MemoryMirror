import { 
  profiles, photos, gameSessions, chatMessages, eegReadings,
  banditGameSessions, banditGameTrials, eegCognitiveProfiles,
  type Profile, type InsertProfile,
  type Photo, type InsertPhoto,
  type GameSession, type InsertGameSession,
  type ChatMessage, type InsertChatMessage,
  type EegReading, type InsertEegReading,
  type BanditGameSession, type InsertBanditGameSession,
  type BanditGameTrial, type InsertBanditGameTrial,
  type EegCognitiveProfile, type InsertEegCognitiveProfile
} from "@shared/schema";

export interface IStorage {
  // Profile methods
  getProfile(id: number): Promise<Profile | undefined>;
  getAllProfiles(): Promise<Profile[]>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  deleteProfile(id: number): Promise<void>;
  
  // Photo methods
  getPhoto(id: number): Promise<Photo | undefined>;
  getAllPhotos(): Promise<Photo[]>;
  getPhotosByProfileId(profileId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  
  // Game Session methods
  getGameSession(id: number): Promise<GameSession | undefined>;
  getAllGameSessions(): Promise<GameSession[]>;
  getGameSessionsByProfileId(profileId: number): Promise<GameSession[]>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  endGameSession(id: number): Promise<GameSession>;
  recordGameAnswer(id: number, correct: boolean): Promise<GameSession>;
  updateGameSessionEeg(id: number, attention: number, relaxation: number): Promise<GameSession>;
  
  // Chat Message methods
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessages(sessionId?: number, photoId?: number): Promise<ChatMessage[]>;
  getChatMessagesByProfileId(profileId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // EEG Reading methods
  getEegReading(id: number): Promise<EegReading | undefined>;
  getAllEegReadings(): Promise<EegReading[]>;
  getEegReadingsByProfileId(profileId: number): Promise<EegReading[]>;
  getEegReadingsBySessionId(sessionId: number): Promise<EegReading[]>;
  createEegReading(reading: InsertEegReading): Promise<EegReading>;
  
  // Bandit Game Session methods
  getBanditGameSession(id: number): Promise<BanditGameSession | undefined>;
  getAllBanditGameSessions(): Promise<BanditGameSession[]>;
  getBanditGameSessionsByProfileId(profileId: number): Promise<BanditGameSession[]>;
  createBanditGameSession(session: InsertBanditGameSession): Promise<BanditGameSession>;
  endBanditGameSession(id: number): Promise<BanditGameSession>;
  updateBanditGameSessionStats(id: number): Promise<BanditGameSession>;
  
  // Bandit Game Trial methods
  getBanditGameTrial(id: number): Promise<BanditGameTrial | undefined>;
  getBanditGameTrialsBySessionId(sessionId: number): Promise<BanditGameTrial[]>;
  createBanditGameTrial(trial: InsertBanditGameTrial): Promise<BanditGameTrial>;
  
  // EEG Cognitive Profile methods
  getEegCognitiveProfile(id: number): Promise<EegCognitiveProfile | undefined>;
  getLatestEegCognitiveProfileByProfileId(profileId: number): Promise<EegCognitiveProfile | undefined>;
  getAllEegCognitiveProfiles(): Promise<EegCognitiveProfile[]>;
  getEegCognitiveProfilesByProfileId(profileId: number): Promise<EegCognitiveProfile[]>;
  createEegCognitiveProfile(profile: InsertEegCognitiveProfile): Promise<EegCognitiveProfile>;
}

export class MemStorage implements IStorage {
  private profiles: Map<number, Profile>;
  private photos: Map<number, Photo>;
  private gameSessions: Map<number, GameSession>;
  private chatMessages: Map<number, ChatMessage>;
  private eegReadings: Map<number, EegReading>;
  private banditGameSessions: Map<number, BanditGameSession>;
  private banditGameTrials: Map<number, BanditGameTrial>;
  private eegCognitiveProfiles: Map<number, EegCognitiveProfile>;
  
  private profileId: number = 1;
  private photoId: number = 1;
  private sessionId: number = 1;
  private messageId: number = 1;
  private readingId: number = 1;
  private banditSessionId: number = 1;
  private banditTrialId: number = 1;
  private cognitiveProfileId: number = 1;
  
  constructor() {
    this.profiles = new Map();
    this.photos = new Map();
    this.gameSessions = new Map();
    this.chatMessages = new Map();
    this.eegReadings = new Map();
    this.banditGameSessions = new Map();
    this.banditGameTrials = new Map();
    this.eegCognitiveProfiles = new Map();
    
    // Add sample profile for testing if needed
    this.createProfile({
      name: "Eleanor Roosevelt",
      avatarInitials: "ER"
    }).catch(console.error);
  }
  
  // Profile methods
  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }
  
  async getAllProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }
  
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const id = this.profileId++;
    const now = new Date();
    const newProfile: Profile = { 
      ...profile,
      id,
      createdAt: now
    };
    this.profiles.set(id, newProfile);
    return newProfile;
  }
  
  async deleteProfile(id: number): Promise<void> {
    // Delete related data first
    const photosToDelete = await this.getPhotosByProfileId(id);
    for (const photo of photosToDelete) {
      await this.deletePhoto(photo.id);
    }
    
    // Delete sessions, messages, and readings
    const sessions = await this.getGameSessionsByProfileId(id);
    for (const session of sessions) {
      this.gameSessions.delete(session.id);
    }
    
    const messages = await this.getChatMessagesByProfileId(id);
    for (const message of messages) {
      this.chatMessages.delete(message.id);
    }
    
    const readings = await this.getEegReadingsByProfileId(id);
    for (const reading of readings) {
      this.eegReadings.delete(reading.id);
    }
    
    // Finally delete the profile
    this.profiles.delete(id);
  }
  
  // Photo methods
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }
  
  async getAllPhotos(): Promise<Photo[]> {
    return Array.from(this.photos.values());
  }
  
  async getPhotosByProfileId(profileId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(photo => photo.profileId === profileId);
  }
  
  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const id = this.photoId++;
    const now = new Date();
    const newPhoto: Photo = {
      ...photo,
      id,
      createdAt: now
    };
    this.photos.set(id, newPhoto);
    return newPhoto;
  }
  
  async deletePhoto(id: number): Promise<void> {
    // Delete related messages
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.photoId === id);
    
    for (const message of messages) {
      this.chatMessages.delete(message.id);
    }
    
    // Delete the photo
    this.photos.delete(id);
  }
  
  // Game Session methods
  async getGameSession(id: number): Promise<GameSession | undefined> {
    return this.gameSessions.get(id);
  }
  
  async getAllGameSessions(): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values());
  }
  
  async getGameSessionsByProfileId(profileId: number): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values())
      .filter(session => session.profileId === profileId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  
  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const id = this.sessionId++;
    const now = new Date();
    const newSession: GameSession = {
      ...session,
      id,
      startedAt: now,
      endedAt: null,
      correctAnswers: 0,
      totalQuestions: 0,
      avgEegAttention: 0,
      avgEegRelaxation: 0
    };
    this.gameSessions.set(id, newSession);
    return newSession;
  }
  
  async endGameSession(id: number): Promise<GameSession> {
    const session = this.gameSessions.get(id);
    if (!session) {
      throw new Error("Game session not found");
    }
    
    // Calculate average EEG values
    const readings = await this.getEegReadingsBySessionId(id);
    if (readings.length > 0) {
      const totalAttention = readings.reduce((sum, reading) => sum + reading.attention, 0);
      const totalRelaxation = readings.reduce((sum, reading) => sum + reading.relaxation, 0);
      
      session.avgEegAttention = Math.round(totalAttention / readings.length);
      session.avgEegRelaxation = Math.round(totalRelaxation / readings.length);
    }
    
    session.endedAt = new Date();
    this.gameSessions.set(id, session);
    
    return session;
  }
  
  async recordGameAnswer(id: number, correct: boolean): Promise<GameSession> {
    const session = this.gameSessions.get(id);
    if (!session) {
      throw new Error("Game session not found");
    }
    
    session.totalQuestions++;
    if (correct) {
      session.correctAnswers++;
    }
    
    this.gameSessions.set(id, session);
    return session;
  }
  
  async updateGameSessionEeg(id: number, attention: number, relaxation: number): Promise<GameSession> {
    const session = this.gameSessions.get(id);
    if (!session) {
      throw new Error("Game session not found");
    }
    
    // Update the running average
    session.avgEegAttention = Math.round((session.avgEegAttention + attention) / 2);
    session.avgEegRelaxation = Math.round((session.avgEegRelaxation + relaxation) / 2);
    
    this.gameSessions.set(id, session);
    return session;
  }
  
  // Chat Message methods
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }
  
  async getChatMessages(sessionId?: number, photoId?: number): Promise<ChatMessage[]> {
    let messages = Array.from(this.chatMessages.values());
    
    if (sessionId !== undefined) {
      messages = messages.filter(message => message.sessionId === sessionId);
    }
    
    if (photoId !== undefined) {
      messages = messages.filter(message => message.photoId === photoId);
    }
    
    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async getChatMessagesByProfileId(profileId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.profileId === profileId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageId++;
    const now = new Date();
    const newMessage: ChatMessage = {
      ...message,
      id,
      createdAt: now
    };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  // EEG Reading methods
  async getEegReading(id: number): Promise<EegReading | undefined> {
    return this.eegReadings.get(id);
  }
  
  async getAllEegReadings(): Promise<EegReading[]> {
    return Array.from(this.eegReadings.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async getEegReadingsByProfileId(profileId: number): Promise<EegReading[]> {
    return Array.from(this.eegReadings.values())
      .filter(reading => reading.profileId === profileId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async getEegReadingsBySessionId(sessionId: number): Promise<EegReading[]> {
    return Array.from(this.eegReadings.values())
      .filter(reading => reading.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async createEegReading(reading: InsertEegReading): Promise<EegReading> {
    const id = this.readingId++;
    const now = new Date();
    const newReading: EegReading = {
      ...reading,
      id,
      timestamp: now
    };
    this.eegReadings.set(id, newReading);
    
    // Also update the game session with the latest EEG data
    if (reading.sessionId) {
      this.updateGameSessionEeg(reading.sessionId, reading.attention, reading.relaxation)
        .catch(console.error);
    }
    
    return newReading;
  }
  
  // Bandit Game Session methods
  async getBanditGameSession(id: number): Promise<BanditGameSession | undefined> {
    return this.banditGameSessions.get(id);
  }
  
  async getAllBanditGameSessions(): Promise<BanditGameSession[]> {
    return Array.from(this.banditGameSessions.values());
  }
  
  async getBanditGameSessionsByProfileId(profileId: number): Promise<BanditGameSession[]> {
    return Array.from(this.banditGameSessions.values())
      .filter(session => session.profileId === profileId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  
  async createBanditGameSession(session: InsertBanditGameSession): Promise<BanditGameSession> {
    const id = this.banditSessionId++;
    const now = new Date();
    const newSession: BanditGameSession = {
      ...session,
      id,
      startedAt: now,
      endedAt: null,
      totalTrials: 0,
      optimalChoices: 0,
      explorationRate: 50, // Default to middle value
      learningRate: 50, // Default to middle value
      avgResponseTime: 0,
      eegCorrelation: 0
    };
    this.banditGameSessions.set(id, newSession);
    return newSession;
  }
  
  async endBanditGameSession(id: number): Promise<BanditGameSession> {
    const session = this.banditGameSessions.get(id);
    if (!session) {
      throw new Error("Bandit game session not found");
    }
    
    session.endedAt = new Date();
    
    // Calculate final stats
    await this.updateBanditGameSessionStats(id);
    
    return session;
  }
  
  async updateBanditGameSessionStats(id: number): Promise<BanditGameSession> {
    const session = this.banditGameSessions.get(id);
    if (!session) {
      throw new Error("Bandit game session not found");
    }
    
    const trials = await this.getBanditGameTrialsBySessionId(id);
    if (trials.length === 0) {
      return session;
    }
    
    // Calculate stats
    session.totalTrials = trials.length;
    
    // Calculate optimal choices (assuming choice 2 is optimal most often for simplicity)
    // In a real implementation, this would be more sophisticated
    session.optimalChoices = trials.filter(t => t.choice === 2 && t.reward > 0).length;
    
    // Calculate average response time
    const totalResponseTime = trials.reduce((sum, trial) => sum + trial.responseTime, 0);
    session.avgResponseTime = Math.round(totalResponseTime / trials.length);
    
    // Calculate exploration rate based on choice variety
    const choiceCounts = [0, 0, 0]; // Counts for choices 0, 1, 2
    trials.forEach(trial => {
      choiceCounts[trial.choice]++;
    });
    const maxChoice = Math.max(...choiceCounts);
    const explorationRatio = 1 - (maxChoice / trials.length);
    session.explorationRate = Math.round(explorationRatio * 100);
    
    // Calculate learning rate by comparing early vs late performance
    const halfIndex = Math.floor(trials.length / 2);
    const earlyTrials = trials.slice(0, halfIndex);
    const lateTrials = trials.slice(halfIndex);
    
    const earlyRewards = earlyTrials.reduce((sum, trial) => sum + trial.reward, 0) / earlyTrials.length;
    const lateRewards = lateTrials.reduce((sum, trial) => sum + trial.reward, 0) / lateTrials.length;
    
    // Learning rate is how much improvement occurred
    const learningImprovement = (lateRewards - earlyRewards) / Math.max(earlyRewards, 1);
    session.learningRate = Math.min(100, Math.max(0, Math.round(learningImprovement * 100)));
    
    // Get related EEG readings to calculate correlation
    const eegReadings = await this.getEegReadingsByProfileId(session.profileId);
    if (eegReadings.length > 0) {
      // Simple correlation measure for demo - in real app would use proper statistical correlation
      const recentEegReadings = eegReadings.slice(-20); // Last 20 readings
      const avgAttention = recentEegReadings.reduce((sum, r) => sum + r.attention, 0) / recentEegReadings.length;
      
      // Hypothesize that higher attention correlates with better performance
      // Again, a real implementation would use proper statistical methods
      session.eegCorrelation = Math.min(100, Math.max(0, Math.round(avgAttention * session.learningRate / 100)));
    }
    
    this.banditGameSessions.set(id, session);
    return session;
  }
  
  // Bandit Game Trial methods
  async getBanditGameTrial(id: number): Promise<BanditGameTrial | undefined> {
    return this.banditGameTrials.get(id);
  }
  
  async getBanditGameTrialsBySessionId(sessionId: number): Promise<BanditGameTrial[]> {
    return Array.from(this.banditGameTrials.values())
      .filter(trial => trial.sessionId === sessionId)
      .sort((a, b) => a.trialNumber - b.trialNumber);
  }
  
  async createBanditGameTrial(trial: InsertBanditGameTrial): Promise<BanditGameTrial> {
    const id = this.banditTrialId++;
    const now = new Date();
    const newTrial: BanditGameTrial = {
      ...trial,
      id,
      timestamp: now
    };
    this.banditGameTrials.set(id, newTrial);
    
    // Update session statistics after each trial
    this.updateBanditGameSessionStats(trial.sessionId).catch(console.error);
    
    return newTrial;
  }
  
  // EEG Cognitive Profile methods
  async getEegCognitiveProfile(id: number): Promise<EegCognitiveProfile | undefined> {
    return this.eegCognitiveProfiles.get(id);
  }
  
  async getLatestEegCognitiveProfileByProfileId(profileId: number): Promise<EegCognitiveProfile | undefined> {
    const profiles = await this.getEegCognitiveProfilesByProfileId(profileId);
    if (profiles.length === 0) {
      return undefined;
    }
    return profiles[0]; // First profile is the most recent due to sort order
  }
  
  async getAllEegCognitiveProfiles(): Promise<EegCognitiveProfile[]> {
    return Array.from(this.eegCognitiveProfiles.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getEegCognitiveProfilesByProfileId(profileId: number): Promise<EegCognitiveProfile[]> {
    return Array.from(this.eegCognitiveProfiles.values())
      .filter(profile => profile.profileId === profileId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async createEegCognitiveProfile(profile: InsertEegCognitiveProfile): Promise<EegCognitiveProfile> {
    const id = this.cognitiveProfileId++;
    const now = new Date();
    const newProfile: EegCognitiveProfile = {
      ...profile,
      id,
      timestamp: now
    };
    this.eegCognitiveProfiles.set(id, newProfile);
    return newProfile;
  }
}

export const storage = new MemStorage();
