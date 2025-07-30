class GameHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on('GAME_STARTED', (data) => {
            this.handleGameStarted(data);
        });

        this.eventBus.on('MOVE_MADE', (data) => {
            this.handleMoveMade(data);
        });

        this.eventBus.on('INVALID_MOVE', (data) => {
            this.handleInvalidMove(data);
        });

        this.eventBus.on('GAME_ENDED', (data) => {
            this.handleGameEnded(data);
        });
    }

    handleGameStarted(data) {
        const { gameId, players, gameState } = data;
        
        players.forEach(player => {
            this.sendMessage(player.ws, {
                type: 'GAME_STARTED',
                gameId: gameId,
                gameState: gameState,
                message: 'Game started!',
                timestamp: Date.now()
            });
        });

        console.log(`🚀 Game started: ${gameId}`);
    }

    handleMoveMade(data) {
        const { gameId, move, gameState, players } = data;
        
        players.forEach(player => {
            this.sendMessage(player.ws, {
                type: 'MOVE_MADE',
                gameId: gameId,
                move: move,
                gameState: gameState,
                timestamp: Date.now()
            });
        });
    }

    handleInvalidMove(data) {
        const { ws, error, move } = data;
        
        this.sendMessage(ws, {
            type: 'INVALID_MOVE',
            error: error,
            move: move,
            timestamp: Date.now()
        });
    }

    handleGameEnded(data) {
        const { gameId, result, players } = data;
        
        players.forEach(player => {
            this.sendMessage(player.ws, {
                type: 'GAME_OVER',
                gameId: gameId,
                result: result,
                timestamp: Date.now()
            });
        });

        console.log(`🏁 Game ended: ${gameId}`);
    }

    sendMessage(ws, message) {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        } catch (error) {
            console.error('❌ Error sending game message:', error);
        }
    }
}

module.exports = GameHandler;