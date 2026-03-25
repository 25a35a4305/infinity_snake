/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Trophy, RefreshCw, Terminal, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const INITIAL_SPEED = 150;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "SYSTEM_FAILURE.MP3",
    artist: "NULL_PTR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/cyber/200/200"
  },
  {
    id: 2,
    title: "NEURAL_OVERLOAD.WAV",
    artist: "VOID_WALKER",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon/200/200"
  },
  {
    id: 3,
    title: "KERNEL_PANIC.OGG",
    artist: "ROOT_ACCESS",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch/200/200"
  }
];

// --- Components ---

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  const currentTrack = TRACKS[currentTrackIndex];

  // --- Music Logic ---

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  // --- Snake Logic ---

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPaused(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        setIsPaused(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ': 
          if (gameOver) resetGame();
          else setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED - Math.min(score / 2, 100));
    return () => clearInterval(interval);
  }, [moveSnake, score]);

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono selection:bg-magenta-500/50 overflow-hidden flex flex-col relative">
      <div className="crt-overlay" />
      <div className="scanline" />

      {/* Header */}
      <header className="relative z-10 p-4 flex justify-between items-center border-b-2 border-magenta-500/50 bg-black/80">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-400 flex items-center justify-center tearing">
            <Terminal className="text-cyan-400 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-pixel glitch-text tracking-tight" data-text="NEURAL_SNAKE_v1.0">
              NEURAL_SNAKE_v1.0
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-magenta-500">
              <Zap size={10} />
              <span>CONNECTION_STABLE</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="border-2 border-magenta-500/30 p-2 text-right">
            <div className="text-[8px] uppercase text-magenta-500">HIGH_SCORE</div>
            <div className="text-xl font-pixel text-magenta-400">{highScore.toString().padStart(4, '0')}</div>
          </div>
          <div className="border-2 border-cyan-500/30 p-2 text-right">
            <div className="text-[8px] uppercase text-cyan-500">CURRENT_SCORE</div>
            <div className="text-xl font-pixel text-cyan-400">{score.toString().padStart(4, '0')}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col lg:flex-row items-center justify-center p-4 gap-8">
        
        {/* Game Area */}
        <div className="relative">
          <div className="absolute -inset-2 bg-magenta-500/20 blur-xl animate-pulse"></div>
          
          <div className="relative bg-black border-4 border-cyan-400 p-1 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <div 
              className="grid bg-[#050505]" 
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 'min(80vw, 480px)',
                height: 'min(80vw, 480px)'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnakeHead = snake[0].x === x && snake[0].y === y;
                const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                  <div 
                    key={i} 
                    className={`border-[0.5px] border-cyan-900/20 ${
                      isSnakeHead ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' :
                      isSnakeBody ? 'bg-cyan-800' :
                      isFood ? 'bg-magenta-500 shadow-[0_0_10px_#d946ef] animate-pulse' :
                      'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {(isPaused || gameOver) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-50"
                >
                  {gameOver ? (
                    <div className="tearing">
                      <h2 className="text-4xl font-pixel text-magenta-500 mb-4 glitch-text" data-text="CRITICAL_FAILURE">CRITICAL_FAILURE</h2>
                      <p className="text-cyan-400/60 mb-8 font-mono">CORE_DUMP: {score} BYTES_RECOVERED</p>
                      <button 
                        onClick={resetGame}
                        className="border-2 border-cyan-400 px-8 py-3 text-cyan-400 font-pixel text-xs hover:bg-cyan-400 hover:text-black transition-all"
                      >
                        REBOOT_SYSTEM
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-4xl font-pixel text-cyan-400 mb-4 glitch-text" data-text="SYSTEM_IDLE">SYSTEM_IDLE</h2>
                      <p className="text-cyan-400/60 mb-8">INPUT_REQUIRED: [SPACE]</p>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="w-20 h-20 border-2 border-cyan-400 flex items-center justify-center hover:bg-cyan-400/20 transition-all"
                      >
                        <Play size={40} fill="currentColor" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-full lg:w-64">
          <div className="border-2 border-cyan-400/30 p-4 bg-black/50">
            <div className="flex items-center gap-2 mb-4 text-magenta-500">
              <Cpu size={16} />
              <h3 className="text-[10px] font-pixel">SUBSYSTEMS</h3>
            </div>
            <div className="space-y-4 text-[10px]">
              <div className="flex justify-between border-b border-cyan-900 pb-1">
                <span className="text-cyan-700">NAV_INPUT</span>
                <span className="text-cyan-400">[ARROWS]</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900 pb-1">
                <span className="text-cyan-700">EXEC_CMD</span>
                <span className="text-cyan-400">[SPACE]</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900 pb-1">
                <span className="text-cyan-700">AUDIO_SYNC</span>
                <span className="text-cyan-400">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-magenta-500/30 p-4 bg-black/50 overflow-hidden">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Zap size={16} />
              <h3 className="text-[10px] font-pixel">LOG_OUTPUT</h3>
            </div>
            <div className="font-mono text-[8px] text-magenta-500/70 h-24 overflow-hidden">
              {`> INITIALIZING_NEURAL_LINK...
> LOADING_ASSETS...
> SNAKE_CORE_LOADED.
> AUDIO_ENGINE_READY.
> WAITING_FOR_USER_INPUT...
> SCORE_BUFFER_CLEARED.
> SYSTEM_STATUS: NOMINAL.`}
            </div>
          </div>
        </div>
      </main>

      {/* Music Player Bar */}
      <footer className="relative z-20 p-4 bg-black border-t-2 border-cyan-400/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <div className="relative w-12 h-12 border border-magenta-500 p-1">
              <img 
                src={currentTrack.cover} 
                alt={currentTrack.title} 
                className={`w-full h-full object-cover grayscale contrast-125 ${isPlaying ? 'animate-pulse' : ''}`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-pixel text-[10px] text-cyan-400 truncate">{currentTrack.title}</h4>
              <p className="text-[8px] text-magenta-500 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
            <div className="flex items-center gap-8">
              <button onClick={prevTrack} className="text-cyan-400/50 hover:text-cyan-400 transition-colors">
                <SkipBack size={20} />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 border-2 border-magenta-500 flex items-center justify-center text-magenta-500 hover:bg-magenta-500 hover:text-black transition-all"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button onClick={nextTrack} className="text-cyan-400/50 hover:text-cyan-400 transition-colors">
                <SkipForward size={20} />
              </button>
            </div>
            
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-1 bg-cyan-900">
                <div 
                  className="h-full bg-magenta-500 shadow-[0_0_10px_#d946ef]" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
            <Volume2 size={14} className="text-cyan-900" />
            <div className="w-20 h-1 bg-cyan-900">
              <div className="w-2/3 h-full bg-cyan-400" />
            </div>
          </div>
        </div>
      </footer>

      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextTrack}
      />
    </div>
  );
}
