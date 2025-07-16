import React, { useState } from 'react';
import { isValidApiKey } from '../services/aiService';

interface AIConfigProps {
  onConfigured: (apiKey: string, provider: 'openai' | 'claude' | 'gemini') => void;
  isLoading?: boolean;
  error?: string | null;
}

const AIConfig: React.FC<AIConfigProps> = ({ onConfigured, isLoading, error }) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'claude' | 'gemini'>('gemini');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onConfigured(apiKey.trim(), provider);
    }
  };

  const isValidKey = apiKey ? isValidApiKey(apiKey, provider) : true;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <h3 className="text-lg font-semibold text-purple-400 mb-3">
        🔧 Configure AI Assistant
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'openai' | 'claude' | 'gemini')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="gemini">Google (Gemini) - FREE</option>
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="claude">Anthropic (Claude)</option>
          </select>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider} API key...`}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 pr-10 ${
                !isValidKey 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 focus:ring-purple-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 px-3 py-2 text-gray-400 hover:text-white"
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
          {!isValidKey && (
            <p className="mt-1 text-sm text-red-400">
              Invalid API key format for {provider}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-md text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!apiKey.trim() || !isValidKey || isLoading}
          className={`w-full px-4 py-2 font-semibold rounded-md transition-all duration-200 ${
            !apiKey.trim() || !isValidKey || isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isLoading ? '🔄 Connecting...' : '🚀 Connect AI Assistant'}
        </button>
      </form>

      {/* Help Section */}
      <div className="mt-4 p-3 bg-gray-700 rounded-md">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          How to get API keys:
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong>Gemini (FREE):</strong> Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">makersuite.google.com/app/apikey</a></li>
          <li>• <strong>OpenAI:</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">platform.openai.com/api-keys</a></li>
          <li>• <strong>Claude:</strong> Visit <a href="https://console.anthropic.com/" target="_blank" className="text-blue-400 hover:underline">console.anthropic.com</a></li>
        </ul>
      </div>
    </div>
  );
};

export default AIConfig;
