import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameSettings from './GameSettings';
import GameBoard from './GameBoard';

const GameEntry: React.FC = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleStartGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setGameStarted(true);
  };

  const handleBackToSettings = () => {
    setGameStarted(false);
  };

  if (gameStarted) {
    return <GameBoard difficulty={selectedDifficulty} />;
  }

  return (
    <GameSettings
      onStartGame={handleStartGame}
    />
  );
};

export default GameEntry;
