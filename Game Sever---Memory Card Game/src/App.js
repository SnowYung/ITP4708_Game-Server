import { useEffect, useState } from 'react';
import './App.css'
import SingleCard from './components/SingleCard';

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

    const [cards, setCards] = useState([]);
    const [totalrounds, setTotalRounds] = useState(0);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [playerScores, setPlayerScores] = useState({ 1: 0, 2: 0 });
    const [gameOver, setGameOver] = useState(false);

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
            choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);

            if (choiceOne.src === choiceTwo.src) {
                setCards(prevCards => {
                    return prevCards.map(card => {
                        if (card.src === choiceOne.src) {
                            return { ...card, matched: true };
                        } else {
                            return card;
                        }
                    });
                });

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
            <div class="game">
                <h1>Fabled Elements</h1>
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
            </div>
            <div class="info">
                <div className="info-grid">
                    <p>Totel Rounds: {totalrounds}</p>
                    <p className="score-left">Player 1 Score: {playerScores[1]}</p>
                    <p className="score-right">Player 2 Score: {playerScores[2]}</p>
                    <p>currentPlayer : Player {currentPlayer}</p>
                </div>

                <div class="chat">
                    <div className="chat-grid">
                        {!gameOver && (
                            <button onClick={shuffleCards}>New Game</button>
                        )}
                        {gameOver && (
                            <div>
                                <h2>Game Over!</h2>
                                <p>Total Rounds: {totalrounds}</p>
                                <p>Winner: Player {playerScores[1] > playerScores[2] ? 1 : playerScores[1] < playerScores[2] ? 2 : "Tie"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App