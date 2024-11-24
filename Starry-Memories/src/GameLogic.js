import { useState, useEffect } from 'react';
import cardImages from './components/cardImages';

export const useGameLogic = (ws) => {
    const [cards, setCards] = useState([]);
    const [choiceOne, setChoiceOne] = useState(null);
    const [choiceTwo, setChoiceTwo] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const [playerScores, setPlayerScores] = useState({ 1: 0, 2: 0 });
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [totalRounds, setTotalRounds] = useState(0);

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
    };

    const handleChoice = (card) => {
        if (!disabled && !gameOver) {
            if (choiceOne) {
                setChoiceTwo(card);
            } else {
                setChoiceOne(card);
            }
        }
    };

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
            if (ws) {
                ws.send(JSON.stringify({ type: 'game_over', playerScores }));
            }
        }
    }, [cards, ws]);

    useEffect(() => {
        shuffleCards();
    }, []);

    return {
        cards, choiceOne, choiceTwo, handleChoice, playerScores, currentPlayer,
        gameOver, totalRounds, shuffleCards, disabled
    };
};