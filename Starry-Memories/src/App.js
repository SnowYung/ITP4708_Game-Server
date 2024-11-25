import { useEffect, useState } from 'react';
import './App.css';
import SingleCard from './components/SingleCard';
import ChatRoom from './components/ChatRoom';
import cardImages from './components/cardImages';

function App() {
    const [ws, setWs] = useState(null);
    const [playerIndex, setPlayerIndex] = useState(null);
    const [playerNameSet, setPlayerNameSet] = useState(false);
    const [cards, setCards] = useState([]);
    const [totalRounds, setTotalRounds] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [playerScores, setPlayerScores] = useState({ 1: 0, 2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [playerNames, setPlayerNames] = useState({});
    const [messages, setMessages] = useState([]);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [waitingForOtherPlayer, setWaitingForOtherPlayer] = useState(false);

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
        setWaitingForOtherPlayer(false);
    };

    const handleChoice = (card) => {
        if (!disabled && !gameOver && isPlayerReady && currentPlayer === playerIndex) {
            if (choiceOne) {
                setChoiceTwo(card);
                setDisabled(true);

                if (choiceOne.src === card.src) {
                    setCards((prevCards) =>
                        prevCards.map((c) =>
                            c.src === card.src ? { ...c, matched: true } : c
                        )
                    );
                    setPlayerScores((prevScores) => ({
                        ...prevScores,
                        [currentPlayer]: prevScores[currentPlayer] + 1,
                    }));

                    ws.send(
                        JSON.stringify({
                            type: 'update_game_state',
                            totalRounds: totalRounds + 1,
                            cards: cards.map((c) =>
                                c.src === card.src || c.src === choiceOne.src
                                    ? { ...c, matched: true }
                                    : c
                            ),
                            playerScores: {
                                ...playerScores,
                                [currentPlayer]: playerScores[currentPlayer] + 1,
                            },
                            currentPlayer,
                            matched: true,
                        })
                    );

                    resetTurn(true);
                } else {
                    setTimeout(() => {
                        resetTurn(false);
                        ws.send(
                            JSON.stringify({
                                type: 'update_game_state',
                                totalRounds: totalRounds + 1,
                                cards,
                                playerScores,
                                currentPlayer: currentPlayer === 1 ? 2 : 1,
                                matched: false,
                            })
                        );
                    }, 1000);
                }
            } else {
                setChoiceOne(card);
            }
        } else {
            console.warn('The player is unprepared or attempts to act on the wrong turn.');
        }
    };

    const handleWebSocketMessage = (obj) => {
        if (obj.type === 'player_index') {
            setPlayerIndex(obj.playerIndex);
            setPlayerNameSet(true);
            setIsPlayerReady(true);
        }
        if (obj.type === 'game_start') {
            setWaitingForOtherPlayer(true);
            setGameStarted(true);
            shuffleCards();
        }
        if (obj.type === 'game_end') {
            setGameStarted(false);
            setGameOver(false);
            setCards([]);
            setTotalRounds(0);
            setCurrentPlayer(1);
            setPlayerScores({ 1: 0, 2: 0 });
            setGameOver(false);
            setWaitingForOtherPlayer(false);
            alert('Game has ended.');
        }
        if (obj.type === 'waiting_for_other_player') {
            setWaitingForOtherPlayer(true);
        }
        if (obj.type === 'game_full') {
            alert('Game is full, cannot join.');
        }
        if (obj.type === 'sys_c_connect') {
            console.log(`${obj.name} is connected`);
            const msg = `<b>SYSTEM:</b> ${obj.name} is connected`;
            setMessages((prevMessages) => [...prevMessages, msg]);
        }
        if (obj.type === 'sys_c_disconnect') {
            console.log(`${obj.name} is disconnected`);
            const msg = `<b>SYSTEM:</b> ${obj.name} is disconnected. Returned to the waiting screen.`;
            setMessages((prevMessages) => [...prevMessages, msg]);
        }
        if (obj.type === 'player_names') {
            setPlayerNames(obj.playerNames);
        }
        if (obj.type === 'message') {
            const msg = `<b>${obj.name}:</b> ${obj.message}`;
            setMessages((prevMessages) => [...prevMessages, msg]);
        }
        if (obj.type === 'update_game_state') {
            setCards(obj.cards);
            setPlayerScores(obj.playerScores);
            setCurrentPlayer(obj.currentPlayer);
            setTotalRounds(obj.totalRounds);
        }
        if (obj.type === 'game_over') {
            setWaitingForOtherPlayer(false);
            setGameOver(true);
        }
    };

    useEffect(() => {
        const websocket = new WebSocket(`ws://${location.hostname}:1234`);

        websocket.onopen = () => {
            console.log('WebSocket connection opened');
            setIsConnecting(false);
            setIsPlayerReady(false);
        };

        websocket.onmessage = (event) => {
            const obj = JSON.parse(event.data);
            handleWebSocketMessage(obj);
        };

        websocket.onclose = () => {
            console.log('WebSocket connection closed');
            setIsConnecting(true);
            alert('Connection closed. Attempting to reconnect...');
            setTimeout(() => {
                setWs(new WebSocket(`ws://${location.hostname}:1234`));
            }, 3000);
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error observed:', error);
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, []);

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);

            if (choiceOne.src === choiceTwo.src) {
                setCards((prevCards) =>
                    prevCards.map((card) =>
                        card.src === choiceOne.src
                            ? { ...card, matched: true }
                            : card
                    )
                );

                setPlayerScores((prevScores) => ({
                    ...prevScores,
                    [currentPlayer]: prevScores[currentPlayer] + 1,
                }));

                ws.send(
                    JSON.stringify({
                        type: 'update_game_state',
                        totalRounds: totalRounds + 1,
                        cards,
                        playerScores,
                        currentPlayer,
                        matched: false,
                    })
                );

                resetTurn(true);
            } else {
                setTimeout(() => {
                    ws.send(
                        JSON.stringify({
                            type: 'update_game_state',
                            totalRounds: totalRounds + 1,
                            cards,
                            playerScores,
                            currentPlayer: currentPlayer === 1 ? 2 : 1,
                            matched: false,
                        })
                    );
                    resetTurn(false)
                }, 1000);
            }
        }
    }, [choiceOne, choiceTwo]);

    useEffect(() => {
        if (cards.length > 0 && cards.every((card) => card.matched)) {
            setGameOver(true);
            ws.send(JSON.stringify({ type: 'game_over', playerScores }));
        }
    }, [cards]);

    const resetTurn = (matched) => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setDisabled(false);
        setTotalRounds((prevTurns) => prevTurns + 1);

        if (!matched) {
            setCurrentPlayer((prevPlayer) => (prevPlayer === 1 ? 2 : 1));
        }
    };

    useEffect(() => {
        shuffleCards();
    }, []);

    const handleNewGame = () => {
        if (ws) {
            setWaitingForOtherPlayer(true);
            ws.send(JSON.stringify({ type: 'new_game' }));
        }
    };

    return (
        <div className="App">
            <div className="game">
                <h1>星辰記憶 • Starry Memories</h1>

                {isConnecting && !gameStarted && <h2>Connecting to the game...</h2>}

                {!playerNameSet && !gameStarted && !isConnecting && (
                    <h2>Welcome! Please enter your name to join the game</h2>
                )}

                {playerNameSet && !gameStarted && !isConnecting && (
                    <h2>Waiting for another player to join...</h2>
                )}

                {gameStarted && (
                    <div className="card-grid">
                        {cards.map((card) => (
                            <SingleCard
                                key={card.id}
                                card={card}
                                handleChoice={handleChoice}
                                flipped={
                                    card === choiceOne ||
                                    card === choiceTwo ||
                                    card.matched
                                }
                                disabled={disabled}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="info">
                <div className="info-grid">
                    <h3>Your name:{' '} {playerNames[playerIndex] || '__________'}</h3>
                    <p>Total Rounds: {totalRounds}</p>
                    <p className="score-left">
                        {playerNames[1] || 'Player 1'} Score:{' '}
                        {playerScores[1]}
                    </p>
                    <p className="score-right">
                        {playerNames[2] || 'Player 2'} Score:{' '}
                        {playerScores[2]}
                    </p>
                    <p>
                        Who Trun:{' '}
                        {playerNames[currentPlayer] || `Player ${currentPlayer}`}
                    </p>
                </div>
                <ChatRoom ws={ws} messages={messages} />
            </div>

            {gameOver && (
                <div className="game-over">
                    <h1>Game End!!!</h1>
                    <h2>
                        Winner:{' '}
                        {playerScores[1] > playerScores[2]
                            ? playerNames[1]
                            : playerScores[1] < playerScores[2]
                                ? playerNames[2]
                                : 'Tie'}
                    </h2>
                    <h3>Total Rounds: {' ' + totalRounds}</h3>
                    {waitingForOtherPlayer !== true ? (
                        <button className="start-btn" onClick={handleNewGame}>
                            Start New Game
                        </button>
                    ) : (
                        <h2>Waiting for the other player to be ready...</h2>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;