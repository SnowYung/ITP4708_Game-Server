const path = require('path')
const express = require('express')
const app = express();

const WebSocket = require('ws');
const {createServer} = require('http');     

const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '..', 'build')));

wss.on('connection', function(ws) {

    ws.username = 'anonymous';

    ws.on('message', function(message) {
        var jsonObj = JSON.parse(message);
        if(jsonObj.type==='set_name') {
            ws.username = jsonObj.name;
            wss.clients.forEach(function (client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type:'sys_c_connect', name:ws.username, message:''}) );
                }
            });
        }
        if(jsonObj.type==='message') {
            wss.clients.forEach(function(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({type:'message', name:ws.username, message:jsonObj.message}) );
                }
            });
        }
    });
   
    ws.on('close', function() {
        console.log('User disconnected');
        wss.clients.forEach(function(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({type:'sys_c_disconnect', name:ws.username, message:''}) );;
            }
        });

    });
        
});

server.listen(1234, function() {
    console.log('listening on *:1234');
});