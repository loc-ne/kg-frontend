const Room = require('./room');

class RoomManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.rooms = new Map();
        this.playerRooms = new Map();

        this.setupEventListeners();
    }

    setupEventListeners() {
        // ✅ Listen to match found to create rooms
        this.eventBus.on('ROOM_CREATE', (data) => {
            this.createRoom(data);
        });

        // ✅ Fixed event names to match client messages
        this.eventBus.on('MAKE_MOVE', (event) => {
            this.handlePlayerMove(event.ws, event.data);
        });

        this.eventBus.on('RESIGN', (event) => {
            this.handlePlayerResign(event.ws, event.data);
        });

        // ✅ VẤN ĐỀ 1, 2, 3: Enhanced JOIN_ROOM handling
        this.eventBus.on('client.join_room', (event) => {
            this.handleJoinRoom(event.ws, event.data);
        });

        this.eventBus.on('client_disconnect', (event) => {
            this.handlePlayerDisconnect(event.playerId);
        });
    }

    // ✅ VẤN ĐỀ 1: Enhanced createRoom with original players tracking
    createRoom(matchData) {
        const { player1, player2, gameId, timeControl } = matchData;

        const room = new Room(gameId, timeControl, [player1.playerId, player2.playerId]);

        // ✅ PRE-ADD PLAYERS VỚI ELO ĐÚNG
        room.players = [
            {
                playerId: player1.playerId,
                username: player1.username,
                elo: player1.playerElo,  // ✅ ELO FOR THIS TIME CONTROL
                color: player1.assignedColor,
                timeLeft: timeControl.initialTime,
                isConnected: false,
                joinTime: Date.now(),
                isOriginalPlayer: true,
                ws: null
            },
            {
                playerId: player2.playerId,
                username: player2.username,
                elo: player2.playerElo,  // ✅ ELO FOR THIS TIME CONTROL
                color: player2.assignedColor,
                timeLeft: timeControl.initialTime,
                isConnected: false,
                joinTime: Date.now(),
                isOriginalPlayer: true,
                ws: null
            }
        ];

        this.rooms.set(gameId, room);
        this.playerRooms.set(player1.playerId, gameId);
        this.playerRooms.set(player2.playerId, gameId);
    }


    // ✅ VẤN ĐỀ 1, 2, 3: Complete JOIN_ROOM handling
    handleJoinRoom(ws, joinData) {
        const { gameId, playerId } = joinData;
        const username = ws.username || 'Unknown';

        // ✅ LẤY ELO THEO TIME CONTROL
        const getUserElo = (eloObject, timeControl) => {
            if (!eloObject || typeof eloObject !== 'object') {
                return 1200; // Default
            }

            // ✅ Map time control to ELO category
            switch (timeControl?.type) {
                case 'bullet':
                    return eloObject.bullet || 1200;
                case 'blitz':
                    return eloObject.blitz || 1200;
                case 'rapid':
                case 'classical':
                    return eloObject.rapid || 1200;
                default:
                    return eloObject.rapid || 1200; // Default to rapid
            }
        };

        const room = this.rooms.get(gameId);
        const elo = getUserElo(ws.elo, room?.timeControl);

        console.log(`🔗 ${username} (ELO: ${elo}) attempting to join room ${gameId}`);
        if (!room) {
            console.log(`❌ Room ${gameId} not found`);
            this.eventBus.emit('GAME_NOT_FOUND', {
                ws,
                gameId,
                message: 'Game not found. It may have ended or the ID is incorrect.'
            });
            return;
        }

        // ✅ Use room's smart user addition logic (handles all 3 cases)
        try {
            const success = room.addUser(ws, { playerId, username, elo });

            if (success) {
                // Update tracking if user became a player
                if (room.getPlayer(playerId)) {
                    this.playerRooms.set(playerId, gameId);
                }

                console.log(`✅ ${username} successfully joined room ${gameId}`);
            } else {
                console.log(`❌ ${username} failed to join room ${gameId}`);
            }
        } catch (error) {
            console.error(`❌ Error adding user ${username} to room ${gameId}:`, error);
            this.eventBus.emit('JOIN_ROOM_ERROR', {
                ws,
                gameId,
                error: 'Failed to join room. Please try again.'
            });
        }
    }

    // ✅ Handle moves (existing method enhanced)
    handlePlayerMove(ws, moveData) {
        const { gameId, playerId, move } = moveData;

        const room = this.rooms.get(gameId);
        if (!room) {
            this.eventBus.emit('GAME_NOT_FOUND', { ws, gameId });
            return;
        }

        const moveResult = room.makeMove(move, playerId);

        if (moveResult.success) {
            // ✅ Broadcast to entire room (players + spectators)
            room.broadcastToRoom('MOVE_MADE', {
                gameId: gameId,
                move: moveResult.move,
                gameState: room.getClientGameState(),
                timestamp: Date.now()
            });

            // ✅ Check game end
            if (moveResult.gameStatus !== 'playing') {
                this.endGame(gameId, moveResult.result);
            }
        } else {
            // ✅ Invalid move - send error to player only
            this.eventBus.emit('INVALID_MOVE', {
                ws,
                error: moveResult.error,
                move: move
            });
        }
    }

    // ✅ Handle resignation
    handlePlayerResign(ws, resignData) {
        const { gameId, playerId } = resignData;

        const room = this.rooms.get(gameId);
        if (!room) {
            this.eventBus.emit('GAME_NOT_FOUND', { ws, gameId });
            return;
        }

        const player = room.getPlayer(playerId);
        if (!player) {
            this.eventBus.emit('PLAYER_NOT_IN_GAME', { ws, gameId });
            return;
        }

        const winner = player.color === 'white' ? 'black' : 'white';
        this.endGame(gameId, {
            type: 'resignation',
            winner: winner,
            loser: player.color,
            resignedPlayer: {
                playerId: playerId,
                username: player.username,
                color: player.color
            }
        });
    }

    // ✅ VẤN ĐỀ 3: Enhanced disconnect handling
    handlePlayerDisconnect(playerId) {
        const gameId = this.playerRooms.get(playerId);
        if (!gameId) {
            console.log(`🔌 Disconnect: Player ${playerId} not tracked in any room`);
            return;
        }

        const room = this.rooms.get(gameId);
        if (!room) {
            console.log(`🔌 Disconnect: Room ${gameId} not found for player ${playerId}`);
            this.playerRooms.delete(playerId);
            return;
        }

        console.log(`🔌 Player ${playerId} disconnected from room ${gameId}`);

        // Mark as disconnected
        room.disconnectPlayer(playerId);

        // Notify room about disconnection
        const disconnectedUser = room.getPlayer(playerId) || room.spectators.find(s => s.playerId === playerId);
        if (disconnectedUser) {
            room.broadcastToOthers(playerId, 'USER_DISCONNECTED', {
                gameId: gameId,
                disconnectedUser: {
                    playerId: playerId,
                    username: disconnectedUser.username,
                    role: room.getPlayer(playerId) ? 'player' : 'spectator'
                },
                timestamp: Date.now()
            });
        }

        // For original players, set reconnection timeout
        if (room.getPlayer(playerId) && room.originalPlayers.includes(playerId)) {
            this.setReconnectionTimeout(playerId, gameId);
        } else {
            // Remove spectators immediately
            const spectatorIndex = room.spectators.findIndex(s => s.playerId === playerId);
            if (spectatorIndex !== -1) {
                room.spectators.splice(spectatorIndex, 1);
                console.log(`🚪 Spectator ${playerId} removed from room ${gameId}`);
            }
        }
    }

    // ✅ VẤN ĐỀ 3: Reconnection timeout for players
    setReconnectionTimeout(playerId, gameId) {
        setTimeout(() => {
            const room = this.rooms.get(gameId);
            if (room) {
                const player = room.getPlayer(playerId);
                if (player && !player.isConnected) {
                    console.log(`⏰ Player ${playerId} reconnection timeout in room ${gameId}`);

                    // Notify room about player abandonment
                    room.broadcastToRoom('PLAYER_ABANDONED', {
                        gameId: gameId,
                        abandonedPlayer: {
                            playerId: playerId,
                            username: player.username,
                            color: player.color
                        },
                        timestamp: Date.now()
                    });

                    // Could auto-resign or offer draw here
                    // For now, keep player in room but marked as abandoned
                }
            }
        }, 300000); // 5 minutes timeout
    }

    // ✅ End game
    endGame(gameId, result) {
        const room = this.rooms.get(gameId);
        if (!room) return;

        room.gameStatus = 'finished';

        room.broadcastToRoom('GAME_OVER', {
            gameId: gameId,
            result: result,
            finalPosition: room.getClientGameState(),
            timestamp: Date.now()
        });

        console.log(`🏁 Game ${gameId} ended:`, result);

        // Clean up after some time
        setTimeout(() => {
            this.cleanupFinishedGame(gameId);
        }, 60000); // Keep room for 1 minute for final analysis
    }

    // ✅ Cleanup finished games
    cleanupFinishedGame(gameId) {
        const room = this.rooms.get(gameId);
        if (room && room.gameStatus === 'finished') {
            // Remove from rooms
            this.rooms.delete(gameId);

            // Clean up player mappings
            for (const [pid, gid] of this.playerRooms.entries()) {
                if (gid === gameId) {
                    this.playerRooms.delete(pid);
                }
            }

            console.log(`🧹 Cleaned up finished game ${gameId}`);
        }
    }

    // ✅ Get stats
    getRoomStats() {
        return {
            totalRooms: this.rooms.size,
            activePlayers: this.playerRooms.size,
            roomDetails: Array.from(this.rooms.entries()).map(([gameId, room]) => ({
                gameId,
                status: room.gameStatus,
                playerCount: room.players.length,
                spectatorCount: room.spectators.length
            }))
        };
    }

    // ✅ Get room info
    getRoomInfo(gameId) {
        const room = this.rooms.get(gameId);
        if (!room) return null;

        return {
            gameId: room.gameId,
            gameStatus: room.gameStatus,
            playerCount: room.players.length,
            spectatorCount: room.spectators.length,
            originalPlayers: room.originalPlayers,
            players: room.players.map(p => ({
                playerId: p.playerId,
                username: p.username,
                elo: p.elo,
                color: p.color,
                isConnected: p.isConnected
            }))
        };
    }
}

module.exports = RoomManager;