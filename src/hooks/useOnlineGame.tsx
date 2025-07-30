import React from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from '../game/types';

interface GameInfo {
  roomId: string;
  playerColor: 'white' | 'black';
  opponent: { playerId: string };
}

interface UseOnlineGameProps {
  gameMode: string;
  onOpponentMove?: (from: Position, to: Position) => void;
}

export const useOnlineGame = ({ gameMode, onOpponentMove }: UseOnlineGameProps) => {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [gameInfo, setGameInfo] = React.useState<GameInfo | null>(null);
  const [currentTurn, setCurrentTurn] = React.useState<'white' | 'black'>('white');

  // ✅ Helper functions
  const parseSquareNotation = React.useCallback((notation: string): Position | null => {
    if (notation.length !== 2) return null;
    const col = notation.charCodeAt(0) - 97;
    const row = 8 - parseInt(notation[1]);

    if (col >= 0 && col < 8 && row >= 0 && row < 8) {
      return { row, col };
    }
    return null;
  }, []);

  const positionToSquareNotation = React.useCallback((pos: Position): string => {
    const file = String.fromCharCode(97 + pos.col);
    const rank = String(8 - pos.row);
    return file + rank;
  }, []);

  // ✅ Socket connection logic
  React.useEffect(() => {
    if (gameMode === 'online') {
      const newSocket = io('http://localhost:3000');
      setSocket(newSocket);

      newSocket.on('game-start', (data) => {
        console.log('🎮 Game started:', data);
        setGameInfo({
          roomId: data.roomId,
          playerColor: data.playerColor,
          opponent: data.opponent
        });
        setCurrentTurn('white');
      });

      newSocket.on('opponent-move', (moveData) => {
        console.log('👥 Opponent move:', moveData);
        const from = parseSquareNotation(moveData.from);
        const to = parseSquareNotation(moveData.to);

        if (from && to && onOpponentMove) {
          onOpponentMove(from, to);
          setCurrentTurn(moveData.nextTurn || (moveData.playerColor === 'white' ? 'black' : 'white'));
        }
      });

      newSocket.on('move-confirmed', (data) => {
        console.log('✅ Move confirmed:', data);
        if (data.nextTurn) {
          setCurrentTurn(data.nextTurn);
        }
      });

      newSocket.on('move-error', (error) => {
        console.error('❌ Move error:', error);
        alert(error.message);
      });

      return () => {
        console.log('🔌 Disconnecting socket...');
        newSocket.close();
      };
    }
  }, [gameMode, onOpponentMove, parseSquareNotation]);

  const sendMove = React.useCallback((from: Position, to: Position, piece: string) => {
    if (socket && gameInfo) {
      const moveData = {
        roomId: gameInfo.roomId,
        from: positionToSquareNotation(from),
        to: positionToSquareNotation(to),
        piece,
        playerColor: gameInfo.playerColor,
        moveNotation: `${piece}${positionToSquareNotation(from)}-${positionToSquareNotation(to)}`
      };

      console.log('📤 Sending move:', moveData);
      socket.emit('chess-move', moveData);
    }
  }, [socket, gameInfo, positionToSquareNotation]);

  return { 
    socket, 
    gameInfo, 
    currentTurn, 
    setCurrentTurn,
    sendMove 
  };
};