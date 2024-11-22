const path = require('path')
const express = require('express')
const app = express();

const WebSocket = require('ws');
const { createServer } = require('http');

const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '..', 'build')));

let connectedClients = [];
let playerNames = {};
let totalrounds = 0;
let playerScores = { 1: 0, 2: 0 };
let currentPlayer = 1;

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
        console.log(jsonObj);

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
            totalrounds = jsonObj.totalrounds;
            console.log(totalrounds);
            playerScores = jsonObj.playerScores;
            console.log(playerScores);
            currentPlayer = jsonObj.currentPlayer;
            console.log(currentPlayer);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(jsonObj));
                }
            });
        }

        if (jsonObj.type === 'game_over') {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'game_over', playerScores }));
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