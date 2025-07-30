import React from 'react';

interface PieceProps {
  type: 'knight' | 'rook' | 'bishop' | 'queen' | 'king' | 'pawn';
  color: 'white' | 'black';
}

const Piece = ({ type, color }: PieceProps) => {
  const getImagePath = () => {
    const colorPrefix = color === 'white' ? 'w' : 'b';
    const typeMap = {
      king: 'k',
      queen: 'q', 
      rook: 'r',
      bishop: 'b',
      knight: 'n',
      pawn: 'p'
    };
    
    return `/assets/${colorPrefix}${typeMap[type]}.png`; 
  };

  const getAltText = () => {
    const colorName = color === 'white' ? 'White' : 'Black';
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
    return `${colorName} ${typeName}`;
  };


  return (
    <img 
      src={getImagePath()}
      alt={getAltText()}
      className="w-20 h-20 select-none"
      draggable={false}
    />
  );
};

export default Piece;