
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Timer, Bell, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimerStep {
  id: string;
  name: string;
  duration: number; // in seconds
  completed: boolean;
}

interface ProductionTimerWidgetProps {
  recipe: {
    name: string;
    preparation_time: number; // in minutes
    recipe_instructions?: Array<{
      id: string;
      step_number: number;
      instruction: string;
    }>;
  };
  className?: string;
}

const ProductionTimerWidget: React.FC<ProductionTimerWidgetProps> = ({
  recipe,
  className
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [timerSteps, setTimerSteps] = useState<TimerStep[]>([]);

  // Initialize timer steps from recipe instructions
  useEffect(() => {
    if (recipe.recipe_instructions && recipe.recipe_instructions.length > 0) {
      const steps = recipe.recipe_instructions
        .sort((a, b) => a.step_number - b.step_number)
        .map((instruction, index) => ({
          id: instruction.id,
          name: `Passo ${instruction.step_number}`,
          duration: Math.ceil((recipe.preparation_time * 60) / recipe.recipe_instructions!.length), // Distribute time evenly
          completed: false
        }));
      setTimerSteps(steps);
    } else {
      // Create a single step for the entire recipe
      setTimerSteps([{
        id: 'complete',
        name: 'Preparazione Completa',
        duration: recipe.preparation_time * 60,
        completed: false
      }]);
    }
  }, [recipe]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timerSteps.length > 0) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const currentStepData = timerSteps[currentStep];
          
          if (currentStepData && newTime >= getTotalTimeForStep(currentStep + 1)) {
            // Current step completed
            setTimerSteps(steps => 
              steps.map((step, index) => 
                index === currentStep ? { ...step, completed: true } : step
              )
            );
            
            // Move to next step or complete
            if (currentStep < timerSteps.length - 1) {
              setCurrentStep(prev => prev + 1);
            } else {
              // All steps completed
              setIsRunning(false);
              playNotificationSound();
            }
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, currentStep, timerSteps]);

  const getTotalTimeForStep = (stepIndex: number) => {
    return timerSteps.slice(0, stepIndex).reduce((total, step) => total + step.duration, 0);
  };

  const getCurrentStepProgress = () => {
    if (timerSteps.length === 0) return 0;
    const stepStartTime = getTotalTimeForStep(currentStep);
    const stepDuration = timerSteps[currentStep]?.duration || 1;
    const stepElapsedTime = currentTime - stepStartTime;
    return Math.min((stepElapsedTime / stepDuration) * 100, 100);
  };

  const getTotalProgress = () => {
    const totalDuration = timerSteps.reduce((total, step) => total + step.duration, 0);
    return totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = () => {
    // Simple notification - in a real app you might use a proper notification sound
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setCurrentStep(0);
    setTimerSteps(steps => steps.map(step => ({ ...step, completed: false })));
  };

  const totalDuration = timerSteps.reduce((total, step) => total + step.duration, 0);
  const isCompleted = currentStep >= timerSteps.length - 1 && getTotalProgress() >= 100;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800">Timer Produzione</h3>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "In corso" : isCompleted ? "Completato" : "Pronto"}
          </Badge>
        </div>

        {/* Recipe Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-slate-800 mb-1">{recipe.name}</h4>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Tempo previsto: {formatTime(totalDuration)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bell className="w-4 h-4" />
              <span>{timerSteps.length} passi</span>
            </div>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-mono font-bold text-slate-800">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-slate-500">
            di {formatTime(totalDuration)}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {/* Total Progress */}
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Progresso Totale</span>
              <span>{Math.round(getTotalProgress())}%</span>
            </div>
            <Progress value={getTotalProgress()} className="h-2" />
          </div>

          {/* Current Step Progress */}
          {timerSteps.length > 1 && (
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{timerSteps[currentStep]?.name || ''}</span>
                <span>{Math.round(getCurrentStepProgress())}%</span>
              </div>
              <Progress value={getCurrentStepProgress()} className="h-2" />
            </div>
          )}
        </div>

        {/* Steps List */}
        {timerSteps.length > 1 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-slate-700">Passi:</h5>
            <div className="space-y-1">
              {timerSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded text-sm",
                    step.completed && "bg-green-50 text-green-800",
                    index === currentStep && !step.completed && "bg-blue-50 text-blue-800",
                    index > currentStep && "text-slate-500"
                  )}
                >
                  <span className="flex items-center space-x-2">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold",
                      step.completed && "bg-green-500 text-white",
                      index === currentStep && !step.completed && "bg-blue-500 text-white",
                      index > currentStep && "bg-gray-300 text-gray-600"
                    )}>
                      {index + 1}
                    </div>
                    <span>{step.name}</span>
                  </span>
                  <span>{formatTime(step.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex space-x-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1"
              disabled={isCompleted}
            >
              <Play className="w-4 h-4 mr-1" />
              {isCompleted ? 'Completato' : 'Avvia'}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="secondary"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pausa
            </Button>
          )}
          
          <Button
            onClick={handleStop}
            variant="outline"
            disabled={currentTime === 0}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        {/* Completion Alert */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <Bell className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-800">
              Ricetta completata! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductionTimerWidget;
