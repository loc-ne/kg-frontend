// eventBus.js
const listeners = {};

function on(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
}

function emit(event, payload) {
    if (listeners[event]) {
        listeners[event].forEach(handler => handler(payload));
    }
}

module.exports = { on, emit };
