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

class StarryMemories {
    constructor() {
        this._totalRounds = 0;
        this._cards = [];
        this._playerScores = { 1: 0, 2: 0 };
        this._currentPlayer = 1;
    }

    javascript

    複製
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

let availablePlayerSlots = [1, 2];

wss.on('connection', function (ws) {
    console.log('User connected, waiting for name...');

    stylus

    複製
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
            if (playerIndex === undefined) {
                console.log('No available player slots, rejecting connection.');
                return;
            }

            ws.playerIndex = playerIndex;
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

            if (jsonObj.currentPlayer !== ws.playerIndex) {
                console.log(`Player ${ws.playerIndex} attempted to update game state out of turn.`);
                return;
            }

            gameState.totalRounds = jsonObj.totalRounds;
            gameState.cards = jsonObj.cards;
            gameState.playerScores = jsonObj.playerScores;
            gameState.currentPlayer = jsonObj.currentPlayer;

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(jsonObj));
                }
            });
        }

        if (jsonObj.type === 'game_over') {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'game_over', playerScores: gameState.playerScores }));
                }
            });
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

                    if (connectedClients.length <= 1) {
                        gameState.reset();
                        client.send(JSON.stringify({ type: 'game_end' }));
                    }
                }
            });
        }
    });

    if (connectedClients.length < 2) {
        console.log('Game ended, waiting for new players...');
        connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'game_end' }));
            }
        });
    }
});
server.listen(1234, function () {
    console.log('listening on *:1234');
});