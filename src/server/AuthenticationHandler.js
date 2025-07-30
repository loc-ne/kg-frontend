const WebSocket = require('ws');

class AuthenticationHandler {
    constructor(eventBus, server) {
        this.eventBus = eventBus;
        this.server = server; // ✅ Reference to ChessServer for accessing wss
        this.setupEventListeners();
        console.log('✅ AuthenticationHandler initialized');
    }

    setupEventListeners() {
        this.eventBus.on('auth.request', (data) => {
            this.handleAuthRequest(data);
        });

        console.log('👂 AuthenticationHandler listeners registered');
    }

    handleAuthRequest(data) {
        const { ws, data: message } = data;
        const { playerId } = message; // ✅ Fix destructuring

        console.log(`🔐 Authentication request for playerId: ${playerId}`);

        try {
            // ✅ Validation
            if (!playerId) {
                this.handleAuthFailed({ ws, error: 'Player ID is required' });
                return;
            }

            // ✅ Check duplicate connections
            const duplicateConnection = this.checkDuplicateConnections(ws, playerId);
            if (duplicateConnection) {
                this.handleAuthFailed({ ws, error: 'Player already connected from another session' });
                return;
            }

            // ✅ Authentication successful - use playerId as username
            this.handleAuthSuccess({ ws, playerId });
            
        } catch (error) {
            console.error('❌ Authentication error:', error);
            this.handleAuthFailed({ ws, error: 'Authentication failed due to server error' });
        }
    }

    checkDuplicateConnections(ws, playerId) {
        if (!this.server || !this.server.wss) {
            console.log('⚠️ Server or wss not available for duplicate check');
            return false;
        }

        let duplicateFound = false;
        this.server.wss.clients.forEach(client => {
            if (client !== ws && 
                client.playerId === playerId && 
                client.readyState === WebSocket.OPEN) {
                duplicateFound = true;
                console.log(`⚠️ Duplicate connection detected for player: ${playerId}`);
            }
        });

        return duplicateFound;
    }

    handleAuthSuccess(data) {
        const { ws, playerId } = data;
        
        console.log(`✅ Authentication successful for playerId: ${playerId}`);

        // ✅ Set WebSocket properties - chỉ cần playerId
        ws.isAuthenticated = true;
        ws.playerId = playerId;

        // ✅ Send success response to client
        this.sendMessage(ws, {
            type: 'AUTHENTICATED',
            success: true,
            playerId: playerId,
            message: 'Authentication successful! You can now play chess.',
            timestamp: Date.now()
        });

        // ✅ Notify other handlers about successful authentication
        this.eventBus.emit('user.authenticated', {
            ws: ws,
            playerId: playerId
        });
    }

    handleAuthFailed(data) {
        const { ws, error } = data;
        
        console.log(`❌ Authentication failed: ${error}`);
        
        // ✅ Send error response to client
        this.sendMessage(ws, {
            type: 'AUTHENTICATED',
            success: false,
            error: error || 'Authentication failed',
            timestamp: Date.now()
        });
    }

    sendMessage(ws, message) {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                console.log(`📤 Auth message sent: ${message.type} (success: ${message.success})`);
            }
        } catch (error) {
            console.error('❌ Error sending auth message:', error);
        }
    }
}

module.exports = AuthenticationHandler;