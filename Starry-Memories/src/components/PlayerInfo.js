import React from 'react';
import './PlayerInfo.css'

const PlayerInfo = ({ playerScores, playerNames, currentPlayer, totalRounds }) => (
    <div className="info-grid">
        <p>Total Rounds: {totalRounds}</p>
        <p className="score-left">{playerNames[1] || 'Player 1'} Score: {playerScores[1]}</p>
        <p className="score-right">{playerNames[2] || 'Player 2'} Score: {playerScores[2]}</p>
        <p>Current Player: {playerNames[currentPlayer] || `Player ${currentPlayer}`}</p>
    </div>
);

export default PlayerInfo;