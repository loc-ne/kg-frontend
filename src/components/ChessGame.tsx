import React, { useState, useEffect } from 'react';
import { ClientMessage, ServerMessage } from './messages';
import Board from './Board';
import { Position } from '../game/types';

interface ChessGameProps {
  socket: WebSocket;
  playerId: string;
  gameId: string;
  playerColor: 'white' | 'black';
}

const ChessGame: React.FC<ChessGameProps> = ({ 
  socket, 
  playerId, 
  gameId, 
  playerColor 
}) => {
  const [gameState, setGameState] = useState({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    activeColor: 'white' as 'white' | 'black',
    status: 'playing' as string,
    isCheck: false,
    moves: [] as string[]
  });
  
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position; san?: string } | null>(null);
  
  // ✅ Force Board re-render key when FEN changes
  const [boardKey, setBoardKey] = useState(0);

  // ✅ WebSocket message handling
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);
        console.log('🎮 Game received:', data);
        
        switch (data.type) {
          case 'GAME_STATE':
            console.log('📋 Updating game state:', data);
            setGameState({
              fen: data.fen,
              activeColor: data.activeColor,
              status: data.status,
              isCheck: data.isCheck || false,
              moves: data.moves || []
            });
            setBoardKey(prev => prev + 1); // ✅ Force Board re-render
            setMessage(`Game started! You are ${playerColor}`);
            break;
            
          case 'MOVE_MADE':
            console.log('♟️ Move made:', data);
            
            // ✅ Update game state with server data
            setGameState(prev => ({
              ...prev,
              fen: data.fen,                    // ✅ Use server FEN
              activeColor: data.activeColor,    // ✅ Use server activeColor  
              isCheck: data.isCheck || false,
              moves: [...prev.moves, data.move.san]
            }));
            
            setBoardKey(prev => prev + 1); // ✅ Force Board re-render with new FEN
            
            // ✅ Convert string positions to Position objects for last move highlight
            const fromSquare = convertAlgebraicToPosition(data.move.from);
            const toSquare = convertAlgebraicToPosition(data.move.to);
            
            if (fromSquare && toSquare) {
              setLastMove({ 
                from: fromSquare, 
                to: toSquare,
                san: data.move.san
              });
            }
            
            // ✅ Better move message
            const moveBy = data.byPlayer === playerId ? 'You' : 'Opponent';
            setMessage(`${moveBy} played: ${data.move.san} (${data.move.from} → ${data.move.to})`);
            break;
            
          case 'INVALID_MOVE':
            setMessage(`❌ Invalid move: ${data.reason}`);
            // ✅ Clear any pending visual feedback
            break;
            
          case 'GAME_OVER':
            console.log('🏁 Game over:', data);
            setGameState(prev => ({ ...prev, status: 'finished' }));
            
            // ✅ Better game over message
            let gameOverMsg = '';
            if (data.result === 'checkmate') {
              gameOverMsg = `🏆 Checkmate! ${data.winner} wins!`;
            } else if (data.result === 'stalemate') {
              gameOverMsg = '🤝 Game ended in stalemate!';
            } else if (data.result === 'resignation') {
              const winner = data.winner === playerColor ? 'You' : 'Your opponent';
              gameOverMsg = `🏳️ Game over! ${winner} won by resignation`;
            } else if (data.result === 'disconnect') {
              gameOverMsg = '📡 Game ended due to disconnection';
            } else {
              gameOverMsg = `🏁 Game over! Result: ${data.result}`;
            }
            
            setMessage(gameOverMsg);
            break;
            
          case 'OPPONENT_DISCONNECTED':
            setMessage('📡 Your opponent has disconnected. Waiting...');
            break;
            
          case 'ERROR':
            setMessage(`❌ Error: ${data.message}`);
            break;
            
          default:
            console.log('❓ Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Failed to parse message:', error);
        setMessage('Error parsing server message');
      }
    };

    const handleSocketClose = () => {
      setIsConnected(false);
      setMessage('📡 Disconnected from server');
    };

    const handleSocketError = () => {
      setIsConnected(false);
      setMessage('❌ Connection error');
    };

    socket.addEventListener('message', handleMessage);
    socket.addEventListener('close', handleSocketClose);
    socket.addEventListener('error', handleSocketError);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('close', handleSocketClose);
      socket.removeEventListener('error', handleSocketError);
    };
  }, [socket, playerColor, playerId]);

  // ✅ Convert algebraic notation (e4) to Position object {row, col}
  const convertAlgebraicToPosition = (algebraic: string): Position | null => {
    if (algebraic.length !== 2) return null;
    
    const file = algebraic[0].toLowerCase();
    const rank = parseInt(algebraic[1]);
    
    if (file < 'a' || file > 'h' || rank < 1 || rank > 8) return null;
    
    return {
      row: 8 - rank,          // Convert rank to row (rank 8 = row 0)
      col: file.charCodeAt(0) - 97  // Convert file to col (a = 0)
    };
  };

  // ✅ Convert Position object to algebraic notation
  const convertPositionToAlgebraic = (position: Position): string => {
    const file = String.fromCharCode(97 + position.col); // 0 = 'a'
    const rank = 8 - position.row;                       // row 0 = rank 8
    return `${file}${rank}`;
  };

  // ✅ Handle moves from Board component
  const handleMove = (from: Position, to: Position) => {
    if (!isConnected) {
      setMessage('📡 Not connected to server');
      return;
    }

    if (gameState.status !== 'playing') {
      setMessage('🚫 Game is not active');
      return;
    }

    if (gameState.activeColor !== playerColor) {
      setMessage("⏳ It's not your turn!");
      return;
    }

    // ✅ Convert positions to algebraic notation for server
    const fromAlgebraic = convertPositionToAlgebraic(from);
    const toAlgebraic = convertPositionToAlgebraic(to);

    const moveMessage: ClientMessage = {
      type: 'MAKE_MOVE',
      gameId,
      playerId,
      move: { from: fromAlgebraic, to: toAlgebraic },
      timestamp: Date.now()
    };
    
    console.log('📤 Sending move:', moveMessage);
    socket.send(JSON.stringify(moveMessage));
    setMessage(`📤 Sending move: ${fromAlgebraic} → ${toAlgebraic}...`);
  };

  // ✅ Handle resignation
  const handleResign = () => {
    if (!isConnected || gameState.status !== 'playing') return;
    
    const confirmResign = window.confirm('Are you sure you want to resign?');
    if (!confirmResign) return;
    
    socket.send(JSON.stringify({
      type: 'RESIGN',
      gameId,
      playerId,
      timestamp: Date.now()
    }));
    
    setMessage('🏳️ Resigning...');
  };

  // ✅ Game status helpers
  const isMyTurn = gameState.activeColor === playerColor;
  const canPlay = isConnected && gameState.status === 'playing';

  // ✅ Status indicator color
  const getStatusColor = () => {
    if (!isConnected) return '#f44336'; // Red
    if (gameState.status === 'finished') return '#ff9800'; // Orange
    if (isMyTurn) return '#4caf50'; // Green
    return '#2196f3'; // Blue
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '20px',
      maxWidth: '900px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* ✅ Game Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>♟️ Chess Game</h2>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span><strong>You:</strong> {playerColor}</span>
          <span><strong>Turn:</strong> {gameState.activeColor} {isMyTurn ? '(Your turn!)' : ''}</span>
          <span style={{ color: getStatusColor() }}>
            <strong>Status:</strong> {isConnected ? gameState.status : 'disconnected'}
          </span>
          {gameState.isCheck && (
            <span style={{ color: '#f44336', fontWeight: 'bold' }}>
              ⚠️ CHECK!
            </span>
          )}
        </div>
      </div>

      {/* ✅ Status Message */}
      <div style={{
        padding: '12px',
        margin: '0 0 20px 0',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '6px',
        minHeight: '24px',
        fontSize: '14px'
      }}>
        {message || 'Ready to play!'}
      </div>

      {/* ✅ Main Game Layout */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap'
      }}>
        
        {/* ✅ Chess Board - WITH DYNAMIC FEN UPDATE */}
        <div>
          <Board
            key={boardKey}                    // ✅ Force re-render when FEN changes
            playerColor={playerColor}
            gameMode="online"
            initialFen={gameState.fen}        // ✅ Always current FEN
            isInteractive={canPlay && isMyTurn} // ✅ Only interactive on player's turn
            onMove={handleMove}
          />
        </div>

        {/* ✅ Game Info Panel */}
        <div style={{
          minWidth: '250px',
          textAlign: 'left',
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: 0 }}>🎮 Game Info</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Game ID:</strong><br />
            <code style={{ fontSize: '12px' }}>{gameId}</code>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Player ID:</strong><br />
            <code style={{ fontSize: '12px' }}>{playerId}</code>
          </div>
          
          {lastMove && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Last Move:</strong><br />
              <span style={{ fontSize: '14px' }}>
                {lastMove.san || `${convertPositionToAlgebraic(lastMove.from)} → ${convertPositionToAlgebraic(lastMove.to)}`}
              </span>
            </div>
          )}
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Total Moves:</strong> {gameState.moves.length}
          </div>
          
          {/* ✅ Move History */}
          {gameState.moves.length > 0 && (
            <div>
              <strong>Move History:</strong>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                fontSize: '12px',
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}>
                {gameState.moves.map((move, index) => (
                  <div key={index} style={{ 
                    display: 'inline-block', 
                    marginRight: '8px',
                    marginBottom: '4px'
                  }}>
                    {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* ✅ Resign Button */}
          {canPlay && (
            <button
              onClick={handleResign}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%'
              }}
            >
              🏳️ Resign
            </button>
          )}
        </div>
      </div>

      {/* ✅ Connection Status Indicator */}
      <div style={{ 
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        backgroundColor: 'white',
        padding: '5px 10px',
        borderRadius: '15px',
        border: '1px solid #ddd'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#4caf50' : '#f44336'
        }} />
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* ✅ Turn Indicator */}
      {canPlay && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          backgroundColor: isMyTurn ? '#4caf50' : '#2196f3',
          color: 'white',
          borderRadius: '25px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100
        }}>
          {isMyTurn ? '🎯 Your Turn' : `⏳ ${gameState.activeColor}'s Turn`}
          {gameState.isCheck && ' - CHECK!'}
        </div>
      )}

      {/* ✅ Game Over Overlay */}
      {gameState.status === 'finished' && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0 }}>🏁 Game Over</h2>
            <p style={{ fontSize: '18px', margin: '20px 0', lineHeight: 1.5 }}>
              {message}
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center' 
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🔄 Play Again
              </button>
              
              <button
                onClick={() => window.close()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ❌ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessGame;