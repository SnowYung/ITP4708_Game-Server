import { useEffect, useState } from 'react';
import './App.css'
import SingleCard from './components/SingleCard';
import ChatRoom from './components/ChatRoom';

const cardImages = [
    { "src": "/img/Chariot Card.jpg", matched: false },
    { "src": "/img/Death Card.jpg", matched: false },
    { "src": "/img/Devil Card.jpg", matched: false },
    { "src": "/img/Emperor Card.jpg", matched: false },
    { "src": "/img/Empress Card.jpg", matched: false },
    { "src": "/img/Fool Card.jpg", matched: false },
    { "src": "/img/Hanged Man Card.jpg", matched: false },
    { "src": "/img/Hermit Card.jpg", matched: false },
    { "src": "/img/Hierophant Card.jpg", matched: false },
    { "src": "/img/High Priestess Card.jpg", matched: false },
    { "src": "/img/Judgement Card.jpg", matched: false },
    { "src": "/img/Justice Card.jpg", matched: false },
    { "src": "/img/Lovers Card.jpg", matched: false },
    { "src": "/img/Magician Card.jpg", matched: false },
    { "src": "/img/Moon Card.jpg", matched: false },
    { "src": "/img/Star Card.jpg", matched: false },
    { "src": "/img/Strength Card.jpg", matched: false },
    { "src": "/img/Sun Card.jpg", matched: false },
    { "src": "/img/Temperance Card.jpg", matched: false },
    { "src": "/img/Tower Card.jpg", matched: false },
    { "src": "/img/Wheel of Fortune Card.jpg", matched: false },
    { "src": "/img/World Card.jpg", matched: false }
];

function App() {

    const [ws, setWs] = useState(null);
    const [cards, setCards] = useState([]);
    const [totalrounds, setTotalRounds] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [playerScores, setPlayerScores] = useState({ 1: 0, 2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [playerNames, setPlayerNames] = useState({});
    const [messages, setMessages] = useState([]);

    const shuffleCards = () => {
        const shuffledCards = [...cardImages, ...cardImages]
            .sort(() => Math.random() - 0.5)
            .map((card) => ({ ...card, id: Math.random() }));

        setChoiceOne(null);
        setChoiceTwo(null);
        setCards(shuffledCards);
        setTotalRounds(0);
        setCurrentPlayer(1);
        setPlayerScores({ 1: 0, 2: 0 });
        setGameOver(false);
    }

    const handleChoice = (card) => {
        if (!disabled && !gameOver)
            if (choiceOne) {
                setChoiceTwo(card);
                let updatedGameState = {
                    type: 'update_game_state',
                    cards: cards.map(c => ({ ...c, matched: c.matched || (c === choiceOne || c === choiceTwo) })),
                    playerScores,
                    currentPlayer,
                    totalRounds,
                };
                ws.send(JSON.stringify(updatedGameState));
            } else {
                setChoiceOne(card);
            }
    };

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
            let msg = `<b>SYSTEM:</b> ${obj.name} is disconnected`;
            setMessages(prevMessages => [...prevMessages, msg]);
        }
        if (obj.type === 'player_names') {
            setPlayerNames(obj.playerNames);
        }
        if (obj.type === 'message') {
            let msg = `<b>${obj.name}:</b> ${obj.message}`;
            setMessages(prevMessages => [...prevMessages, msg]);
        }
        if (obj.type === 'update_game_state') {
            setCards(obj.cards);
            setPlayerScores(obj.playerScores);
            setCurrentPlayer(obj.currentPlayer);
            setTotalRounds(obj.totalRounds);
        }
        if (obj.type === 'game_over'){
            setGameOver(true);
        }
    }

    useEffect(() => {
        const websocket = new WebSocket(`ws://${location.hostname}:1234`);

        websocket.onopen = () => {
            console.log('WebSocket connection opened');
        };

        websocket.onmessage = (event) => {
            const obj = JSON.parse(event.data);
            handleWebSocketMessage(obj);
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error observed:', error);
        }

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);


    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);

            if (choiceOne.src === choiceTwo.src) {
                setCards(prevCards => prevCards.map(card => {
                    if (card.src === choiceOne.src) {
                        return { ...card, matched: true };
                    }
                    return card;
                }));

                setPlayerScores(prevScores => ({
                    ...prevScores,
                    [currentPlayer]: prevScores[currentPlayer] + 1
                }));
                resetTurn(true);
            } else {
                setTimeout(() => resetTurn(false), 1000);
            }
        }
    }, [choiceOne, choiceTwo, currentPlayer]);

    useEffect(() => {
        if (cards.length > 0 && cards.every(card => card.matched)) {
            setGameOver(true);
            ws.send(JSON.stringify({ type: 'game_over', playerScores }));
        }
    }, [cards]);

    const resetTurn = (matched) => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setTotalRounds(prevTurns => prevTurns + 1);
        setDisabled(false);

        if (!matched) {
            setCurrentPlayer(prevPlayer => (prevPlayer === 1 ? 2 : 1));
        }
    };

    useEffect(() => {
        shuffleCards();
    }, []);

    return (
        <div className="App">
            <div className="game">
                <h1>Fabled Elements</h1>

                {!gameStarted && (
                    <p>Waiting for another player to join...</p>
                )}

                {gameStarted && (
                    <div className="card-grid">
                        {cards.map(card => (
                            <SingleCard
                                key={card.id}
                                card={card}
                                handleChoice={handleChoice}
                                flipped={card === choiceOne || card === choiceTwo || card.matched}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="info">
                <div className="info-grid">
                    <p>Totel Rounds: {totalrounds}</p>
                    <p className="score-left"> {playerNames[1] || 'Player 1'} Score: {playerScores[1]}</p>
                    <p className="score-right"> {playerNames[2] || 'Player 2'} Score: {playerScores[2]}</p>
                    <p>currentPlayer : {playerNames[currentPlayer] || 'Player' [currentPlayer]} </p>
                </div>
                <ChatRoom ws={ws} messages={messages} />
            </div>

            {gameOver && (
                <div className="game-over">
                    <h2>Game Over!</h2>
                    <p>Total Rounds: {totalrounds}</p>
                    <p>Winner: Player {playerScores[1] > playerScores[2] ? 1 : playerScores[1] < playerScores[2] ? 2 : "Tie"}</p>
                    <button className="start-btn" onClick={shuffleCards}>New Game</button>
                </div>
            )}
        </div >
    );
}

export default App