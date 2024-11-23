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

let availablePlayerSlots = [1, 2]; // 僅允許兩名玩家，同時管理可用的 playerIndex

wss.on('connection', function (ws) {
    console.log('User connected, waiting for name...');

    ws.on('message', function (message) {
        const jsonObj = JSON.parse(message);

        if (jsonObj.type === 'set_name') {
            // 如果遊戲滿員，拒絕新玩家
            if (connectedClients.length >= 2) {
                console.log('Game is full, cannot join.');
                ws.send(JSON.stringify({ type: 'game_full' }));
                ws.close();
                return;
            }

            // 分配一個可用的 playerIndex
            const playerIndex = availablePlayerSlots.shift(); // 取得第一個空閒的玩家位
            if (playerIndex === undefined) {
                console.log('No available player slots, rejecting connection.');
                return;
            }

            ws.playerIndex = playerIndex; // 為 WebSocket 連線設置玩家索引
            connectedClients.push(ws); // 將 WebSocket 連線添加到已連接的客戶端
            playerNames[playerIndex] = jsonObj.name; // 設置 playerNames

            // 通知所有客戶端有新玩家連線
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

            // 如果兩名玩家都已連線，開始遊戲
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
            const playerIndex = ws.playerIndex; // 獲取斷線玩家的索引
            connectedClients.splice(index, 1); // 從連接列表中移除該玩家
            delete playerNames[playerIndex]; // 刪除玩家名字
            availablePlayerSlots.push(playerIndex); // 將該索引重新添加到可用的玩家位中

            // 通知所有客戶端有玩家離線
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

                    // 如果只剩下一名玩家，結束遊戲
                    if (connectedClients.length <= 1) {
                        gameState.reset();
                        client.send(JSON.stringify({ type: 'game_end' }));
                    }
                }
            });
        }
    });

    // 如果少於 2 人，結束遊戲
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