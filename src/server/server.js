const WebSocket = require('ws');

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'FIND_GAME':
          handleFindGame(ws, message);
          break;

        case 'CANCEL_SEARCH':
          handleCancelSearch(ws, message);
          break;

        case 'MAKE_MOVE':
          handleMakeMove(ws, message);
          break;

        case 'RESIGN':
          handleResign(ws, message);
          break;

        case 'AUTHENTICATE':
          handleAuthenticate(ws, message);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    handlePlayerDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

