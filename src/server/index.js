const ChessServer = require('./app');

const server = new ChessServer(8080);

process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    server.stop();
    process.exit(0);
});

server.start();
