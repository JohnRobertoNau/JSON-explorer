import { useState, useCallback } from 'react';
import { AIService, AIMessage, AIResponse, getAIService, initializeAIService, isValidApiKey } from '../services/aiService';

export interface UseAIOptions {
  onJsonModified?: (newJson: any) => void;
  onError?: (error: string) => void;
}

export const useAI = (options?: UseAIOptions) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiChatHistory, setAiChatHistory] = useState<AIMessage[]>([]);
  const [aiService, setAiService] = useState<AIService | null>(getAIService());
  const [isConfigured, setIsConfigured] = useState(false);

  // Initialize AI service
  const initializeAI = useCallback(async (apiKey: string, provider: 'openai' | 'claude' | 'gemini' = 'gemini') => {
    try {
      setIsAiLoading(true);
      setAiError(null);

      if (!isValidApiKey(apiKey, provider)) {
        throw new Error('Invalid API key format');
      }

      const service = initializeAIService(apiKey, provider);
      
      // Test connection
      const isConnected = await service.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to AI service');
      }

      setAiService(service);
      setIsConfigured(true);
      
      // Add welcome message
      const welcomeMessage: AIMessage = {
        id: Date.now().toString(),
        message: `🤖 AI Assistant connected successfully! I'm ready to help you with your JSON files. You can ask me to:

• Analyze your JSON structure
• Modify specific fields or values
• Add new properties or arrays
• Restructure your data
• Explain what your JSON contains
• And much more!

What would you like to do with your JSON?`,
        isUser: false,
        timestamp: new Date()
      };

      setAiChatHistory([welcomeMessage]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAiError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setIsAiLoading(false);
    }
  }, [options]);

  // Send message to AI
  const sendMessage = useCallback(async (
    message: string,
    jsonData: any,
    fileName: string
  ) => {
    if (!aiService || !isConfigured) {
      setAiError('AI service is not configured. Please set up your API key first.');
      return;
    }

    if (!message.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      message: message,
      isUser: true,
      timestamp: new Date()
    };

    setAiChatHistory(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setAiError(null);

    try {
      const response: AIResponse = await aiService.sendMessage(
        message,
        jsonData,
        fileName,
        aiChatHistory
      );

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        message: response.response,
        isUser: false,
        timestamp: new Date()
      };

      setAiChatHistory(prev => [...prev, aiMessage]);
      setAiPrompt('');

      // Detect if user is requesting modifications (not just explanations)
      const isModificationRequest = message.toLowerCase().includes('modific') || 
                                   message.toLowerCase().includes('change') ||
                                   message.toLowerCase().includes('update') ||
                                   message.toLowerCase().includes('edit') ||
                                   message.toLowerCase().includes('add') ||
                                   message.toLowerCase().includes('remove') ||
                                   message.toLowerCase().includes('delete') ||
                                   message.toLowerCase().includes('replace') ||
                                   message.toLowerCase().includes('insert') ||
                                   message.toLowerCase().includes('create') ||
                                   message.toLowerCase().includes('adaugă') ||
                                   message.toLowerCase().includes('șterge') ||
                                   message.toLowerCase().includes('sterge') ||
                                   message.toLowerCase().includes('înlocuiește') ||
                                   message.toLowerCase().includes('inlocuieste') ||
                                   message.toLowerCase().includes('creează') ||
                                   message.toLowerCase().includes('creeaza');

      // If AI modified JSON AND user requested modifications, notify parent component
      if (response.modifiedJson && isModificationRequest && options?.onJsonModified) {
        options.onJsonModified(response.modifiedJson);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while communicating with AI';
      setAiError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiService, isConfigured, aiChatHistory, options]);

  // Function to send the message from input
  const handleSendMessage = useCallback((jsonData: any, fileName: string) => {
    sendMessage(aiPrompt, jsonData, fileName);
  }, [aiPrompt, sendMessage]);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setAiChatHistory([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setAiError(null);
  }, []);

  // Reset AI service
  const resetAI = useCallback(() => {
    setAiService(null);
    setIsConfigured(false);
    setAiChatHistory([]);
    setAiError(null);
    setAiPrompt('');
  }, []);

  return {
    // State
    aiPrompt,
    isAiLoading,
    aiError,
    aiChatHistory,
    isConfigured,
    
    // Actions
    setAiPrompt,
    initializeAI,
    sendMessage,
    handleSendMessage,
    clearChatHistory,
    clearError,
    resetAI,
  };
};
