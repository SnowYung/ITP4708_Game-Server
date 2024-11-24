import React from 'react';
import SingleCard from './SingleCard';
import './GameBoard.css';

const GameBoard = ({ cards, handleChoice, choiceOne, choiceTwo, disabled }) => (
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
);

export default GameBoard;