import { usePort } from '@renderer/hooks/usePort';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';

const TOTAL_ATTEMPTS = 10;

const Page = () => {
  const { data } = usePort();
  const [blockPosition, setBlockPosition] = useState(0);
  const [blockSpeed, setBlockSpeed] = useState(1);
  const [gameState, setGameState] = useState<{
    currentAttempt: number;
    scores: number[];
    isGameActive: boolean;
  }>({
    currentAttempt: 0,
    scores: [],
    isGameActive: false,
  });

  const [prevButtonPressed, setPrevButtonPressed] = useState(false);
  const [targetZone] = useState({ start: 45, end: 55 });
  const animationRef = useRef<number | null>(null);

  const startGame = () => {
    setBlockSpeed(randomSpeed());
    setGameState({
      currentAttempt: 1,
      scores: [],
      isGameActive: true,
    });
    setBlockPosition(0);
    setPrevButtonPressed(false);
  };

  useEffect(() => {
    const moveBlock = () => {
      setBlockPosition((prev) => {
        const next = prev + blockSpeed;
        if (next > 100) {
          setGameState((prevState) => {
            const nextAttempt = prevState.currentAttempt + 1;
            if (nextAttempt > TOTAL_ATTEMPTS) {
              return { ...prevState, isGameActive: false };
            } else {
              setBlockSpeed(randomSpeed());
              return { ...prevState, currentAttempt: nextAttempt };
            }
          });
          return 0;
        }
        return next;
      });

      if (gameState.isGameActive && animationRef.current !== null) {
        animationRef.current = requestAnimationFrame(moveBlock);
      }
    };

    if (gameState.isGameActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(moveBlock);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [gameState.isGameActive, blockSpeed]);

  useEffect(() => {
    if (!gameState.isGameActive) return;

    const buttonPressed = data?.buttons[3] ?? false;
    if (buttonPressed && !prevButtonPressed) {
      const score = Math.round(calculateScore(blockPosition, targetZone));
      setGameState((prevState) => {
        const updatedScores = [...prevState.scores, score];
        if (updatedScores.length >= TOTAL_ATTEMPTS) {
          return { ...prevState, scores: updatedScores, isGameActive: false };
        }
        return { ...prevState, scores: updatedScores };
      });
    }
    setPrevButtonPressed(buttonPressed);
  }, [data?.buttons, blockPosition, gameState.isGameActive, prevButtonPressed]);

  const calculateScore = (position: number, target: { start: number; end: number }) => {
    const center = (target.start + target.end) / 2;
    const difference = Math.abs(position - center);
    return Math.max(100 - difference * 10, 0);
  };

  const randomSpeed = () => Math.random() * 1.4 + 0.5;

  const totalScore = gameState.scores.reduce((a, b) => a + b, 0);
  const lastScore =
    gameState.scores.length > 0 ? gameState.scores[gameState.scores.length - 1] : null;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    margin: 0,
    background: '#222',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif',
    color: '#eee',
    textAlign: 'center',
  };

  const wrapperStyle: React.CSSProperties = {
    width: '90%',
    maxWidth: '600px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2em',
    fontWeight: 'bold',
    marginBottom: '40px',
  };

  const buttonStyle: React.CSSProperties = {
    background: '#444',
    color: '#eee',
    border: 'none',
    borderRadius: '5px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
  };

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '50px',
    background: '#333',
    borderRadius: '5px',
    overflow: 'hidden',
    margin: '20px 0',
  };

  const blockStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${blockPosition}%`,
    width: '10px',
    height: '50px',
    background: '#00adee',
  };

  const targetStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${targetZone.start}%`,
    width: `${targetZone.end - targetZone.start}%`,
    height: '50px',
    background: 'rgba(110,230,0,0.6)',
  };

  const attemptStyle: React.CSSProperties = {
    fontSize: '18px',
    marginTop: '10px',
  };

  const scoreStyle: React.CSSProperties = {
    fontSize: '18px',
    marginTop: '10px',
    color: '#ffeb3b',
  };

  const totalScoreStyle: React.CSSProperties = {
    fontSize: '20px',
    marginTop: '10px',
    color: '#f1c40f',
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>타이밍 게임</h1>
        {!gameState.isGameActive && gameState.currentAttempt < TOTAL_ATTEMPTS && (
          <button style={buttonStyle} onClick={startGame}>
            게임 시작
          </button>
        )}

        {gameState.isGameActive && (
          <>
            <div style={trackStyle}>
              <div style={blockStyle} />
              <div style={targetStyle} />
            </div>
            <p style={attemptStyle}>
              현재 시도: {gameState.currentAttempt}/{TOTAL_ATTEMPTS}
            </p>
            {lastScore !== null && <div style={scoreStyle}>이번 획득 점수: {lastScore}/100</div>}
            {gameState.scores.length > 0 && (
              <div style={totalScoreStyle}>누적 점수: {totalScore}</div>
            )}
            <div style={{ fontSize: '16px', marginTop: '10px', color: '#aaa' }}>
              현재 블럭 속도: {blockSpeed.toFixed(2)}
            </div>
          </>
        )}

        {!gameState.isGameActive && gameState.currentAttempt >= TOTAL_ATTEMPTS && (
          <div style={totalScoreStyle}>총점: {totalScore}/1000</div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_games/reactionSpeed/')({
  component: Page,
});
