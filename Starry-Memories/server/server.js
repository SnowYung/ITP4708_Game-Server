const path = require('path');
const express = require('express');
const app = express();
const WebSocket = require('ws');
const { createServer } = require('http');

const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '..', 'build')));

let connectedClients = [];
let playerNames = {};
let availablePlayerSlots = [1, 2];
let isProcessingUpdate = false;
let readyForNewGame = {1:false, 2:false};

class StarryMemories {
    constructor() {
        this._totalRounds = 0;
        this._cards = [];
        this._playerScores = { 1: 0, 2: 0 };
        this._currentPlayer = 1;
    }

    reset() {
        this._totalRounds = 0;
        this._cards = [];
        this._playerScores = { 1: 0, 2: 0 };
        this._currentPlayer = 1;
    }

    get totalRounds() {
        return this._totalRounds;
    }

    set totalRounds(value) {
        this._totalRounds = value;
    }

    get cards() {
        return this._cards;
    }

    set cards(value) {
        this._cards = value;
    }

    get playerScores() {
        return this._playerScores;
    }

    set playerScores(value) {
        this._playerScores = value;
    }

    get currentPlayer() {
        return this._currentPlayer;
    }

    set currentPlayer(value) {
        this._currentPlayer = value;
    }
}
let gameState = new StarryMemories();

wss.on('connection', function (ws) {
    console.log('User connected, waiting for name...');

    ws.on('message', function (message) {
        const jsonObj = JSON.parse(message);

        if (jsonObj.type === 'set_name') {
            if (connectedClients.length >= 2) {
                console.log('Game is full, cannot join.');
                ws.send(JSON.stringify({ type: 'game_full' }));
                ws.close();
                return;
            }

            const playerIndex = availablePlayerSlots.shift();
            ws.playerIndex = playerIndex;

            ws.send(JSON.stringify({
                type: 'player_index',
                playerIndex: playerIndex
            }));

            if (playerIndex === undefined) {
                console.log('No available player slots, rejecting connection.');
                return;
            }

            connectedClients.push(ws);
            playerNames[playerIndex] = jsonObj.name;

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'sys_c_connect',
                        name: playerNames[playerIndex]
                    }));
                    client.send(JSON.stringify({
                        type: 'player_names',
                        playerNames
                    }));
                }
            });

            if (connectedClients.length === 2) {
                console.log('Starting game for 2 players');
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'game_start', playerNames }));
                    }
                });
            }
        }

        if (jsonObj.type === 'message') {
            const playerIndex = ws.playerIndex;
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'message',
                        name: playerNames[playerIndex],
                        message: jsonObj.message
                    }));
                }
            });
        }

        if (jsonObj.type === 'update_game_state') {
            if (isProcessingUpdate) {
                console.log('Another update is already being processed. Rejecting this request.');
                return;
            }

            isProcessingUpdate = true;

            try {
                if (ws.playerIndex !== gameState.currentPlayer) {
                    console.log(`Player ${ws.playerIndex} attempted to update game state out of turn.`);
                    isProcessingUpdate = false;
                    return;
                }

                let invalidCards = jsonObj.cards.filter(card => {
                    const existingCard = gameState.cards.find(c => c.id === card.id);
                    return existingCard && existingCard.matched !== card.matched;
                });

                if (invalidCards.length > 0) {
                    console.warn('Warning: Some cards have an invalid state:', invalidCards);
                    isProcessingUpdate = false;
                }

                gameState.totalRounds = jsonObj.totalRounds;
                gameState.cards = jsonObj.cards;
                gameState.playerScores = jsonObj.playerScores;

                if (jsonObj.matched) {
                    console.log(`Player ${ws.playerIndex} matched successfully. Keeping the turn.`);
                } else {
                    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
                    console.log(`Player ${ws.playerIndex} failed to match. Switching turn to Player ${gameState.currentPlayer}.`);
                }

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'update_game_state',
                            totalRounds: gameState.totalRounds,
                            cards: gameState.cards,
                            playerScores: gameState.playerScores,
                            currentPlayer: gameState.currentPlayer,
                        }));
                    }
                });
            } finally {
                isProcessingUpdate = false;
            }
        }

        if (jsonObj.type === 'game_over') {
            readyForNewGame = {1:false, 2:false};
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'game_over', playerScores: gameState.playerScores }));
                }
            });
        }

        if (jsonObj.type === 'new_game') {
            const playerIndex = ws.playerIndex;
            if (playerIndex) {
                readyForNewGame[playerIndex] = true;
                console.log(`Player ${playerIndex} is ready for a new game.`);

                if (Object.values(readyForNewGame).every((ready) => ready)) {
                    console.log('Both players are ready for a new game. Restarting game.');

                    gameState.reset();
                    readyForNewGame = { 1: false, 2: false };

                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'game_start', playerNames }));
                        }
                    });
                } else {
                    ws.send(JSON.stringify({ type: 'waiting_for_other_player' }));
                }
            }
        }
    });

    ws.on('close', function () {
        console.log('User disconnected');

        const index = connectedClients.indexOf(ws);
        if (index !== -1) {
            const playerIndex = ws.playerIndex;
            connectedClients.splice(index, 1);
            delete playerNames[playerIndex];
            availablePlayerSlots.push(playerIndex);

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'sys_c_disconnect',
                        name: `Player ${playerIndex}`,
                        message: ''
                    }));
                    client.send(JSON.stringify({
                        type: 'player_names',
                        playerNames
                    }));

                    if (connectedClients.length < 2) {
                        gameState.reset();
                        client.send(JSON.stringify({ type: 'game_end' }));
                    }
                }
            });
        }
    });
});

server.listen(1234, function () {
    console.log('listening on *:1234');
});