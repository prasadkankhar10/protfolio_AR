import { useGameStore } from '../store/useGameStore';
import { LoadingScreen } from './ui/LoadingScreen';
import { MainMenu } from './ui/MainMenu';
import { PortfolioSections } from './ui/PortfolioSections';
import { HUD } from './ui/HUD';
import { useEffect } from 'react';

export const Layout = () => {
  const isLoaded = useGameStore((state) => state.isLoaded);
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);

  // Handle escape key to open menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('menu');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, setGameState]);

  return (
    <>
      {!isLoaded && <LoadingScreen />}
      {isLoaded && gameState === 'menu' && <MainMenu />}
      {isLoaded && gameState === 'playing' && <HUD />}
      <PortfolioSections />
    </>
  );
};
