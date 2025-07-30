'use client';

import React from 'react';
import Board from '@/components/Board';
import Clock from '@/components/Clock';
import PlayerInfo from '@/components/PlayerInfo';
import GameResultDialog from '@/components/GameResult';
import ReplayControls from '@/components/ReplayControls';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ClientGameState, GameStateManager } from '../../../game/GameState';
import { STARTING_FEN } from '../../../game/Fen';

// Types
interface GameResultData {
  result: string;
  reason: string;
}
interface PlayerStatusData {
  PlayerID: number;
  Online: boolean;
}
interface ErrorData {
  Message: string;
}
interface PlayerData {
  userId: number;
  rating: number;
  username: string;
  color: 'white' | 'black';
  role?: string;
}
interface MoveHistoryItem {
  moveNumber: number;
  white: string;
  black?: string;
}
interface MoveHistoryProps {
  moves: MoveHistoryItem[];
  indexMoveHistory: number;
  setIndexMoveHistory: React.Dispatch<React.SetStateAction<number>>;
  bitboardStates: ClientGameState[];
  setGameState: (state: ClientGameState) => void;
}

// Helpers
function convertBitboardsToBigInt(bitboards: any) {
  const keys = [
    'WhitePawns', 'WhiteRooks', 'WhiteKnights', 'WhiteBishops', 'WhiteQueens', 'WhiteKing',
    'BlackPawns', 'BlackRooks', 'BlackKnights', 'BlackBishops', 'BlackQueens', 'BlackKing'
  ];
  const result: any = {};
  for (const key of keys) {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    result[camelKey] = bitboards && bitboards[key] !== undefined
      ? BigInt(bitboards[key])
      : 0n;
  }
  return result;
}
function convertDbMovesToMoveHistory(moves: string[]): MoveHistoryItem[] {
  const result: MoveHistoryItem[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    result.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || undefined,
    });
  }
  return result;
}
function convertServerGameState(serverGameState: any): ClientGameState {
  return {
    currentFen: serverGameState.currentFen,
    bitboards: convertBitboardsToBigInt(serverGameState.bitboards),
    activeColor: serverGameState.activeColor,
    castlingRights: serverGameState.castlingRights,
    enPassantSquare: serverGameState.enPassantSquare,
  };
}

// UI Components
const GameInfo: React.FC<{ gameType: string; timeControl: string }> = ({ gameType, timeControl }) => (
  <div className="bg-white-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="text-lg font-bold text-blue-800 mb-2">{gameType} Game</div>
    <div className="text-sm text-blue-600 space-y-1">
      <div>Time Control: {timeControl}</div>
    </div>
  </div>
);

const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  indexMoveHistory,
  setIndexMoveHistory,
  bitboardStates,
  setGameState
}) => {
  const handleReplayStart = () => {
    setIndexMoveHistory(0);
    setGameState(bitboardStates[0]);
  };


  const handleReplayPrevious = () => {
    setIndexMoveHistory(prev => {
      const newIndex = Math.max(prev - 1, 0);
      setGameState(bitboardStates[newIndex]);
      return newIndex;
    });
  };

  const handleReplayNext = () => {
    setIndexMoveHistory(prev => {
      const newIndex = Math.min(prev + 1, bitboardStates.length - 1);
      setGameState(bitboardStates[newIndex]);
      return newIndex;
    });
  };

  const handleReplayEnd = () => {
    const lastIndex = bitboardStates.length - 1;
    setIndexMoveHistory(lastIndex);
    setGameState(bitboardStates[lastIndex]);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg h-96 flex flex-col">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 rounded-t-lg">
        <h3 className="font-semibold text-gray-800">Move History</h3>
      </div>
<div className="flex-1 p-4 overflow-y-auto">
  <div className="space-y-1">
    {(!moves || moves.length === 0) ? (
      <div className="text-gray-500 text-sm text-center py-4">
        No moves yet
      </div>
    ) : (
      moves.map((move, index) => {
        const whiteMoveIndex = index * 2 +1;
        const blackMoveIndex = index * 2 + 2;
        return (
          <div
            key={index}
            className="grid grid-cols-3 text-sm p-1 rounded"
          >
            <div className="text-gray-500 font-mono ">{move.moveNumber}.</div>
            <div
              className={`font-mono text-gray-800 rounded  mr-2
                ${ indexMoveHistory != 0 && indexMoveHistory === whiteMoveIndex  ? 'bg-blue-400 font-bold shadow border border-yellow-600' : ''}
              `}
            >
              {move.white}
            </div>
            <div
              className={`font-mono text-gray-800 rounded 
                ${indexMoveHistory != 0 && indexMoveHistory === blackMoveIndex ? 'bg-blue-400 font-bold shadow border border-yellow-600' : ''}
              `}
            >
              {move.black || ''}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>
      <div className="flex justify-center w-full">
        <div className="bg-white border border-gray-300 shadow px-4 py-2 mt-2 w-full flex justify-center">
          <ReplayControls
            onStart={handleReplayStart}
            onPrevious={handleReplayPrevious}
            onNext={handleReplayNext}
            onEnd={handleReplayEnd}
          />
        </div>
      </div>
    </div>
  );
}

const GamePage: React.FC = () => {
  const params = useParams();
  const gameId = params?.gameId as string;
  const { user } = useAuth();

  // State
  const [players, setPlayers] = React.useState<PlayerData[]>([]);
  const [moveHistory, setMoveHistory] = React.useState<MoveHistoryItem[]>([]);
  const [gameState, setGameState] = React.useState<ClientGameState | null>(null);
  const [playerStatus, setPlayerStatus] = React.useState<Record<number, boolean>>({});
  const [gameResult, setGameResult] = React.useState<GameResultData | null>(null);
  const [showDialog, setShowDialog] = React.useState(false);
  const [gameStatus, setGameStatus] = React.useState<'playing' | 'end'>('playing');
  const [timeControl, setTimeControl] = React.useState<{ type: string; initialTime: number; increment: number } | null>(null);
  const [playerTimes, setPlayerTimes] = React.useState<{ white: number; black: number }>({ white: 0, black: 0 });
  const [error, setError] = React.useState<string | null>(null);
  const [lastFen, setLastFen] = React.useState<string>("");
  const [bitboardStates, setBitboardStates] = React.useState<ClientGameState[]>([]);
  const [indexMoveHistory, setIndexMoveHistory] = React.useState<number>(0);

  // Fetch game info
  React.useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const response = await fetch(`http://localhost:3003/api/v1/games/live/${gameId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (response.ok) {
          setPlayers(result.players);
          setGameState(convertServerGameState(result.gameState));
          setMoveHistory(
            Array.isArray(result.gameState.moveHistory)
              ? result.gameState.moveHistory
              : []
          );
          setTimeControl(result.timeControl);
          setPlayerTimes({ white: result.whiteTimeLeft * 1000, black: result.blackTimeLeft * 1000 });
        } else {
          if (response.status === 404 && result.error === "Room not found") {
            const dbRes = await fetch(`http://localhost:3003/api/v1/games/db/${gameId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            const dbResult = await dbRes.json();
            if (dbRes.ok) {
              // Players
              const white = dbResult.Players.White;
              const black = dbResult.Players.Black;
              setPlayers([
                { userId: white.UserID, rating: white.Elo, username: white.Username, color: 'white' },
                { userId: black.UserID, rating: black.Elo, username: black.Username, color: 'black' }
              ]);
              // Move history
              setMoveHistory(
                Array.isArray(dbResult.Moves)
                  ? convertDbMovesToMoveHistory(dbResult.Moves)
                  : []
              );
              const [initialTime, increment] = dbResult.TimeControl.split('+').map(Number);
              setTimeControl({ type: dbResult.GameType, initialTime, increment });
              setGameResult({ result: dbResult.Result, reason: '' });
              setLastFen(dbResult.LastFen);
              setPlayerTimes({ white: dbResult.WhiteTimeLeft * 1000, black: dbResult.BlackTimeLeft * 1000 });
              setGameStatus('end');
              setBitboardStates(GameStateManager.getBitboardStatesFromMoves(dbResult.Moves));
              setIndexMoveHistory(dbResult.Moves.length - 1)
            } else {
              setError(dbResult.error || 'Game not found');
            }
          } else {
            setError(result.error || 'Failed to load game');
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
      }
    };
    if (gameId) fetchGameInfo();
  }, [gameId]);

  WebSocket
  const ws = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:3003/ws?roomID=${gameId}&clientID=${user?.id}`);
    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'game_update': {
            setGameState(convertServerGameState(msg.data.gameState));
            setMoveHistory(
              Array.isArray(msg.data.gameState.moveHistory)
                ? msg.data.gameState.moveHistory
                : []
            );
            setPlayerTimes({
              white: msg.data.whiteTimeLeft * 1000,
              black: msg.data.blackTimeLeft * 1000
            });
            break;
          }
          case 'player_status': {
            const data: PlayerStatusData = msg.data;
            setPlayerStatus((prev) => ({
              ...prev,
              [data.PlayerID]: data.Online,
            }));
            break;
          }
          case 'game_result': {
            const data: GameResultData = msg.data;
            setGameResult(data);
            setGameStatus('end');
            break;
          }
          case 'error': {
            const data: ErrorData = msg.data;
            setError(data.Message || 'Unknown error');
            break;
          }
          default:
        }
      } catch (e: any) {
        console.log('Error parsing message: ' + e.message);
      }
    };

    ws.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      //setError('Cannot connect to game server. Please check your connection.');
    };

    ws.current.onclose = () => {
      // Handle connection close if needed
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [gameId, user?.id]);

  React.useEffect(() => {
    if (gameResult) {
      setShowDialog(true);
      setGameStatus("end");
    }
  }, [gameResult]);

  // Get player info
  const myPlayer = user
    ? players.find((p: any) => String(p.userId) === String(user.id))
    : null;
  const opponentPlayer = user
    ? players.find((p: any) => String(p.userId) !== String(user.id))
    : null;

  // Determine player's color
  const myColor = myPlayer?.color || 'white';

  // Format time control for UI
  const timeControlStr = timeControl
    ? `${timeControl.initialTime}+${timeControl.increment}`
    : '';

  // Helper format time for Clock
  const formatTimeForClock = (timeInMs: number) => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    return { minutes, seconds };
  };

  // Dummy handleMove
  const handleMove = (from: any, to: any) => {
    const move = {
      type: 'move',
      data: {
        fromRow: from.row,
        fromCol: from.col,
        toRow: to.row,
        toCol: to.col,
      }
    };
    ws.current?.send(JSON.stringify(move));
  };

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  // Loading state
  if (!players.length) {
    return <div className="p-8 text-gray-600">Loading game...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Game Info */}
          <div className="col-span-3">
            <GameInfo
              gameType={timeControl?.type?.toUpperCase() || 'RAPID'}
              timeControl={timeControlStr}
            />

            {/* Player Info Block */}
            <div className="bg-white border border-gray-300 rounded-lg p-3 mt-4">
              {opponentPlayer && (
                <div className="mb-4">
                  <PlayerInfo
                    username={opponentPlayer.username}
                    elo={opponentPlayer.rating}
                    isConnected={playerStatus[opponentPlayer.userId] ?? true}
                    isCurrentPlayer={gameState?.activeColor === opponentPlayer.color}
                  />
                </div>
              )}
              {myPlayer && (
                <div>
                  <PlayerInfo
                    username={myPlayer.username}
                    elo={myPlayer.rating}
                    isConnected={playerStatus[myPlayer.userId] ?? true}
                    isCurrentPlayer={gameState?.activeColor === myPlayer.color}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Center Panel - Chess Board */}
          <div className="col-span-6">
            <div className="flex flex-col items-center justify-center min-h-[600px]">
              {gameResult && <GameResultDialog
                isOpen={showDialog}
                gameResult={gameResult}
                onRematch={() => window.location.reload()}
                onNewGame={() => window.location.reload()}
                onClose={() => setShowDialog(false)}
              />
              }

              {/* Chess Board */}
              <div className="relative">
                {gameState && gameStatus === 'playing' ? (
                  <Board
                    playerColor={myColor}
                    gameState={gameState}
                    onMove={handleMove}
                  />
                ) : null}


                {gameStatus == 'end' && myPlayer ? (
                  <Board
                    playerColor={myPlayer.color}
                    gameState={gameState}
                    initialFen={lastFen}
                  />
                ) : null}

              </div>
            </div>
          </div>

          {/* Right Panel - Clocks and Move History */}
          <div className="col-span-3 flex flex-col justify-center">
            <div className="space-y-4">
              {/* Opponent Clock (Top) */}
              {opponentPlayer && timeControl && (
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-2">
                    {opponentPlayer.username}'s Time
                  </div>
                  <Clock
                    initialMinutes={formatTimeForClock(playerTimes[opponentPlayer.color as 'white' | 'black']).minutes}
                    initialSeconds={formatTimeForClock(playerTimes[opponentPlayer.color as 'white' | 'black']).seconds}
                    increment={timeControl.increment}
                    isActive={gameStatus === 'playing' && gameState?.activeColor === opponentPlayer.color}
                    onTimeUp={() => console.log(`${opponentPlayer.color} time up!`)}
                  />
                </div>
              )}

              {/* Move History (Middle) */}
              <MoveHistory
                moves={moveHistory}
                indexMoveHistory={indexMoveHistory}
                setIndexMoveHistory={setIndexMoveHistory}
                bitboardStates={bitboardStates}
                setGameState={setGameState}
              />


              {/* My Clock (Bottom) */}
              {myPlayer && timeControl && (
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-2">
                    {myPlayer.username}'s Time
                  </div>
                  <Clock
                    initialMinutes={formatTimeForClock(playerTimes[myPlayer.color as 'white' | 'black']).minutes}
                    initialSeconds={formatTimeForClock(playerTimes[myPlayer.color as 'white' | 'black']).seconds}
                    increment={timeControl.increment}
                    isActive={gameStatus === 'playing' && gameState?.activeColor === myPlayer.color}
                    onTimeUp={() => console.log(`${myPlayer.color} time up!`)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;