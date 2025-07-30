import React from 'react';
import { Position } from '../game/types';
import { ChessGameState } from '../game/GameState.ts';
import { BoardManager } from '../game/Board.ts';

interface UsePremovesProps {
  playerColor: 'white' | 'black';
  currentTurn: 'white' | 'black';
  gameState: ChessGameState;
  onExecuteMove: (from: Position, to: Position) => void;
}

export const usePremoves = ({
  playerColor,
  currentTurn,
  gameState,
  onExecuteMove
}: UsePremovesProps) => {
  const [premoveQueue, setPremoveQueue] = React.useState<[Position, Position][]>([]);

  const addPremove = React.useCallback((from: Position, to: Position) => {
    setPremoveQueue(prev => [...prev, [from, to]]);
  }, []);

  const clearPremoves = React.useCallback(() => {
    setPremoveQueue([]);
  }, []);

  // Execute premoves when it becomes player's turn
  React.useEffect(() => {
    if (playerColor === currentTurn && premoveQueue.length > 0) {
      console.log('🎯 Executing premoves:', premoveQueue);

      const [from, to] = premoveQueue[0];

      // Validate premove is still legal
      const piece = BoardManager.getPieceAt(gameState.bitboards, from);

      if (!piece || piece.color !== playerColor) {
        console.log('❌ Premove invalid - piece moved');
        setPremoveQueue([]);
        return;
      }

      const currentValidMoves = BoardManager.generateMovesForPiece(
        gameState.bitboards,
        gameState,
        from
      );

      const isMoveValid = currentValidMoves.some(move =>
        move.row === to.row && move.col === to.col
      );

      if (isMoveValid) {
        console.log('✅ Executing premove:', { from, to });
        setPremoveQueue(prev => prev.slice(1));
        
        setTimeout(() => {
          onExecuteMove(from, to);
        }, 150);
      } else {
        console.log('❌ Premove no longer valid');
        setPremoveQueue([]);
      }
    }
  }, [playerColor, currentTurn, premoveQueue, gameState.bitboards, gameState, onExecuteMove]);

  return {
    premoveQueue,
    addPremove,
    clearPremoves
  };
};