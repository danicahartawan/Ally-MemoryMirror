import { apiRequest } from "@/lib/queryClient";

export async function generateAIResponse(
  prompt: string,
  context: Record<string, any> = {}
) {
  try {
    const response = await apiRequest("POST", "/api/openai/chat", {
      prompt,
      context
    });
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error;
  }
}

export async function generateStoryAboutPerson(
  name: string,
  relationship: string | undefined,
  place: string | undefined,
  memoryNotes: string | undefined,
  eegData: any | undefined = null
) {
  try {
    const response = await apiRequest("POST", "/api/openai/story", {
      name,
      relationship,
      place,
      memoryNotes,
      eegData
    });
    
    const data = await response.json();
    return data.story;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
}

export async function generateHints(
  name: string,
  relationship: string | undefined,
  place: string | undefined,
  memoryNotes: string | undefined
) {
  try {
    const response = await apiRequest("POST", "/api/openai/hints", {
      name,
      relationship,
      place,
      memoryNotes
    });
    
    const data = await response.json();
    return data.hints;
  } catch (error) {
    console.error("Error generating hints:", error);
    throw error;
  }
}

export async function generateChatResponses(
  messageHistory: any[],
  eegData: any | undefined = null
) {
  try {
    const response = await apiRequest("POST", "/api/openai/chat-responses", {
      messageHistory,
      eegData
    });
    
    const data = await response.json();
    return data.responses;
  } catch (error) {
    console.error("Error generating chat responses:", error);
    throw error;
  }
}
