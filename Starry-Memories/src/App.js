import React, { useState } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import PlayerInfo from './components/PlayerInfo';
import GameOver from './components/GameOver';
import ChatRoom from './components/ChatRoom';
import { useGameLogic } from './GameLogic';
import { useWebSocket } from './WebSocket';

function App() {
    const [messages, setMessages] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [playerNames, setPlayerNames] = useState({});

    const handleWebSocketMessage = (obj) => {
        if (obj.type === 'game_start') {
            setGameStarted(true);
            shuffleCards();
        }
        if (obj.type === 'game_full') {
            alert('Game is full, cannot join.');
        }
        if (obj.type === 'sys_c_connect') {
            console.log(`${obj.name} is connected`);
            const msg = `<b>SYSTEM:</b> ${obj.name} is connected`;
            setMessages(prevMessages => [...prevMessages, msg]);
        }
        if (obj.type === 'sys_c_disconnect') {
            console.log(`${obj.name} is disconnected`);
            const msg = `<b>SYSTEM:</b> ${obj.name} is disconnected`;
            setMessages(prevMessages => [...prevMessages, msg]);
        }
        if (obj.type === 'player_names') {
            setPlayerNames(obj.playerNames);
        }
        if (obj.type === 'message') {
            const msg = `<b>${obj.name}:</b> ${obj.message}`;
            setMessages(prevMessages => [...prevMessages, msg]);
        }
        if (obj.type === 'update_game_state') {
            setCards(obj.cards);
            setPlayerScores(obj.playerScores);
            setCurrentPlayer(obj.currentPlayer);
            setTotalRounds(obj.totalRounds);
        }
        if (obj.type === 'game_over') {
            setGameOver(true);
        }
    };

    const ws = useWebSocket(handleWebSocketMessage);
    const {
        cards, choiceOne, choiceTwo, handleChoice, playerScores, currentPlayer,
        gameOver, totalRounds, shuffleCards, disabled
    } = useGameLogic(ws);

    return (
        <div className="App">
            <div className="game">
                <h1>星辰記憶 • Starry Memories</h1>

                {!gameStarted && (
                    <p>Waiting for another player to join...</p>
                )}

                {gameStarted && (
                    <GameBoard
                        cards={cards}
                        handleChoice={handleChoice}
                        choiceOne={choiceOne}
                        choiceTwo={choiceTwo}
                        disabled={disabled}
                    />
                )}
            </div>

            <div className="info">
                <PlayerInfo
                    playerScores={playerScores}
                    playerNames={playerNames}
                    currentPlayer={currentPlayer}
                    totalRounds={totalRounds}
                />
                <ChatRoom ws={ws} messages={messages} />
            </div>

            {gameOver && (
                <GameOver
                    totalRounds={totalRounds}
                    playerScores={playerScores}
                    shuffleCards={shuffleCards}
                />
            )}
        </div>
    );
}

export default App;