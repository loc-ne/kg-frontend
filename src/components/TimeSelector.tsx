'use client';

import React, { useState } from 'react';

// Interfaces
interface TimeCategory {
  name: string;
  times: string[];
  hasInfo?: boolean;
}

interface TimeSelectorProps {
  initialTime?: string;
  initialCategory?: string;
  onTimeSelect?: (time: string, category: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// TimeSelector Component
const TimeSelector: React.FC<TimeSelectorProps> = ({
  initialTime = '1min',
  initialCategory = 'Bullet',
  onTimeSelect,
  disabled = false,
  size = 'medium',
  className = '',
}) => {
  // State
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Time Categories Configuration
  const timeCategories: TimeCategory[] = [
    { name: 'Bullet', times: ['1 + 0', '1 + 1', '2 + 1'] },
    { name: 'Blitz', times: ['3 + 0', '3 + 2', '5 + 0'] },
    { name: 'Rapid', times: ['10 + 0', '10 + 5', '15 + 10'] },
    { name: 'Classical', times: ['30 + 0', '30 + 20'] },
  ];

  // Size Variants Configuration
  const sizeVariants = {
    small: {
      header: 'py-2 px-3 text-sm',
      container: 'p-4',
      button: 'py-2 px-2 text-xs',
      title: 'text-xs',
    },
    medium: {
      header: 'py-4 px-4 text-sm',
      container: 'p-6',
      button: 'py-3 px-3 text-sm',
      title: 'text-sm',
    },
    large: {
      header: 'py-5 px-5 text-base',
      container: 'p-8',
      button: 'py-4 px-4 text-base',
      title: 'text-base',
    },
  };

  // Handlers
  const handleTimeSelect = (time: string, category: string) => {
    setSelectedTime(time);
    setSelectedCategory(category);
    onTimeSelect?.(time, category);
  };

  const formatTimeDisplay = (time: string): string => {
    const displayMapping: Record<string, string> = {
      '1min': '1 min',
      '1+1': '1+1',
      '2+1': '2+1',
      '3min': '3 min',
      '3+2': '3+2',
      '5min': '5 min',
      '10min': '10 min',
      '15+10': '15+10',
      '30min': '30 min',
    };
    return displayMapping[time] || time;
  };

  // Computed Values
  const variant = sizeVariants[size];

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <button
        type="button"
        className={`
          w-full text-gray-100 text-center ${variant.header} 
          rounded-xl font-semibold flex items-center justify-between gap-3 
          transition-colors duration-200 shadow-lg mb-6 border 
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          backgroundColor: '#2C2A28',
          borderColor: '#4A4846',
        }}
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <span className={variant.title}>
            {formatTimeDisplay(selectedTime)}{' '}
            <span className="text-gray-400">({selectedCategory})</span>
          </span>
        </div>
        <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Time Options */}
      {isExpanded && !disabled && (
        <div
          className={`space-y-6 rounded-xl ${variant.container} border`}
          style={{
            backgroundColor: '#2C2A28',
            borderColor: '#4A4846',
          }}
        >
          {timeCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              {/* Category Header */}
              <div
                className="flex items-center gap-3 pb-2 border-b"
                style={{ borderColor: '#4A4846' }}
              >
                <span className={`text-gray-100 font-semibold ${variant.title}`}>
                  {category.name}
                </span>
                {category.hasInfo && (
                  <span
                    className="text-gray-500 text-xs cursor-help"
                    title="Additional information about time control"
                  />
                )}
              </div>

              {/* Time Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {category.times.map((time, timeIndex) => {
                  const isSelected =
                    selectedTime === time && selectedCategory === category.name;
                  return (
                    <button
                      key={timeIndex}
                      className={`
                        ${variant.button} rounded-lg font-medium 
                        transition-all duration-200 border 
                        ${
                          isSelected
                            ? 'bg-green-600 text-white shadow-lg transform scale-105 border-green-500'
                            : 'text-gray-200 hover:shadow-md'
                        }
                      `}
                      style={{
                        backgroundColor: isSelected ? undefined : '#3A3735',
                        borderColor: isSelected ? undefined : '#4A4846',
                      }}
                      onClick={() => handleTimeSelect(time, category.name)}
                      disabled={disabled}
                    >
                      {formatTimeDisplay(time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeSelector;