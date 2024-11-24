import React from 'react';
import './GameOver.css';

const GameOver = ({ totalRounds, playerScores, shuffleCards }) => (
    <div className="game-over">
        <h2>Game Over!</h2>
        <p>Total Rounds: {totalRounds}</p>
        <p>Winner: Player {playerScores[1] > playerScores[2] ? 1 : playerScores[1] < playerScores[2] ? 2 : "Tie"}</p>
        <button className="start-btn" onClick={shuffleCards}>New Game</button>
    </div>
);

export default GameOver;