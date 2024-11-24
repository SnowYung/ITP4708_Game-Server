import { useEffect, useState } from 'react';

export const useWebSocket = (onMessage) => {
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const websocket = new WebSocket(`ws://${location.hostname}:1234`);

        websocket.onopen = () => {
            console.log('WebSocket connection opened');
        };

        websocket.onmessage = (event) => {
            const obj = JSON.parse(event.data);
            onMessage(obj);
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error observed:', error);
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [onMessage]);

    return ws;
};