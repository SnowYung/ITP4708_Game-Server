const path = require('path')
const express = require('express')
const app = express();

const WebSocket = require('ws');
const { createServer } = require('http');
const { type } = require('os');

const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '..', 'build')));

let connectedClients = [];
let playerNames = {};


class FabledElement {
    constructor() {
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


let gameState = new FabledElement();

wss.on('connection', function (ws) {

    console.log('User connected');

    if (connectedClients.length >= 2) {
        console.log('Game is full, cannot join.');
        ws.send(JSON.stringify({ type: 'game_full' }));
        ws.close();
        return;
    }

    const playerIndex = connectedClients.length + 1;
    connectedClients.push(ws);
    playerNames[playerIndex] = `Player ${playerIndex}`;

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'sys_c_connect', name: playerNames[playerIndex], message: '' }));
            client.send(JSON.stringify({ type: 'player_names', playerNames }));
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

    ws.on('message', function (message) {
        var jsonObj = JSON.parse(message);
        console.log(jsonObj.type);

        if (jsonObj.type === 'set_name') {
            ws.username = jsonObj.name;
            playerNames[playerIndex] = ws.username;

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'sys_c_connect', name: playerNames[playerIndex], message: '' }));
                    client.send(JSON.stringify({ type: 'player_names', playerNames }));
                }
            });
        }

        if (jsonObj.type === 'message') {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'message', name: playerNames[playerIndex], message: jsonObj.message }));
                }
            });
        }


        if (jsonObj.type === 'update_game_state') {

            gameState.totalRounds = jsonObj.totalRounds;
            gameState.cards = jsonObj.cards;
            gameState.playerScores = jsonObj.playerScores;
            gameState.currentPlayer = jsonObj.currentPlayer;

            // totalRounds = jsonObj.totalRounds;
            // console.log('totalRounds:' + totalRounds);

            // cards = jsonObj.cards;

            // playerScores = jsonObj.playerScores;
            // console.log('playerScores:' + playerScores);

            // currentPlayer = jsonObj.currentPlayer;
            // console.log('currentPlayer: ' + currentPlayer);
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
            connectedClients.splice(index, 1);
            delete playerNames[playerIndex];
        }

        connectedClients = connectedClients.filter(client => client !== ws);
        delete playerNames[1];
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'sys_c_disconnect', name: playerNames[playerIndex], message: '' }));;
                client.send(JSON.stringify({ type: 'player_names', playerNames }));
            }
        });
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