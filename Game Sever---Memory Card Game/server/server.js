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

wss.on('connection', function (ws) {

    console.log('User connected');
    ws.username = 'anonymous';

    if (connectedClients.length >= 2) {
        console.log('Game is full, cannot join.');
        ws.send(JSON.stringify({ type: 'game_full' }));
        ws.close();
        return;
    }

    connectedClients.push(ws);

    if (connectedClients.length === 1) {
        playerNames[1] = ws.username;
    } else if (connectedClients.length === 2) {
        playerNames[2] = ws.username;
    }

    wss.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'sys_c_connect', name: ws.username, message: '' }));
            client.send(JSON.stringify({ type: 'player_names', playerNames }));
        }
    });

    if (connectedClients.length === 2) {
        console.log('Starting game for 2 players');
        wss.clients.forEach(function (client) {
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
            if (connectedClients.length === 1) {
                playerNames[1] = ws.username;
            } else if (connectedClients.length === 2) {
                playerNames[2] = ws.username;
            }

            wss.clients.forEach(function(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'sys_c_connect', name: ws.username, message: '' }));
                    client.send(JSON.stringify({ type: 'player_names', playerNames })); // 發送更新的玩家名稱
                }
            });
        }

        if (jsonObj.type === 'message') {
            wss.clients.forEach(function (client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'message', name: ws.username, message: jsonObj.message }));
                }
            });
        }
    });

    ws.on('close', function () {
        console.log('User disconnected');
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'sys_c_disconnect', name: ws.username, message: '' }));;
            }
        });

    });

    if (connectedClients.length < 2) {
        console.log('Game ended, waiting for new players...');
        connectedClients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'game_end' }));
            }
        });
    }
});

server.listen(1234, function () {
    console.log('listening on *:1234');
});