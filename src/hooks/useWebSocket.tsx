import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../game/types';
import { ChessGameState } from '../game/GameState';

interface UseWebSocketProps {
  gameId: string;
  playerColor: 'white' | 'black';
  onOpponentMove?: (from: Position, to: Position) => void;
  onGameUpdate?: (gameState: ChessGameState) => void;
  onTurnChange?: (turn: 'white' | 'black') => void;
  onGameEnd?: (result: any) => void;
}

export const useWebSocket = ({ 
  gameId, 
  playerColor,
  onOpponentMove, 
  onGameUpdate,
  onTurnChange,
  onGameEnd 
}: UseWebSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white');
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<ChessGameState | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position; timestamp: number } | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.emit('joinGame', { gameId });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from server');
    });
    
    newSocket.on('gameUpdate', (data: any) => {
      console.log('🔄 Game update received:', data);
      if (data.currentTurn) {
        setCurrentTurn(data.currentTurn);
        onTurnChange?.(data.currentTurn);
      }
      if (data.gameState) {
        setGameState(data.gameState);
        onGameUpdate?.(data.gameState);
      }
    });

    newSocket.on('moveUpdate', (data: any) => {
      console.log('♟️ Move update received:', data);
      
      // Update turn
      if (data.currentTurn) {
        setCurrentTurn(data.currentTurn);
        onTurnChange?.(data.currentTurn);
      }

      // Update last move
      if (data.move) {
        setLastMove({
          from: data.move.from,
          to: data.move.to,
          timestamp: data.timestamp
        });
      }

      // Handle opponent moves
      if (data.playerColor !== playerColor) {
        onOpponentMove?.(data.move.from, data.move.to);
      }
    });

    newSocket.on('moveRejected', (data: any) => {
      console.error('❌ Move rejected:', data.reason);
      // Revert optimistic updates if needed
    });

    newSocket.on('gameEnd', (data: any) => {
      console.log('🏁 Game ended:', data);
      onGameEnd?.(data);
    });

    newSocket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [gameId, playerColor, onOpponentMove, onGameUpdate, onTurnChange, onGameEnd]);

  const sendMove = useCallback((from: Position, to: Position) => {
    if (socket && isConnected) {
      console.log('📤 Sending move:', { from, to });
      socket.emit('makeMove', {
        gameId,
        move: { from, to },
        playerColor,
        timestamp: Date.now()
      });
    }
  }, [socket, isConnected, gameId, playerColor]);

  const resign = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('resign', { gameId });
    }
  }, [socket, isConnected, gameId]);

  const offerDraw = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('offerDraw', { gameId });
    }
  }, [socket, isConnected, gameId]);

  return {
    socket,
    currentTurn,
    isConnected,
    gameState,
    lastMove,
    sendMove,
    resign,
    offerDraw
  };
};