import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DelightfulErrorProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
}

const delightfulMessages = [
  {
    emoji: '🌐',
    title: "Oops! We're taking a coffee break ☕",
    message: "Our servers are having a little siesta. They'll be back in a jiffy!",
  },
  {
    emoji: '🚀',
    title: "Houston, we have a connection issue!",
    message: "Don't worry, even astronauts have connection problems. We're working on it!",
  },
  {
    emoji: '🌙',
    title: "The server is catching some Z's",
    message: "It's probably dreaming about your next amazing trip. Give it a moment!",
  },
  {
    emoji: '🎈',
    title: "Our balloons floated away!",
    message: "We're fetching them back. Your trip plans are safe, promise!",
  },
  {
    emoji: '🐢',
    title: "Slow and steady wins the race!",
    message: "Our servers are moving at turtle speed today. They'll catch up soon!",
  },
];

const DelightfulError: React.FC<DelightfulErrorProps> = ({ onRetry, title, message }) => {
  const randomMessage = delightfulMessages[Math.floor(Math.random() * delightfulMessages.length)];
  const displayTitle = title || randomMessage.title;
  const displayMessage = message || randomMessage.message;
  const emoji = randomMessage.emoji;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
      <div className="text-8xl mb-6 animate-bounce">{emoji}</div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
        {displayTitle}
      </h2>
      
      <p className="text-gray-600 text-center mb-8 max-w-md">
        {displayMessage}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Try Again
          </button>
        )}
        
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>Check your internet connection</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          💡 Tip: Sometimes a quick refresh does the trick!
        </p>
      </div>
    </div>
  );
};

export default DelightfulError;
