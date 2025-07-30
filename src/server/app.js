const WebSocket = require('ws');
const eventBus = require('./eventBus');
const MatchmakingService = require('../services/matchmakingService');
const AuthenticationHandler = require('./AuthenticationHandler');
const MatchmakingHandler = require('./MatchmakingHandler');
const RoomManager = require('./RoomManager');

class ChessServer {
    constructor(port = 8080) {
        this.port = port;
        this.wss = null;

        this.eventBus = eventBus;

        this.matchmakingService = new MatchmakingService(this.eventBus);

        this.authHandler = new AuthenticationHandler(this.eventBus, this);
        this.matchmakingHandler = new MatchmakingHandler(this.eventBus);
        this.roomManager = new RoomManager(this.eventBus);

    }

    start() {
        this.wss = new WebSocket.Server({
            port: this.port,
            verifyClient: (info) => {
                console.log('Client connecting from:', info.origin);
                return true;
            }
        });

        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });
    }

    handleConnection(ws) {
        ws.isAuthenticated = false;
        ws.playerId = null;
        ws.username = null;
        ws.email = null;     // ✅ ADD
        ws.elo = null;

        ws.on('message', (data) => {
            this.handleMessage(ws, data);
        });

        ws.on('close', () => {
            this.handleDisconnection(ws);
        });

        ws.on('error', (error) => {
            console.error(' WebSocket error:', error);
        });
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data.toString());

            switch (message.type) {
                case 'AUTHENTICATE':
                    this.eventBus.emit('auth.request', { ws, data: message });
                    break;

                case 'FIND_GAME':
                    if (!ws.isAuthenticated) {
                        this.sendError(ws, 'Please authenticate first');
                        return;
                    }
                    if (!message.timeCategory || !message.timeControl) {
                        this.sendError(ws, 'Time category and time control required');
                        return;
                    }

                    this.eventBus.emit('client.find_game', { ws, data: message });
                    break;

                case 'JOIN_ROOM':
                    if (!ws.isAuthenticated) {
                        this.sendError(ws, 'Please authenticate first');
                        return;
                    }
                    if (!message.gameId) {
                        this.sendError(ws, 'Game ID required');
                        return;
                    }

                    // Add playerId to message for handlers
                    message.playerId = ws.playerId;
                    message.username = ws.username;
                    message.elo = ws.elo;

                    this.eventBus.emit('client.join_room', { ws, data: message });
                    break;

                // case 'CANCEL_SEARCH':
                //     if (!ws.isAuthenticated) {
                //         this.sendError(ws, 'Please authenticate first');
                //         return;
                //     }
                //     message.playerId = ws.playerId;
                //     this.eventBus.emit('client.cancel_search', { ws, data: message });
                //     break;

                // case 'MAKE_MOVE':
                //     if (!ws.isAuthenticated) {
                //         this.sendError(ws, 'Please authenticate first');
                //         return;
                //     }
                //     if (!this.validateMoveMessage(message)) {
                //         this.sendError(ws, 'Invalid move data');
                //         return;
                //     }
                //     this.eventBus.emit('client.make_move', { ws, data: message });
                //     break;

                default:
                    this.sendError(ws, 'Unknown message type: ' + message.type);
            }

        } catch (error) {
            console.error(' Error parsing message:', error);
            this.sendError(ws, 'Invalid message format');
        }
    }


    handleDisconnection(ws) {

        if (ws.playerId) {
            this.eventBus.emit('client.disconnect', {
                ws: ws,
                playerId: ws.playerId,
            });
        }
    }



    sendMessage(ws, message) {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        } catch (error) {
            console.error(' Error sending message:', error);
        }
    }

    sendError(ws, message, details = {}) {
        this.sendMessage(ws, {
            type: 'ERROR',
            message: message,
            timestamp: Date.now(),
            ...details
        });
        console.log(` Error sent to client: ${message}`);
    }


}

module.exports = ChessServer;