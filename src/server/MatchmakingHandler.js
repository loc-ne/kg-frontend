class MatchmakingHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // this.eventBus.on('INVALID_TIME_CATEGORY', (data) => {
        //     this.handleInvalidTimeCategory(data);
        // });

        this.eventBus.on('MATCH_FOUND', (data) => {
            this.handleMatchFound(data);
        });

        // this.eventBus.on('PLAYER_WAITING', (data) => {
        //     this.handlePlayerWaiting(data);
        // });

        // this.eventBus.on('SEARCH_CANCELLED', (data) => {
        //     this.handleSearchCancelled(data);
        // });

        // this.eventBus.on('CANCEL_ERROR', (data) => {
        //     this.handleCancelError(data);
        // });
    }

    // handleInvalidTimeCategory(data) {
    //     const { ws, error, availableCategories } = data;

    //     this.sendMessage(ws, {
    //         type: 'ERROR',
    //         message: error,
    //         code: 'INVALID_TIME_CATEGORY',
    //         availableCategories: availableCategories,
    //         timestamp: Date.now()
    //     });

    //     console.log(`❌ Invalid time category error sent`);
    // }

    handleMatchFound(data) {
        const { player1, player2, gameId, timeControl, timeCategory } = data;

        // ✅ Assign random colors
        const colors = Math.random() < 0.5 ? ['white', 'black'] : ['black', 'white'];

        // ✅ Create match messages
        const player1Message = {
            type: 'MATCH_FOUND',
            gameId: gameId,
            yourColor: colors[0],
            yourInfo: {
                playerId: player1.playerId,
                username: player1.username,
                elo: player1.playerElo,
                color: colors[0] // ✅ Add color to yourInfo
            },
            opponent: {
                playerId: player2.playerId,
                username: player2.username,
                elo: player2.playerElo,
                color: colors[1]
            },
            timeControl: timeControl,
            timeCategory: timeCategory,
            message: 'Match found! Game starting...',
            timestamp: Date.now()
        };

        const player2Message = {
            ...player1Message,
            yourColor: colors[1],
            yourInfo: {
                playerId: player2.playerId,
                username: player2.username,
                elo: player2.playerElo,
                color: colors[1] 
            },
            opponent: {
                playerId: player1.playerId,
                username: player1.username,
                elo: player1.playerElo,
                color: colors[0]
            }
        };

        this.sendMessage(player1.ws, player1Message);
        this.sendMessage(player2.ws, player2Message);

        // ✅ Emit with assigned colors for Room creation
        this.eventBus.emit('ROOM_CREATE', {
            ...data,
            player1: { ...player1, assignedColor: colors[0] },
            player2: { ...player2, assignedColor: colors[1] }
        });

        console.log(`🎯 Match: ${player1.playerId} (${colors[0]}) vs ${player2.playerId} (${colors[1]})`);
    }

    // handlePlayerWaiting(data) {
    //     const { ws } = data;

    //     this.sendMessage(ws, {
    //         type: 'WAITING',
    //         message: 'Looking for opponent...',
    //         status: 'searching',
    //         timestamp: Date.now()
    //     });
    // }

    // handleSearchCancelled(data) {
    //     const { ws } = data;

    //     this.sendMessage(ws, {
    //         type: 'SEARCH_CANCELLED',
    //         message: 'Search cancelled successfully',
    //         status: 'cancelled',
    //         timestamp: Date.now()
    //     });
    // }

    // handleCancelError(data) {
    //     const { ws } = data;

    //     this.sendMessage(ws, {
    //         type: 'ERROR',
    //         message: 'Player not found in any queue',
    //         code: 'CANCEL_ERROR',
    //         timestamp: Date.now()
    //     });
    // }

    sendMessage(ws, message) {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        } catch (error) {
            console.error('❌ Error sending matchmaking message:', error);
        }
    }
}

module.exports = MatchmakingHandler;