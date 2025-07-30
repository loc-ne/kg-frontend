import React from 'react';

interface SquareProps {
  isLight: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode; 
  isSelected: boolean;
  isValidMove: boolean;
}

const Square = ({ isLight, onClick, className = '', children, isSelected, isValidMove }: SquareProps) => {
  const baseClasses = `
    w-20 h-20 
    flex items-center justify-center 
    cursor-pointer 
    transition-all duration-200 
    hover:brightness-110
    ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'}
    ${isSelected ? 'ring-4 ring-yellow-400 ring-inset' : ''}
    ${isValidMove ? 'ring-4 ring-green-400 ring-inset' : ''}
  `;
  
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <div 
      className={combinedClasses}
      onClick={onClick}
    >
      {children}
      {isValidMove && !children && (
        <div className="w-6 h-6 bg-green-600 rounded-full opacity-70" />
      )}
    </div>
  );
};

export default Square;