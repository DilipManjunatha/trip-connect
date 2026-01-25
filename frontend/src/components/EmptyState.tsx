import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  examples?: string[];
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
  examples,
}) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      
      {examples && examples.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-md w-full">
          <p className="text-sm font-medium text-blue-900 mb-2">💡 Example use cases:</p>
          <ul className="space-y-1">
            {examples.map((example, index) => (
              <li key={index} className="text-sm text-blue-700">
                • {example}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
