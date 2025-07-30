const { ChessEngine } = require('../game/Board');
const eventBus = require('./eventBus');

class Room {
  constructor(gameId, timeControl = { type: 'rapid', initialTime: 600000, increment: 5000 }, originalPlayers = []) {
    this.gameId = gameId;

    // ✅ 1. Players management
    this.players = [];
    this.spectators = [];
    this.maxPlayers = 2;
    this.originalPlayers = originalPlayers; // ✅ Track original players from matchmaking

    // ✅ 2. Server Game State
    this.serverGameState = {
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      bitboards: ChessEngine.createBitboardGame(),
      activeColor: 'white',
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
      },
      enPassantSquare: null,
      moveHistory: [],
      fullMoveNumber: 1,
      halfMoveClock: 0,
      positionCounts: new Map([
        ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 1]
      ]),
      materialCount: {
        white: { pawns: 8, knights: 2, bishops: 2, rooks: 2, queens: 1 },
        black: { pawns: 8, knights: 2, bishops: 2, rooks: 2, queens: 1 }
      }
    };


    // ✅ 3. Game metadata
    this.gameStatus = 'waiting';
    this.timeControl = timeControl;
    this.startTime = Date.now();
    this.lastMoveTime = Date.now();

    // ✅ 4. Player time tracking
    this.playerTimes = {
      white: timeControl.initialTime,
      black: timeControl.initialTime
    };

    // ✅ 5. Color assignments (set from matchmaking)
    this.colorAssignments = {}; // Will be set by RoomManager

  }

  // ✅ SOLUTION FOR VẤN ĐỀ 1, 2, 3: Smart user addition
  addUser(ws, userData) {
    const { playerId, username, elo } = userData;

    console.log(`👤 User ${username} (${playerId}) attempting to join room ${this.gameId}`);

    // ✅ Check if user is an original player from matchmaking
    const isOriginalPlayer = this.originalPlayers.includes(playerId);

    if (isOriginalPlayer) {
      console.log(`♟️ ${username} is an original player`);

      // Check if already in room (VẤN ĐỀ 3: reconnection case)
      const existingPlayer = this.getPlayer(playerId);
      if (existingPlayer) {
        if (existingPlayer.isConnected) {
          // Player already connected - possible dual connection
          console.log(`⚠️ Player ${username} already connected`);
          this.sendError(ws, 'ALREADY_CONNECTED', 'You are already connected to this game');
          return false;
        } else {
          // VẤN ĐỀ 3: Reconnection case
          return this.reconnectPlayer(ws, existingPlayer);
        }
      } else {
        // VẤN ĐỀ 1: First time joining as original player
        return this.addAsPlayer(ws, userData);
      }
    } else {
      // VẤN ĐỀ 2: Random user becomes spectator
      console.log(`👀 ${username} joining as spectator`);
      return this.addSpectator(ws, userData);
    }
  }

  // ✅ VẤN ĐỀ 3: Robust reconnection handling
  reconnectPlayer(ws, existingPlayer) {
    console.log(`🔄 Player ${existingPlayer.username} reconnecting to room ${this.gameId}`);

    // Validate reconnection is allowed
    if (this.gameStatus === 'finished') {
      console.log(`🏁 Game finished, ${existingPlayer.username} joining as spectator`);
      return this.addSpectator(ws, {
        playerId: existingPlayer.playerId,
        username: existingPlayer.username,
        elo: existingPlayer.elo
      });
    }

    // Update connection
    existingPlayer.ws = ws;
    existingPlayer.isConnected = true;
    existingPlayer.reconnectTime = Date.now();

    // Send comprehensive reconnection data
    eventBus.emit('PLAYER_RECONNECTED', {
      ws: ws,
      gameId: this.gameId,
      yourColor: existingPlayer.color,
      gameState: this.getClientGameState(),
      role: 'player',
      canMove: this.serverGameState.activeColor === existingPlayer.color && this.gameStatus === 'playing',
      timeLeft: existingPlayer.timeLeft,
      gameStatus: this.gameStatus,
      players: this.players.map(p => ({
        username: p.username,
        elo: p.elo,
        color: p.color,
        isConnected: p.isConnected
      })),
      message: 'Welcome back! You have been reconnected to your game.'
    });

    // Notify other users about reconnection
    this.broadcastToOthers(existingPlayer.playerId, 'PLAYER_RECONNECTED_NOTIFICATION', {
      reconnectedPlayer: {
        username: existingPlayer.username,
        color: existingPlayer.color
      },
      timestamp: Date.now()
    });

    return true;
  }

  // ✅ VẤN ĐỀ 1: Add original player with proper validation
  addAsPlayer(ws, playerData) {
    // Validate room state
    if (this.players.length >= this.maxPlayers) {
      console.log(`❌ Room ${this.gameId} full - converting to spectator`);
      return this.addSpectator(ws, playerData);
    }

    if (!this.originalPlayers.includes(playerData.playerId)) {
      console.log(`❌ ${playerData.username} not an original player - converting to spectator`);
      return this.addSpectator(ws, playerData);
    }

    // Get assigned color from matchmaking
    let assignedColor = this.colorAssignments[playerData.playerId] || playerData.assignedColor;

    // Fallback color assignment if not set
    if (!assignedColor) {
      console.warn('⚠️ No assigned color, using fallback logic');
      const takenColors = this.players.map(p => p.color);
      if (!takenColors.includes('white')) {
        assignedColor = 'white';
      } else if (!takenColors.includes('black')) {
        assignedColor = 'black';
      } else {
        assignedColor = Math.random() < 0.5 ? 'white' : 'black';
      }
    }

    const player = {
      ws: ws,
      playerId: playerData.playerId,
      username: playerData.username,
      elo: playerData.elo,
      color: assignedColor,
      timeLeft: this.timeControl.initialTime,
      isConnected: true,
      joinTime: Date.now(),
      isOriginalPlayer: true
    };

    this.players.push(player);
    console.log(`✅ Original player ${playerData.username} joined as ${assignedColor} in room ${this.gameId}`);

    // Send player data
    ws.send(JSON.stringify({
      type: 'PLAYER_JOINED',
      gameId: this.gameId,
      yourColor: assignedColor,
      gameState: this.getClientGameState(),
      role: 'player',
      canMove: this.serverGameState.activeColor === assignedColor && this.gameStatus === 'playing',
      players: this.players.map(p => ({
        username: p.username,
        elo: p.elo,
        color: p.color,
        isConnected: p.isConnected,
        timeLeft: p.timeLeft || this.playerTimes[p.color]
      })),
      gameStatus: this.gameStatus,

      timeControl: {
        type: this.timeControl.type,           // 'rapid'
        initialTime: this.timeControl.initialTime, // 600000
        increment: this.timeControl.increment      // 5000
      },
      timestamp: Date.now()
    }));

    // Start game if both players joined
    if (this.players.length === this.maxPlayers && this.gameStatus === 'waiting') {
      this.startGame();
    }

    return true;
  }

  // ✅ VẤN ĐỀ 2: Add spectator (for random users)
  addSpectator(ws, userData) {
    const spectator = {
      ws: ws,
      playerId: userData.playerId,
      username: userData.username,
      role: 'spectator',
      isConnected: true,
      joinTime: Date.now()
    };

    this.spectators.push(spectator);
    console.log(`👀 ${userData.username} joined as spectator in room ${this.gameId} (${this.spectators.length} spectators total)`);

    // Send spectator data
    ws.send(JSON.stringify({
      type: 'SPECTATOR_JOINED',
      gameId: this.gameId,
      gameState: this.getClientGameState(),
      role: 'spectator',
      players: this.players.map(p => ({
        username: p.username,
        elo: p.elo,
        color: p.color,
        isConnected: p.isConnected
      })),
      spectatorCount: this.spectators.length,
      gameStatus: this.gameStatus,
      canMove: false,
      timestamp: Date.now()
    }));

    return true;
  }

  // ✅ Start game when both original players joined
  startGame() {
    if (this.players.length !== this.maxPlayers) {
      console.warn(`⚠️ Cannot start game ${this.gameId} - need ${this.maxPlayers} players, have ${this.players.length}`);
      return;
    }

    this.gameStatus = 'playing';
    this.gameStartTime = Date.now();

    console.log(`🎮 Game ${this.gameId} started with players: ${this.players.map(p => `${p.username}(${p.color})`).join(', ')}`);

    // Broadcast game start to all users in room
    this.broadcastToRoom('GAME_STARTED', {
      gameId: this.gameId,
      players: this.players.map(p => ({
        username: p.username,
        elo: p.elo,
        color: p.color
      })),
      gameState: this.getClientGameState(),
      startTime: this.gameStartTime
    });
  }

  // ✅ Set color assignments from matchmaking
  setColorAssignments(assignments) {
    this.colorAssignments = assignments;
    console.log(`🎯 Color assignments set for room ${this.gameId}:`, assignments);
  }

  // ✅ Move processing (existing method enhanced)
  makeMove(move, playerId) {
    const player = this.players.find(p => p.playerId === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (player.color !== this.serverGameState.activeColor) {
      return { success: false, error: 'Not your turn' };
    }

    if (this.gameStatus !== 'playing') {
      return { success: false, error: 'Game not active' };
    }

    try {
      const from = this.parsePosition(move.from);
      const to = this.parsePosition(move.to);

      const result = ChessEngine.makeMove(this.serverGameState, from, to);

      if (result.success) {
        this.serverGameState = result.newState;
        this.lastMoveTime = Date.now();

        if (this.timeControl.increment) {
          this.playerTimes[player.color] += this.timeControl.increment;
        }

        return {
          success: true,
          move: {
            from: move.from,
            to: move.to,
            piece: result.piece,
            captured: result.captured,
            notation: result.notation
          },
          gameState: this.getClientGameState(),
          gameStatus: this.gameStatus
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Move processing error:', error);
      return { success: false, error: 'Invalid move format' };
    }
  }

  // ✅ Helper methods
  parsePosition(posStr) {
    if (posStr.length === 2 && !isNaN(posStr)) {
      return { row: parseInt(posStr[0]), col: parseInt(posStr[1]) };
    }
    throw new Error('Invalid position format');
  }

  getPlayer(playerId) {
    return this.players.find(p => p.playerId === playerId);
  }

  disconnectPlayer(playerId) {
    const player = this.players.find(p => p.playerId === playerId);
    if (player) {
      player.isConnected = false;
      console.log(`🔌 Player ${player.username} disconnected from room ${this.gameId}`);
    }
  }

  getClientGameState() {
    return {
      bitboards: this.serverGameState.bitboards,
      activeColor: this.serverGameState.activeColor,
      currentFen: this.serverGameState.currentFen,
      castlingRights: this.serverGameState.castlingRights,
      enPassantSquare: this.serverGameState.enPassantSquare,
      moveHistory: this.serverGameState.moveHistory,
    };
  }

  sendError(ws, errorType, message) {
    try {
      ws.send(JSON.stringify({
        type: 'ERROR',
        errorType: errorType,
        message: message,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error sending error message:', error);
    }
  }

  broadcastToOthers(excludePlayerId, messageType, data) {
    const message = { type: messageType, ...data };

    [...this.players, ...this.spectators].forEach(user => {
      if (user.playerId !== excludePlayerId && user.isConnected && user.ws && user.ws.readyState === 1) {
        try {
          user.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error broadcasting to ${user.playerId}:`, error);
        }
      }
    });
  }

  broadcastToRoom(messageType, data) {
    const message = { type: messageType, ...data };

    [...this.players, ...this.spectators].forEach(user => {
      if (user.isConnected && user.ws && user.ws.readyState === 1) {
        try {
          user.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error broadcasting to ${user.playerId}:`, error);
        }
      }
    });
  }
}

module.exports = Room;