import { useState } from 'react';
import './ChatRoom.css'

export default function ChatRoom({ ws, messages }) {

    const [playerName, setPlayerName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (playerName === "") {
            ws.send(JSON.stringify({ type: 'set_name', name: message, message: '' }));
            setPlayerName(message);
        } else {
            ws.send(JSON.stringify({ type: 'message', name: playerName, message: message }));
            setMessage('');
        }
    }

    return (
        <div className="chat-room">
            <ul className="messages">
            {messages.map((msg, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: msg }} />
                ))}
            </ul>
            <form onSubmit={handleSubmit}>
                <input id="message" value={message} onChange={e => setMessage(e.target.value)} autoComplete="off" placeholder={playerName === '' ? "Enter your name..." : "Type a message..."}/>
                <button>Send</button>
            </form>
        </div>
    )
}