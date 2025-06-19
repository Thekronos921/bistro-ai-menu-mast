import React, { useState, useEffect } from 'react';
import { X, Timer, ChefHat, Users, Clock, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types/recipe';

interface KitchenModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

const KitchenModeModal: React.FC<KitchenModeModalProps> = ({
  isOpen,
  onClose,
  recipe
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keepScreenOn, setKeepScreenOn] = useState(true);

  if (!recipe) return null;

  const instructions = recipe.recipe_instructions?.sort((a, b) => a.step_number - b.step_number) || [];
  const estimatedTimePerStep = instructions.length > 0 ? Math.ceil(recipe.preparation_time / instructions.length) : recipe.preparation_time;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Keep screen on (if supported)
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && keepScreenOn) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.log('Wake lock request failed:', err);
        }
      }
    };

    if (isOpen && keepScreenOn) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isOpen, keepScreenOn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(prev => prev + 1);
      if (soundEnabled && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeElapsed(0);
  };

  const progressPercentage = instructions.length > 0 ? ((currentStep + 1) / instructions.length) * 100 : 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-full w-screen h-screen max-h-screen p-0 bg-slate-900 text-white">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <ChefHat className="w-6 h-6 text-orange-400" />
              <div>
                <h1 className="text-lg font-bold">{recipe.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-300">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.portions} porzioni</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.preparation_time} min</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-slate-300 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Timer Section */}
          <div className="bg-slate-800 p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-green-400">
                    {formatTime(timeElapsed)}
                  </div>
                  <div className="text-xs text-slate-400">Tempo trascorso</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-300">
                    {estimatedTimePerStep} min
                  </div>
                  <div className="text-xs text-slate-400">Tempo stimato passo</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant={timerActive ? "destructive" : "default"}
                  onClick={toggleTimer}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Timer className="w-4 h-4 mr-1" />
                  {timerActive ? 'Pausa' : 'Avvia'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetTimer}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-800 px-4 pb-4">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Passo {currentStep + 1} di {instructions.length}</span>
              <span>{Math.round(progressPercentage)}% completato</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-slate-700" />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Current Step */}
            <div className="flex-1 p-6">
              {instructions.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Badge className="bg-orange-600 text-white text-lg px-4 py-2 mb-4">
                      Passo {instructions[currentStep].step_number}
                    </Badge>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-6 text-center">
                    <p className="text-xl leading-relaxed">
                      {instructions[currentStep].instruction}
                    </p>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 0}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      size="lg"
                    >
                      ← Precedente
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={currentStep >= instructions.length - 1}
                      className="bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {currentStep >= instructions.length - 1 ? 'Completato!' : 'Successivo →'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Nessuna istruzione disponibile</p>
                  <p>Utilizza il timer per monitorare la preparazione</p>
                </div>
              )}
            </div>

            {/* Sidebar with ingredients and steps */}
            <div className="w-80 bg-slate-800 border-l border-slate-700 p-4">
              <div className="space-y-6">
                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold text-slate-300 mb-3 flex items-center">
                    <ChefHat className="w-4 h-4 mr-2" />
                    Ingredienti
                  </h3>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {recipe.recipe_ingredients?.map((ri) => (
                        <div key={ri.id} className="flex justify-between text-sm bg-slate-700 rounded p-2">
                          <span className={cn(
                            ri.is_semilavorato && "text-purple-300"
                          )}>
                            {ri.is_semilavorato ? '[S] ' : ''}{ri.ingredients.name}
                          </span>
                          <span className="text-slate-300">
                            {ri.quantity} {ri.unit || ri.ingredients.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* All Steps */}
                <div>
                  <h3 className="font-semibold text-slate-300 mb-3">Tutti i Passi</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {instructions.map((instruction, index) => (
                        <button
                          key={instruction.id}
                          onClick={() => setCurrentStep(index)}
                          className={cn(
                            "w-full text-left p-2 rounded text-sm transition-colors",
                            index === currentStep && "bg-orange-600 text-white",
                            index < currentStep && "bg-green-700 text-green-100",
                            index > currentStep && "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">#{instruction.step_number}</span>
                            <span className="truncate">{instruction.instruction}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with completion status */}
          {currentStep >= instructions.length - 1 && instructions.length > 0 && (
            <div className="bg-green-700 p-4 text-center">
              <div className="text-lg font-bold">🎉 Ricetta Completata!</div>
              <div className="text-sm opacity-90">
                Tempo totale: {formatTime(timeElapsed)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KitchenModeModal;
