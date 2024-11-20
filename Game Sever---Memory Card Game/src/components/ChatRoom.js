import { useState } from 'react';
import './ChatRoom.css'

export default function ChatRoom({ ws }) {

    const [playerName, setPlayerName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (playerName == "") {
            ws.send(JSON.stringify({ type: 'set_name', name: message, message: '' }));
            setPlayerName(message);
        } else {
            ws.send(JSON.stringify({ type: 'message', name: playerName, message: message }));
        }
    }

    return (
        <div className="chat-room">
            <ul className="messages">
                <li>Test</li>
                <li>Test</li>
                <li>Test</li>
                <li>Test</li>
                <li>Test</li>
            </ul>
            <form onSubmit={handleSubmit}>
                <input id="message" value={message} onChange={e => setMessage(e.target.value)} autoComplete="off" />
                <button>Send</button>
            </form>
        </div>
    )
}