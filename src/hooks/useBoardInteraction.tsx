import React from 'react';
import { Position } from '../game/types';
import { ChessGameState } from '../game/GameState';
import { BoardManager } from '../game/Board.ts';

interface UseBoardInteractionProps {
  gameState: ChessGameState;
  playerColor: 'white' | 'black';
  gameMode: string;
  currentTurn: 'white' | 'black';
  getValidMoves: (position: Position) => Position[];
  onMove?: (from: Position, to: Position) => void;
  onPremove?: (from: Position, to: Position) => void;
}

export const useBoardInteraction = ({
  gameState,
  playerColor,
  gameMode,
  currentTurn,
  getValidMoves,
  onMove,
  onPremove
}: UseBoardInteractionProps) => {
  const [selectedSquare, setSelectedSquare] = React.useState<Position | null>(null);
  const [validMoves, setValidMoves] = React.useState<Position[]>([]);

  // ✅ Copy từ code cũ - canInteract logic
  const canInteract = React.useMemo(() => {
    switch (gameMode) {
      case 'local':
        return true;
      case 'online':
      case 'ai':
        return true; // Can always interact (for premoves)
      default:
        return playerColor === gameState.activeColor;
    }
  }, [gameMode, playerColor, gameState.activeColor]);

  // ✅ Copy từ code cũ - handleSquareClick (NO perspective conversion)
  const handleSquareClick = React.useCallback((row: number, col: number) => {
    if (!canInteract) return;
    const clickedPosition = { row, col };

    // Early returns for performance
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (selectedSquare && validMoves.some(move => move.row === row && move.col === col)) {
      if (playerColor === currentTurn) {
        // Normal move - it's player's turn
        onMove?.(selectedSquare, clickedPosition);
      } else {
        // Premove - not player's turn
        console.log('🔮 Adding premove:', { from: selectedSquare, to: clickedPosition });
        onPremove?.(selectedSquare, clickedPosition);
      }
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // ✅ Copy từ code cũ - piece selection logic
    const piece = BoardManager.getPieceAt(gameState.bitboards, clickedPosition);
    const canSelectPiece = gameMode === 'local' ?
      piece?.color === gameState.activeColor : // Local: only current turn pieces
      piece?.color === playerColor;           // Online: only player's pieces

    if (piece && canSelectPiece) {
      setSelectedSquare(clickedPosition);
      const moves = getValidMoves(clickedPosition);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [
    selectedSquare,
    validMoves,
    gameState.bitboards,
    gameState.activeColor,
    getValidMoves,
    canInteract,
    playerColor,
    currentTurn,
    gameMode,
    onMove,
    onPremove
  ]);

  // ✅ Helper functions
  const isSquareSelected = React.useCallback((row: number, col: number) => {
    return selectedSquare !== null && selectedSquare.row === row && selectedSquare.col === col;
  }, [selectedSquare]);

  const isSquareValidMove = React.useCallback((row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  }, [validMoves]);

  return {
    selectedSquare,
    validMoves,
    handleSquareClick,
    isSquareSelected,
    isSquareValidMove,
    setSelectedSquare,
    setValidMoves
  };
};