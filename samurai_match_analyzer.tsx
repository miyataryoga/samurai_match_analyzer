import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlayCircle, PauseCircle, RotateCcw, Plus, Minus, Flag } from 'lucide-react';

const FootballAnalyzer = () => {
  const [timeMs, setTimeMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [possession, setPossession] = useState('Samurai');
  const [showSummary, setShowSummary] = useState(false);
  const lastUpdateRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [stats, setStats] = useState({
    samurai: {
      passes: 0,
      shots: 0,
      dribbles: 0,
      possessionTime: 0,
    },
    away: {
      passes: 0,
      shots: 0,
      dribbles: 0,
      possessionTime: 0,
    },
    neutral: {
      possessionTime: 0
    }
  });

  const updateTimer = useCallback((timestamp) => {
    if (!lastUpdateRef.current) {
      lastUpdateRef.current = timestamp;
    }

    const deltaTime = timestamp - lastUpdateRef.current;
    lastUpdateRef.current = timestamp;

    setTimeMs(prevTime => prevTime + deltaTime);
    setStats(prevStats => ({
      ...prevStats,
      [possession.toLowerCase()]: {
        ...prevStats[possession.toLowerCase()],
        possessionTime: prevStats[possession.toLowerCase()].possessionTime + deltaTime,
      },
    }));

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  }, [isRunning, possession]);

  useEffect(() => {
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastUpdateRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, updateTimer]);

  const handleAction = useCallback((team, action, increment) => {
    if (possession.toLowerCase() === team || increment === false) {
      setStats((prevStats) => ({
        ...prevStats,
        [team]: {
          ...prevStats[team],
          [action]: Math.max(0, prevStats[team][action] + (increment ? 1 : -1)),
        },
      }));
    }
  }, [possession]);

  const setPossessionTeam = useCallback((team) => {
    setPossession(team);
  }, []);

  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();
      
      if (key === ' ') {
        setPossessionTeam(possession === 'Samurai' ? 'Away' : 'Samurai');
        event.preventDefault();
      } else if (key === 'n') {
        setPossessionTeam('Neutral');
      } else if (key === 'm') {
        setIsRunning(prev => !prev);
      }

      if (possession !== 'Neutral') {
        const team = possession.toLowerCase();
        switch (key) {
          case 'a':
            handleAction(team, 'passes', true);
            break;
          case 's':
            handleAction(team, 'shots', true);
            break;
          case 'd':
            handleAction(team, 'dribbles', true);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleAction, possession, setPossessionTeam]);

  const formatTime = (milliseconds) => {
    const totalSeconds = milliseconds / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = (totalSeconds % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  };

  const calculatePossessionPercentage = (team) => {
    const totalActiveTime = stats.samurai.possessionTime + stats.away.possessionTime;
    if (totalActiveTime === 0) return 0;
    
    if (team === 'samurai' || team === 'away') {
      return Math.round((stats[team].possessionTime / totalActiveTime) * 100);
    }
    
    return stats[team].possessionTime;
  };

  const handleFinish = () => {
    setIsRunning(false);
    setShowSummary(true);
  };

  const resetStats = () => {
    setTimeMs(0);
    setIsRunning(false);
    setPossession('Samurai');
    lastUpdateRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStats({
      samurai: { passes: 0, shots: 0, dribbles: 0, possessionTime: 0 },
      away: { passes: 0, shots: 0, dribbles: 0, possessionTime: 0 },
      neutral: { possessionTime: 0 }
    });
  };

  const ActionButtons = ({ team, action, label }) => (
    <div className="grid grid-cols-3 gap-1 mb-2">
      <Button 
        className="w-full"
        onClick={() => handleAction(team, action, false)}
        variant={possession === (team === 'samurai' ? 'Samurai' : 'Away') ? 'default' : 'outline'}
        disabled={possession === 'Neutral' || stats[team][action] === 0}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="flex items-center justify-center font-medium">
        {label}: {stats[team][action]}
      </div>
      <Button 
        className="w-full"
        onClick={() => handleAction(team, action, true)}
        variant={possession === (team === 'samurai' ? 'Samurai' : 'Away') ? 'default' : 'outline'}
        disabled={possession === 'Neutral'}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  const MatchSummary = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="font-bold">Samurai</div>
        <div className="font-bold">Stat</div>
        <div className="font-bold">Away</div>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>{stats.samurai.passes}</div>
          <div className="text-gray-600">Passes</div>
          <div>{stats.away.passes}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>{stats.samurai.shots}</div>
          <div className="text-gray-600">Shots</div>
          <div>{stats.away.shots}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>{stats.samurai.dribbles}</div>
          <div className="text-gray-600">Dribbles</div>
          <div>{stats.away.dribbles}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>{calculatePossessionPercentage('samurai')}%</div>
          <div className="text-gray-600">Possession</div>
          <div>{calculatePossessionPercentage('away')}%</div>
        </div>
      </div>

      <div className="text-center text-gray-600">
        <div>Total Match Time: {formatTime(timeMs)}</div>
        <div>Neutral Time: {formatTime(calculatePossessionPercentage('neutral'))}</div>
      </div>

      <div className="text-center text-sm text-gray-500">
        Stats per Minute:
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div>
            Passes: {(stats.samurai.passes / (timeMs / 60000)).toFixed(1)}
            <br />
            Shots: {(stats.samurai.shots / (timeMs / 60000)).toFixed(1)}
            <br />
            Dribbles: {(stats.samurai.dribbles / (timeMs / 60000)).toFixed(1)}
          </div>
          <div></div>
          <div>
            Passes: {(stats.away.passes / (timeMs / 60000)).toFixed(1)}
            <br />
            Shots: {(stats.away.shots / (timeMs / 60000)).toFixed(1)}
            <br />
            Dribbles: {(stats.away.dribbles / (timeMs / 60000)).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Samurai Match Analyzer</CardTitle>
          <div className="text-sm text-gray-500">
            Keyboard Controls:
            <br />
            Space - Toggle possession between Samurai/Away
            <br />
            N - Set possession to Neutral
            <br />
            M - Start/Stop timer
            <br />
            A - Add pass
            <br />
            S - Add shot
            <br />
            D - Add dribble
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="text-4xl font-bold">{formatTime(timeMs)}</div>
            <Button 
              onClick={() => setIsRunning(!isRunning)}
              variant="outline"
            >
              {isRunning ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
            </Button>
            <Button 
              onClick={resetStats}
              variant="outline"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button 
              onClick={() => setPossessionTeam('Samurai')}
              variant={possession === 'Samurai' ? 'default' : 'outline'}
              className="w-full"
            >
              Samurai
            </Button>
            <Button 
              onClick={() => setPossessionTeam('Neutral')}
              variant={possession === 'Neutral' ? 'default' : 'outline'}
              className="w-full"
            >
              Neutral
            </Button>
            <Button 
              onClick={() => setPossessionTeam('Away')}
              variant={possession === 'Away' ? 'default' : 'outline'}
              className="w-full"
            >
              Away
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-center mb-4">Samurai</h3>
              <ActionButtons team="samurai" action="passes" label="Pass" />
              <ActionButtons team="samurai" action="shots" label="Shot" />
              <ActionButtons team="samurai" action="dribbles" label="Dribble" />
              <div className="text-center mt-2">
                Possession: {calculatePossessionPercentage('samurai')}%
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-center mb-4">Away Team</h3>
              <ActionButtons team="away" action="passes" label="Pass" />
              <ActionButtons team="away" action="shots" label="Shot" />
              <ActionButtons team="away" action="dribbles" label="Dribble" />
              <div className="text-center mt-2">
                Possession: {calculatePossessionPercentage('away')}%
              </div>
            </div>
          </div>

          <div className="mt-4 text-center mb-6">
            Neutral Time: {formatTime(calculatePossessionPercentage('neutral'))}
          </div>

          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogTrigger asChild>
              <Button 
                className="w-full"
                variant="default"
                onClick={handleFinish}
              >
                <Flag className="h-4 w-4 mr-2" />
                Finish Match
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Match Summary</DialogTitle>
              </DialogHeader>
              <MatchSummary />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default FootballAnalyzer;
