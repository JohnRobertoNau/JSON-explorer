/**
 * Serviciul AI pentru comunicarea cu Google Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export interface AIResponse {
  response: string;
  modifiedJson?: any;
  explanation?: string;
}

export class AIService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Creează system prompt-ul pentru AI
   */
  private createSystemPrompt(jsonData: any, fileName: string): string {
    return `You are Jason, a friendly JSON assistant specialized in helping users modify JSON structures. You have a creative personality and remember our conversation context.

Current JSON file: ${fileName}
Current JSON structure:
${JSON.stringify(jsonData, null, 2)}

Instructions:
1. Remember our conversation history and refer to previous messages when relevant
2. Help the user analyze, understand, or modify the JSON structure
3. Be conversational and friendly - you're Jason, not just "AI Assistant"
4. ONLY provide JSON code when the user explicitly requests modifications, additions, deletions, or changes
5. For explanations, analysis, or questions, provide only text responses without JSON blocks
6. When providing modified JSON (only when requested), wrap it in triple backticks with "json" language identifier
7. Always explain what changes you made when modifying JSON
8. Be precise and helpful, but maintain your friendly personality
9. If the user references something from earlier in our conversation, acknowledge it

Example response for MODIFICATIONS:
Here's the modified JSON as you requested:

\`\`\`json
{
  "modified": "structure",
  "here": true
}
\`\`\`

**Explanation:** I added a new field called "modified" and changed the structure as requested, just like we discussed earlier.

Example response for EXPLANATIONS (NO JSON CODE):
Based on our conversation, this JSON contains a user object with name, age, and email properties. The "active" field indicates the user's status...

I'm Jason, your JSON specialist. How can I help you today?`;
  }

  /**
   * Funcția principală pentru comunicarea cu AI
   */
  async sendMessage(
    userMessage: string,
    jsonData: any,
    fileName: string,
    chatHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    try {
      // Creează prompt-ul complet cu istoricul conversației
      const systemPrompt = this.createSystemPrompt(jsonData, fileName);
      
      // Construiește contextul conversației din istoric
      let conversationContext = '';
      if (chatHistory.length > 0) {
        conversationContext = '\n\nPrevious conversation:\n';
        chatHistory.forEach(msg => {
          const role = msg.isUser ? 'User' : 'Assistant';
          conversationContext += `${role}: ${msg.message}\n`;
        });
        conversationContext += '\n';
      }
      
      const fullPrompt = `${systemPrompt}${conversationContext}Current user message: ${userMessage}`;

      // Trimite request-ul către Gemini
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Procesează răspunsul pentru a extrage JSON modificat
      const modifiedJson = this.extractModifiedJson(aiResponse);
      
      return {
        response: aiResponse,
        modifiedJson: modifiedJson,
        explanation: this.extractExplanation(aiResponse)
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`Failed to communicate with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extrage JSON modificat din răspunsul AI
   */
  private extractModifiedJson(response: string): any | null {
    try {
      // Caută pattern-uri pentru JSON în răspuns
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Încearcă să găsească JSON în alte formate
      const jsonRegex = /\{[\s\S]*\}/;
      const match = response.match(jsonRegex);
      if (match) {
        return JSON.parse(match[0]);
      }

      return null;
    } catch (error) {
      console.warn('Could not extract JSON from AI response:', error);
      return null;
    }
  }

  /**
   * Extrage explicația din răspunsul AI
   */
  private extractExplanation(response: string): string {
    const explanationMatch = response.match(/\*\*Explanation:\*\*\s*(.*?)(?=\*\*|$)/s);
    return explanationMatch ? explanationMatch[1].trim() : '';
  }

  /**
   * Testează conexiunea la AI
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello, are you working?');
      const response = await result.response;
      return response.text().length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export const initializeAIService = (apiKey: string): AIService => {
  aiServiceInstance = new AIService(apiKey);
  return aiServiceInstance;
};

export const getAIService = (): AIService | null => {
  return aiServiceInstance;
};

// Utility function pentru validarea API key-ului
export const isValidApiKey = (apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string') return false;
  return apiKey.length > 20; // Gemini keys sunt mai lungi
};
