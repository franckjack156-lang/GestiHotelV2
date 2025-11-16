/**
 * Onglet Temps - Suivi du temps (manuel ou chronomètre)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Intervention } from '../../types/intervention.types';
import { cn } from '@/shared/lib/utils';
import { useTimeSessions } from '../../hooks/useTimeSessions';

interface TimeTrackingTabProps {
  intervention: Intervention;
}

export const TimeTrackingTab = ({ intervention }: TimeTrackingTabProps) => {
  const { sessions, isLoading, isSubmitting, getTotalTime, addSession, removeSession } =
    useTimeSessions(intervention.id);

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [notes, setNotes] = useState('');

  // Chronomètre
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    if (!timerStartTime) {
      setTimerStartTime(new Date());
    }
    toast.success('Chronomètre démarré');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    toast.info('Chronomètre en pause');
  };

  const handleStopTimer = async () => {
    if (timerSeconds === 0) return;

    const minutes = Math.floor(timerSeconds / 60);
    const endTime = new Date();

    const success = await addSession({
      duration: minutes,
      startedAt: timerStartTime || new Date(Date.now() - timerSeconds * 1000),
      endedAt: endTime,
      isManual: false,
      notes: notes || undefined,
    });

    if (success) {
      setIsTimerRunning(false);
      setTimerSeconds(0);
      setTimerStartTime(null);
      setNotes('');
    }
  };

  const handleAddManualTime = async () => {
    const totalMinutes = manualHours * 60 + manualMinutes;
    if (totalMinutes === 0) {
      toast.error('Veuillez saisir une durée');
      return;
    }

    const now = new Date();
    const success = await addSession({
      duration: totalMinutes,
      startedAt: new Date(now.getTime() - totalMinutes * 60 * 1000),
      endedAt: now,
      isManual: true,
      notes: notes || undefined,
    });

    if (success) {
      setManualHours(0);
      setManualMinutes(0);
      setNotes('');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await removeSession(sessionId);
  };

  const getTotalMinutes = () => {
    return getTotalTime();
  };

  const getVariance = () => {
    if (!intervention.estimatedDuration) return null;
    const total = getTotalMinutes();
    const variance =
      ((total - intervention.estimatedDuration) / intervention.estimatedDuration) * 100;
    return variance;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Temps estimé</p>
                <p className="text-2xl font-bold">
                  {intervention.estimatedDuration
                    ? formatDuration(intervention.estimatedDuration)
                    : 'Non défini'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Temps passé</p>
                <p className="text-2xl font-bold">{formatDuration(getTotalMinutes())}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Écart</p>
                {getVariance() !== null ? (
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-2xl font-bold',
                        getVariance()! > 0 ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {Math.abs(getVariance()!).toFixed(0)}%
                    </p>
                    {getVariance()! > 0 ? (
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-400">-</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modes de saisie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ajouter du temps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timer">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timer">Chronomètre</TabsTrigger>
              <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
            </TabsList>

            {/* Chronomètre */}
            <TabsContent value="timer" className="mt-6">
              <div className="flex flex-col items-center gap-6">
                <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white">
                  {formatTimer(timerSeconds)}
                </div>

                <div className="flex gap-3">
                  {!isTimerRunning && timerSeconds === 0 && (
                    <Button onClick={handleStartTimer} className="bg-green-600 hover:bg-green-700">
                      <Play className="mr-2 h-4 w-4" />
                      Démarrer
                    </Button>
                  )}
                  {isTimerRunning && (
                    <Button onClick={handlePauseTimer} variant="outline">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  {!isTimerRunning && timerSeconds > 0 && (
                    <Button onClick={handleStartTimer} className="bg-green-600 hover:bg-green-700">
                      <Play className="mr-2 h-4 w-4" />
                      Reprendre
                    </Button>
                  )}
                  {timerSeconds > 0 && (
                    <Button onClick={handleStopTimer} variant="destructive">
                      <Square className="mr-2 h-4 w-4" />
                      Arrêter et enregistrer
                    </Button>
                  )}
                </div>

                {timerSeconds > 0 && !isTimerRunning && (
                  <p className="text-sm text-gray-500">
                    Temps actuel : {Math.floor(timerSeconds / 60)} minutes
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Saisie manuelle */}
            <TabsContent value="manual" className="mt-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hours">Heures</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      value={manualHours}
                      onChange={e => setManualHours(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minutes">Minutes</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={manualMinutes}
                      onChange={e => setManualMinutes(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Description du travail effectué..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>

                <Button onClick={handleAddManualTime} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter le temps saisi
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Historique des sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sessions enregistrées</span>
            <Badge variant="secondary">{sessions.length} session(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Chargement des sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucune session enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{session.technicianName}</Badge>
                        <Badge className="bg-blue-600">{formatDuration(session.duration)}</Badge>
                        {session.isManual && (
                          <Badge variant="outline" className="text-xs">
                            Manuel
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <strong>Début:</strong>{' '}
                          {format(session.startedAt.toDate(), 'dd MMM yyyy à HH:mm', {
                            locale: fr,
                          })}
                        </p>
                        {session.endedAt && (
                          <p>
                            <strong>Fin:</strong>{' '}
                            {format(session.endedAt.toDate(), 'dd MMM yyyy à HH:mm', {
                              locale: fr,
                            })}
                          </p>
                        )}
                        {session.notes && (
                          <p className="italic">
                            <strong>Notes:</strong> {session.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
