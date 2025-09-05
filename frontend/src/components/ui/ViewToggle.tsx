import React from 'react';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  const baseClasses = 'p-2 rounded-md transition-colors';
  const activeClasses = 'bg-blue-600 text-white';
  const inactiveClasses = 'bg-gray-200 text-gray-600 hover:bg-gray-300';

  return (
    <div className="flex items-center space-x-1 bg-gray-200 rounded-md p-1">
      <button 
        onClick={() => onViewModeChange('grid')}
        className={`${baseClasses} ${viewMode === 'grid' ? activeClasses : inactiveClasses}`}
        aria-label="Grid View"
      >
        <span className="i-carbon-grid"></span>
      </button>
      <button 
        onClick={() => onViewModeChange('list')}
        className={`${baseClasses} ${viewMode === 'list' ? activeClasses : inactiveClasses}`}
        aria-label="List View"
      >
        <span className="i-carbon-list"></span>
      </button>
    </div>
  );
};

export { ViewToggle };

