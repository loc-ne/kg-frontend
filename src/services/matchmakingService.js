class MatchmakingService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.queues = {
            bullet: [],
            blitz: [],
            rapid: []
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // ✅ Listen to client events from ChessServer
        this.eventBus.on('client.find_game', (event) => {
            this.handleFindGame(event.ws, event.data);
        });

        // this.eventBus.on('client.cancel_search', (event) => {
        //     this.handleCancelSearch(event.ws, event.data);
        // });

    }

    handleFindGame(ws, message) {
        const player = {
            ws: ws,
            playerId: message.playerId,
            username: message.username,
            timeControl: message.timeControl,
            timeCategory: message.timeCategory,
            playerElo: message.playerElo || 1200,
            timestamp: Date.now()
        };

        const queue = this.queues[message.timeCategory];

        if (!queue) {
            this.eventBus.emit('INVALID_TIME_CATEGORY', {
                ws: ws,
                error: `Invalid time category: ${message.timeCategory}`,
                availableCategories: Object.keys(this.queues)
            });
            return;
        }

        const opponentIndex = this.findMatchInQueue(player, queue);

        if (opponentIndex !== -1) {
            const opponent = queue[opponentIndex];
            queue.splice(opponentIndex, 1);

            const gameId = this.generateGameId(player.playerId, opponent.playerId);

            this.eventBus.emit('MATCH_FOUND', {
                player1: player,
                player2: opponent,
                gameId: gameId,
                timeControl: message.timeControl,
                timeCategory: message.timeCategory
            });

            return;
        } else {
            queue.push(player);
            
            this.eventBus.emit('PLAYER_WAITING', {
                ws: player.ws,
            });

        }
    }

    findMatchInQueue(player, queue) {
        const waitTime = Date.now() - player.timestamp;

        let eloRange = 100; 
        if (waitTime > 30000) eloRange = 150; 
        if (waitTime > 60000) eloRange = 200; 
        if (waitTime > 120000) eloRange = 300; 

        for (let i = 0; i < queue.length; i++) {
            const opponent = queue[i];

            if (player.playerId === opponent.playerId) continue;

            const eloDiff = Math.abs(player.playerElo - opponent.playerElo);
            if (eloDiff > eloRange) continue;

            if (!this.timeControlsMatch(player.timeControl, opponent.timeControl)) continue;

            return i;
        }

        return -1; 
    }

    // handleCancelSearch(ws, message) {
    //     let playerRemoved = false;
    //     let removedFromCategory = null;

    //     Object.keys(this.queues).forEach(timeCategory => {
    //         const queue = this.queues[timeCategory];
    //         const index = queue.findIndex(p => p.playerId === message.playerId);
            
    //         if (index !== -1) {
    //             queue.splice(index, 1);
    //             playerRemoved = true;
    //             removedFromCategory = timeCategory;
                
    //         }
    //     });

    //     if (playerRemoved) {
    //         this.eventBus.emit('SEARCH_CANCELLED', {
    //             ws: ws,
    //         });
    //     } else {
    //         this.eventBus.emit('CANCEL_ERROR', {
    //             ws: ws,
    //         });
    //     }
    // }

    // ✅ Helper methods
    generateGameId(playerId1, playerId2) {
        return `${Date.now()}${playerId1}${playerId2}`;
    }

    timeControlsMatch(tc1, tc2) {
        if (typeof tc1 === 'string' && typeof tc2 === 'string') {
            return tc1 === tc2;
        }
        
        if (typeof tc1 === 'object' && typeof tc2 === 'object') {
            return tc1.initialTime === tc2.initialTime && 
                   tc1.increment === tc2.increment;
        }
        
        return false;
    }

}

module.exports = MatchmakingService;