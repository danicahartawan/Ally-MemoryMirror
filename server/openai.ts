import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-demo-key" });

export async function generateStory(name: string, relationship?: string, place?: string, memoryNotes?: string, eegData?: any) {
  try {
    // Construct prompt based on available information
    let prompt = `Generate a brief, comforting story about ${name}`;
    
    if (relationship) {
      prompt += `, who is the patient's ${relationship}`;
    }
    
    if (place) {
      prompt += `. Include something about ${place} where they often meet`;
    }
    
    if (memoryNotes) {
      prompt += `. Use these memory details: ${memoryNotes}`;
    }
    
    // Adjust style based on EEG data if available
    if (eegData) {
      if (eegData.stress > 70) {
        prompt += `. Since the patient seems stressed (stress level: ${eegData.stress}/100), make the story extra calming and simple.`;
      } else if (eegData.relaxation > 70) {
        prompt += `. Since the patient seems relaxed (relaxation level: ${eegData.relaxation}/100), you can include more details in the story.`;
      }
      
      if (eegData.recognition < 30) {
        prompt += ` Since the patient may not recognize ${name} well (recognition level: ${eegData.recognition}/100), include more identifying details and clear context.`;
      }
    }
    
    prompt += ` Keep the story short (3-4 sentences), positive, and written in second person as if speaking directly to the patient.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a memory assistance AI that helps Alzheimer's patients remember loved ones through gentle, positive stories." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
    });

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a story right now.";
  } catch (error) {
    console.error("Error generating story:", error);
    return "I'm sorry, I couldn't generate a story right now.";
  }
}

export async function generateHints(name: string, relationship?: string, place?: string, memoryNotes?: string) {
  try {
    let prompt = `Generate 3 short, helpful hints to help an Alzheimer's patient remember who ${name} is`;
    
    if (relationship) {
      prompt += `, their ${relationship}`;
    }
    
    if (place) {
      prompt += `. Include something about ${place} where they often meet`;
    }
    
    if (memoryNotes) {
      prompt += `. Use these memory details: ${memoryNotes}`;
    }
    
    prompt += `. Format the response as a JSON array of strings with 3 short, clear hints.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a memory assistance AI that helps Alzheimer's patients with gentle reminders." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });

    const content = completion.choices[0].message.content || '{"hints":["This is your family member","They visit you often","You have known them for years"]}';
    const parsedContent = JSON.parse(content);
    
    return Array.isArray(parsedContent.hints) ? parsedContent.hints : [];
  } catch (error) {
    console.error("Error generating hints:", error);
    return ["This person is part of your family", "Think about who visits you regularly", "Look at their features for clues"];
  }
}

export async function generateChatResponse(messageHistory: any[], eegData?: any) {
  try {
    // Format message history for the API
    const formattedMessages = messageHistory.map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    // Add system message based on EEG data
    let systemMessage = "You are a compassionate AI assistant helping an Alzheimer's patient remember people in their life. Keep responses short (2-3 sentences), clear, and supportive.";
    
    if (eegData) {
      if (eegData.stress > 70) {
        systemMessage += " The patient is currently showing signs of stress, so be extra gentle and reassuring. Use very simple language.";
      } else if (eegData.relaxation > 70) {
        systemMessage += " The patient is currently relaxed, so you can engage more deeply in conversation while still keeping things simple.";
      }
      
      if (eegData.attention < 30) {
        systemMessage += " The patient's attention seems low, so keep your response especially brief and focused.";
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        ...formattedMessages
      ],
      max_tokens: 150,
    });

    return completion.choices[0].message.content || "I'm sorry, I'm having trouble thinking of what to say.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm sorry, I'm having trouble right now. Let's continue our conversation in a moment.";
  }
}

export async function generateChatSuggestions(latestMessage: string, personName: string) {
  try {
    const prompt = `Based on this message in a conversation about a person named ${personName}: "${latestMessage}", generate 3 simple response options that an Alzheimer's patient might want to select as their reply. Format as a JSON array of strings, keeping each response under 40 characters.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI assistant creating simple response options for Alzheimer's patients." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });

    const content = completion.choices[0].message.content || '{"responses":["Tell me more","I remember that","I\'m not sure about that"]}';
    const parsedContent = JSON.parse(content);
    
    return Array.isArray(parsedContent.responses) ? parsedContent.responses : [];
  } catch (error) {
    console.error("Error generating chat suggestions:", error);
    return ["Tell me more", `Tell me about ${personName}`, "I remember that"];
  }
}
