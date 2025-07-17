import React from 'react';

interface FormattedAIResponseProps {
  response: string;
}

const FormattedAIResponse: React.FC<FormattedAIResponseProps> = ({ response }) => {
  const formatResponse = (text: string) => {
    // Împarte textul în paragrafe
    const paragraphs = text.split('\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Detectează listele numerotate
      if (paragraph.match(/^\d+\.\s/)) {
        const [number, ...content] = paragraph.split(/\.\s/);
        const title = content[0].split(':')[0];
        const description = content.join('. ').substring(title.length + 1);
        
        return (
          <div key={index} className="mb-4 p-3 bg-gray-700 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {number}
              </span>
              <div>
                <h4 className="font-semibold text-blue-300 mb-1">{title}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
        );
      }
      
      // Detectează exemple cu cod JSON
      if (paragraph.includes('```json') || paragraph.includes('```') || paragraph.includes('{"') || paragraph.includes('"}')) {
        return (
          <div key={index} className="mb-3 p-3 bg-gray-900 rounded-lg border border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-400">💻</span>
              <span className="text-xs text-green-300">Code Example</span>
            </div>
            <code className="text-green-400 text-sm whitespace-pre-wrap">{paragraph}</code>
          </div>
        );
      }
      
      // Detectează exemple cu numere și string-uri
      if (paragraph.includes('"100"') || paragraph.includes('100') || paragraph.includes('true/false')) {
        return (
          <div key={index} className="mb-3 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">🔢</span>
              <span className="text-xs text-blue-300">Data Type Example</span>
            </div>
            <code className="text-blue-300 text-sm">{paragraph}</code>
          </div>
        );
      }
      
      // Detectează titluri cu ** sau :
      if (paragraph.includes('**') || paragraph.match(/^[A-Z][^.]*:$/)) {
        const cleanTitle = paragraph.replace(/\*\*/g, '').replace(/:$/, '');
        return (
          <h3 key={index} className="text-lg font-semibold text-purple-300 mb-2 mt-4 flex items-center gap-2">
            <span className="text-purple-400">✨</span>
            {cleanTitle}
          </h3>
        );
      }
      
      // Detectează warning-uri sau note importante
      if (paragraph.toLowerCase().includes('note') || paragraph.toLowerCase().includes('important') || paragraph.toLowerCase().includes('cannot provide')) {
        return (
          <div key={index} className="mb-3 p-3 bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400">⚠️</span>
              <span className="text-xs text-yellow-300">Important Note</span>
            </div>
            <span className="text-yellow-200">{paragraph}</span>
          </div>
        );
      }
      
      // Detectează sugestii sau recomandări
      if (paragraph.toLowerCase().includes('consider') || paragraph.toLowerCase().includes('suggest') || paragraph.toLowerCase().includes('recommend')) {
        return (
          <div key={index} className="mb-3 p-3 bg-green-900 bg-opacity-30 border-l-4 border-green-400 rounded-r-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400">💡</span>
              <span className="text-xs text-green-300">Recommendation</span>
            </div>
            <span className="text-green-200">{paragraph}</span>
          </div>
        );
      }
      
      // Detectează explicații sau definiții
      if (paragraph.toLowerCase().includes('explanation') || paragraph.toLowerCase().includes('this means') || paragraph.toLowerCase().includes('for example')) {
        return (
          <div key={index} className="mb-3 p-3 bg-indigo-900 bg-opacity-30 border-l-4 border-indigo-400 rounded-r-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-400">�</span>
              <span className="text-xs text-indigo-300">Explanation</span>
            </div>
            <span className="text-indigo-200">{paragraph}</span>
          </div>
        );
      }
      
      // Paragrafe normale
      return (
        <p key={index} className="mb-3 text-gray-300 leading-relaxed">
          {paragraph}
        </p>
      );
    });
  };

  return <div className="space-y-2">{formatResponse(response)}</div>;
};

export default FormattedAIResponse;
