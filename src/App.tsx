import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Castle,
  Flag,
  Scroll,
  Train,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  History,
  AlertTriangle,
  Lightbulb,
  X,
  HelpCircle,
  BookOpen,
  Info,
  Timer,
  Trophy,
  User,
  Award,
  Calendar,
  Loader2
} from 'lucide-react';
import { HISTORICAL_EVENTS } from './data';
import { HistoricalEvent } from './types';
import { sounds } from './audio';
import { fetchLeaderboardFromFirestore, addLeaderboardEntryToFirestore } from './firebase';

export default function App() {
  // Game states
  const [poolCards, setPoolCards] = useState<HistoricalEvent[]>([]);
  const [timeline, setTimeline] = useState<(HistoricalEvent | null)[]>([null, null, null, null]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('順序還有點不對喔，再試試看！');
  const [attempts, setAttempts] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // Timer & Leaderboard states
  const [seconds, setSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; time: number; attempts: number; date: string }[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [rankSaved, setRankSaved] = useState<boolean>(false);

  // Drag and Drop tracking states
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [draggedSource, setDraggedSource] = useState<string | null>(null); // 'pool' or 'timeline-0', 'timeline-1', etc.
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Helper to get top border color based on event period to match Sophisticated Dark design
  const getTopBorderColor = (id: string) => {
    switch (id) {
      case 'netherlands-fortress':
        return 'border-t-[8px] border-t-blue-800';
      case 'koxinga-arrival':
        return 'border-t-[8px] border-t-amber-700';
      case 'qing-rule':
        return 'border-t-[8px] border-t-emerald-800';
      case 'japanese-rule':
        return 'border-t-[8px] border-t-red-800';
      default:
        return 'border-t-[8px] border-t-slate-700';
    }
  };

  const getPeriodColor = (id: string) => {
    switch (id) {
      case 'netherlands-fortress':
        return 'text-blue-800 bg-blue-50/80 border border-blue-200/50';
      case 'koxinga-arrival':
        return 'text-amber-800 bg-amber-50/80 border border-amber-200/50';
      case 'qing-rule':
        return 'text-emerald-800 bg-emerald-50/80 border border-emerald-200/50';
      case 'japanese-rule':
        return 'text-red-800 bg-red-50/80 border border-red-200/50';
      default:
        return 'text-slate-800 bg-slate-50/80 border border-slate-200/50';
    }
  };

  const getIconTheme = (id: string) => {
    switch (id) {
      case 'netherlands-fortress': return 'text-blue-800 bg-blue-100/60';
      case 'koxinga-arrival': return 'text-amber-800 bg-amber-100/60';
      case 'qing-rule': return 'text-emerald-800 bg-emerald-100/60';
      case 'japanese-rule': return 'text-red-800 bg-red-100/60';
      default: return 'text-slate-800 bg-slate-100/60';
    }
  };

  // Load leaderboard and initialize cards on mount
  useEffect(() => {
    resetGame(false);
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const data = await fetchLeaderboardFromFirestore();
      setLeaderboard(data.map(item => ({
        id: item.id || Math.random().toString(),
        name: item.name,
        time: item.time,
        attempts: item.attempts,
        date: item.date
      })));
    } catch (e) {
      console.error('Failed to load Firestore leaderboard, trying localStorage:', e);
      const saved = localStorage.getItem('taiwan_history_leaderboard');
      if (saved) {
        try {
          setLeaderboard(JSON.parse(saved));
        } catch (err) {
          console.error('Failed to parse local leaderboard:', err);
        }
      }
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && !isSuccess) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, isSuccess]);

  // Shuffle logic ensuring cards are NOT in the correct order initially
  const resetGame = (playAudio = false) => {
    if (playAudio) {
      sounds.playReset();
    }
    let shuffled = [...HISTORICAL_EVENTS];
    let isCorrect = true;

    // Force shuffle until it is not in correct chronological order
    while (isCorrect) {
      shuffled.sort(() => Math.random() - 0.5);
      // Check if randomly shuffled order matches correct sequence (1624 -> 1662 -> 1683 -> 1895)
      isCorrect = shuffled.every((event, index) => {
        if (index === 0) return true;
        return event.year > shuffled[index - 1].year;
      });
    }

    setPoolCards(shuffled);
    setTimeline([null, null, null, null]);
    setIsSuccess(false);
    setShowErrorModal(false);
    setAttempts(0);
    setShowSolution(false);
    setDraggedEventId(null);
    setDraggedSource(null);
    setDragOverIndex(null);
    setSeconds(0);
    setTimerActive(false);
    setHasSubmitted(false);
    setRankSaved(false);
  };

  // Helper to dynamically render period icons
  const renderIcon = (name: string, className: string = "w-6 h-6") => {
    switch (name) {
      case 'Castle':
        return <Castle className={className} />;
      case 'Flag':
        return <Flag className={className} />;
      case 'Scroll':
        return <Scroll className={className} />;
      case 'Train':
        return <Train className={className} />;
      default:
        return <HelpCircle className={className} />;
    }
  };

  // Timer activation helper
  const startTimerIfNeeded = () => {
    if (!timerActive && !isSuccess) {
      setTimerActive(true);
    }
  };

  // Time formatter
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Leaderboard submission handler
  const handleSaveToLeaderboard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userName.trim() || hasSubmitted) return;

    sounds.playClick();
    setLeaderboardLoading(true);
    try {
      // 1. Add to Firestore
      const newFirestoreEntry = await addLeaderboardEntryToFirestore(
        userName.trim(),
        seconds,
        attempts
      );

      // 2. Reload leaderboard
      await loadLeaderboard();

      // 3. Fallback save to local storage
      const localFallbackEntry = {
        id: newFirestoreEntry.id || Math.random().toString(),
        name: newFirestoreEntry.name,
        time: newFirestoreEntry.time,
        attempts: newFirestoreEntry.attempts,
        date: newFirestoreEntry.date,
      };

      const saved = localStorage.getItem('taiwan_history_leaderboard');
      let currentLocal: any[] = [];
      if (saved) {
        try {
          currentLocal = JSON.parse(saved);
        } catch (_) {}
      }
      const updatedLocal = [...currentLocal.filter(item => item.id !== localFallbackEntry.id), localFallbackEntry]
        .sort((a, b) => {
          if (a.time !== b.time) return a.time - b.time;
          return a.attempts - b.attempts;
        })
        .slice(0, 10);
      localStorage.setItem('taiwan_history_leaderboard', JSON.stringify(updatedLocal));

      setHasSubmitted(true);
      setRankSaved(true);
    } catch (error) {
      console.error('Failed to submit leaderboard to Firestore, falling back to local:', error);
      const newEntry = {
        id: Math.random().toString(36).substring(2, 9),
        name: userName.trim(),
        time: seconds,
        attempts: attempts,
        date: new Date().toLocaleDateString('zh-TW', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const updatedLeaderboard = [...leaderboard, newEntry]
        .sort((a, b) => {
          if (a.time !== b.time) return a.time - b.time;
          return a.attempts - b.attempts;
        })
        .slice(0, 10);

      setLeaderboard(updatedLeaderboard);
      localStorage.setItem('taiwan_history_leaderboard', JSON.stringify(updatedLeaderboard));
      setHasSubmitted(true);
      setRankSaved(true);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Check if timeline slots are 100% correct
  const handleCheckAnswer = () => {
    // Check if any slot is empty
    const hasEmptySlot = timeline.some(slot => slot === null);
    if (hasEmptySlot) {
      sounds.playWrong();
      setErrorMessage('請將所有的歷史事件卡片都放置到時間軸上，再進行檢查喔！');
      setShowErrorModal(true);
      return;
    }

    // Verify chronological order (must be strictly increasing years)
    const isChronological = timeline.every((slot, index) => {
      if (index === 0) return true;
      return (slot?.year ?? 0) > (timeline[index - 1]?.year ?? 0);
    });

    if (isChronological) {
      sounds.playSuccess();
      setIsSuccess(true);
      setTimerActive(false); // Stop the timer!
      setShowSolution(true);
      triggerConfetti();
    } else {
      sounds.playWrong();
      setAttempts(prev => prev + 1);
      setErrorMessage('順序還有點不對喔，再試試看！');
      setShowErrorModal(true);
    }
  };

  // Trigger high-fidelity canvas confetti celebration
  const triggerConfetti = () => {
    const globalConfetti = (window as any).confetti;
    if (globalConfetti) {
      // First burst
      globalConfetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Follow-up bursts after brief delays
      setTimeout(() => {
        globalConfetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 }
        });
      }, 250);

      setTimeout(() => {
        globalConfetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 }
        });
      }, 400);
    }
  };

  // ----------------------------------------------------
  // Drag and Drop Event Handlers
  // ----------------------------------------------------

  const handleDragStart = (e: React.DragEvent, id: string, source: string) => {
    sounds.playClick();
    startTimerIfNeeded();
    setDraggedEventId(id);
    setDraggedSource(source);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDraggedEventId(null);
    setDraggedSource(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedEventId || draggedSource === null) return;

    sounds.playPlace();

    // Find the dragged card object
    let draggedEvent: HistoricalEvent | null = null;
    if (draggedSource === 'pool') {
      draggedEvent = poolCards.find(item => item.id === draggedEventId) || null;
    } else if (draggedSource.startsWith('timeline-')) {
      const srcIndex = parseInt(draggedSource.split('-')[1], 10);
      draggedEvent = timeline[srcIndex];
    }

    if (!draggedEvent) return;

    const newTimeline = [...timeline];
    const newPool = [...poolCards];

    // Destination slot state
    const existingTargetEvent = timeline[targetIndex];

    if (draggedSource === 'pool') {
      // Removing from pool
      const poolIndex = newPool.findIndex(item => item.id === draggedEventId);
      if (poolIndex !== -1) {
        newPool.splice(poolIndex, 1);
      }

      // If target slot is occupied, move that card back to pool
      if (existingTargetEvent) {
        newPool.push(existingTargetEvent);
      }

      // Assign to target slot
      newTimeline[targetIndex] = draggedEvent;
    } else if (draggedSource.startsWith('timeline-')) {
      const sourceIndex = parseInt(draggedSource.split('-')[1], 10);

      if (sourceIndex !== targetIndex) {
        // Swap slots!
        newTimeline[sourceIndex] = existingTargetEvent;
        newTimeline[targetIndex] = draggedEvent;
      }
    }

    setTimeline(newTimeline);
    setPoolCards(newPool);
    handleDragEnd();
  };

  // ----------------------------------------------------
  // Interactive Click-to-Move Actions (Accessibility / Tablet / Mobile)
  // ----------------------------------------------------

  // Click on a pool card to automatically place it in the first empty slot
  const handlePoolCardClick = (event: HistoricalEvent) => {
    if (isSuccess) return;
    startTimerIfNeeded();

    const firstEmptyIndex = timeline.indexOf(null);
    if (firstEmptyIndex !== -1) {
       sounds.playPlace();
       const newTimeline = [...timeline];
       newTimeline[firstEmptyIndex] = event;
       setTimeline(newTimeline);

       setPoolCards(poolCards.filter(item => item.id !== event.id));
    }
  };

  // Click on a timeline slot card to remove it back to the pool
  const handleTimelineCardClick = (index: number) => {
    if (isSuccess) return;
    startTimerIfNeeded();

    const event = timeline[index];
    if (event) {
       sounds.playClick();
       const newTimeline = [...timeline];
       newTimeline[index] = null;
       setTimeline(newTimeline);

       setPoolCards([...poolCards, event]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-serif antialiased py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      {/* Container holding layout */}
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header Unit */}
        <header className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-800/40 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase shadow-sm">
            <History className="w-3.5 h-3.5" />
            <span>互動歷史特展</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 tracking-tight font-serif">
            台灣歷史時光機
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-sans">
            請將下列歷史事件依據「發生年代」先後順序，拖移或點擊至下方的時間軸空槽中。
          </p>
        </header>

        {/* Progress bar / Stats banner */}
        <div className="bg-slate-800/80 border border-slate-700/60 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto shadow-lg shadow-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="bg-amber-950/40 text-amber-400 p-2 rounded-lg border border-amber-800/20">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs text-amber-500 font-semibold uppercase tracking-wider">玩法提示</div>
              <p className="text-xs sm:text-sm text-slate-300 font-sans">
                可滑鼠拖曳卡片，或直接<strong>「點擊卡片」</strong>快速在牌庫與時間軸之間移動！
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold font-sans">
            <span className="text-slate-300 flex items-center gap-1">
              <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
              挑戰時間：
              <span className="text-amber-400 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-md ml-1 font-mono">
                {formatTime(seconds)}
              </span>
            </span>
            <span className="text-slate-300 border-l border-slate-700 pl-4">
              已放置：
              <span className="text-amber-400 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-md ml-1 font-mono">
                {timeline.filter(Boolean).length} / 4
              </span>
            </span>
            <span className="text-slate-300 border-l border-slate-700 pl-4">
              嘗試次數：
              <span className="text-amber-400 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-md ml-1 font-mono">
                {attempts}
              </span>
            </span>
          </div>
        </div>

        {/* Top: Card Pool */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
              待排序的歷史事件牌庫
            </h2>
            <span className="text-xs text-slate-400 font-sans">（點擊卡片或拖曳至下方）</span>
          </div>

          <div className="min-h-[200px] flex items-center justify-center bg-slate-800/40 rounded-2xl border border-slate-700/60 p-4 shadow-inner">
            {poolCards.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-2 font-sans"
              >
                <div className="bg-slate-800 text-slate-500 p-4 rounded-full inline-block border border-slate-700">
                  <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <p className="text-slate-300 text-sm font-medium">卡片已全部放置到時間軸上了！</p>
                <p className="text-slate-500 text-xs">可以點擊下方的「檢查答案」按鈕進行驗證。</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <AnimatePresence>
                  {poolCards.map((event) => {
                    const isDragging = draggedEventId === event.id;
                    return (
                      <motion.div
                        key={event.id}
                        layoutId={`card-${event.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        draggable={!isSuccess}
                        onDragStart={(e) => handleDragStart(e, event.id, 'pool')}
                        onDragEnd={handleDragEnd}
                        onClick={() => handlePoolCardClick(event)}
                        className={`
                          group relative card-paper border border-stone-300 shadow-xl rounded-xl p-5 
                          flex flex-col justify-between select-none cursor-grab active:cursor-grabbing 
                          transition-all duration-300 hover:-translate-y-1.5 overflow-hidden h-[180px] text-slate-900
                          ${getTopBorderColor(event.id)}
                          ${isDragging ? 'opacity-40 border-dashed border-amber-500 bg-amber-50/20' : ''}
                        `}
                        id={`pool-card-${event.id}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest ${getPeriodColor(event.id)}`}>
                              {event.period}
                            </span>
                            <div className={`p-1.5 rounded-lg shadow-sm ${getIconTheme(event.id)}`}>
                              {renderIcon(event.iconName, "w-4 h-4")}
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-slate-950 group-hover:text-amber-800 transition-colors text-base font-serif">
                            {event.title}
                          </h3>
                          <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed font-sans">
                            {event.description}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-stone-200/60 pt-2 text-[10px] text-stone-500 font-medium font-sans">
                          <span>⏱️ 年代未揭露</span>
                          <span className="text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-bold">
                            點擊放置 <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* Middle: Horizontal Timeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-serif">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
              歷史事件排序時間軸
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>起：17 世紀初 (1624 年)</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span>迄：20 世紀中 (1945 年)</span>
            </div>
          </div>

          {/* Time axis layout */}
          <div className="relative">
            {/* Horizontal connection bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-700 -translate-y-1/2 z-0 hidden lg:block rounded-full"></div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
              {timeline.map((event, index) => {
                const isHovered = dragOverIndex === index;
                return (
                  <div
                    key={index}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex flex-col space-y-2"
                  >
                    {/* Time node marker */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 font-mono">
                      <span>階段 {index + 1}</span>
                      <span className="bg-slate-800 text-amber-500/70 border border-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-inner">
                        {index + 1}
                      </span>
                    </div>

                    {/* Drop zone box */}
                    <div
                      className={`
                        min-h-[200px] rounded-2xl border-4 border-dashed flex flex-col items-center justify-center p-3 transition-all duration-200
                        ${event ? 'border-transparent bg-transparent' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/60'}
                        ${isHovered ? 'border-amber-500 bg-slate-800/80 scale-[1.02] shadow-[0_0_15px_rgba(245,158,11,0.15)]' : ''}
                      `}
                      id={`drop-zone-${index}`}
                    >
                      {event ? (
                        /* Card currently in the timeline slot */
                        <motion.div
                          layoutId={`card-${event.id}`}
                          draggable={!isSuccess}
                          onDragStart={(e) => handleDragStart(e, event.id, `timeline-${index}`)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleTimelineCardClick(index)}
                          className={`
                            w-full h-full text-left p-4 rounded-xl flex flex-col justify-between select-none cursor-pointer relative overflow-hidden
                            card-paper border border-stone-300 shadow-lg group hover:shadow-xl transition-all h-[180px] text-slate-900
                            ${getTopBorderColor(event.id)}
                            ${isSuccess ? 'ring-4 ring-emerald-500/40' : ''}
                          `}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${getPeriodColor(event.id)}`}>
                                {event.period}
                              </span>
                              <div className={`p-1.5 rounded-lg shadow-sm ${getIconTheme(event.id)}`}>
                                {renderIcon(event.iconName, "w-4 h-4")}
                              </div>
                            </div>

                            <h3 className="font-bold text-slate-950 group-hover:text-amber-800 transition-colors text-sm font-serif">
                              {event.title}
                            </h3>
                            <p className="text-[11px] text-stone-600 line-clamp-3 leading-relaxed font-sans">
                              {event.description}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-stone-200/60 pt-2 text-[10px] text-stone-500 font-medium font-sans">
                            {isSuccess ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {event.yearText}
                              </span>
                            ) : (
                              <span className="text-stone-400">💡 點擊收回</span>
                            )}
                            {!isSuccess && (
                              <span className="text-stone-400 group-hover:text-amber-700 font-bold transition-colors">
                                可拖曳置換
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        /* Empty slot placeholder */
                        <div className="text-center p-4 space-y-2 pointer-events-none font-sans">
                          <div className="text-slate-600 flex justify-center">
                            <History className="w-8 h-8 stroke-[1.25]" />
                          </div>
                          <div className="text-slate-400 text-xs font-semibold">
                            拖曳卡片置於此
                          </div>
                          <div className="text-[10px] text-slate-500">
                            或由上方牌庫點選
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom Control Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto pt-4 font-sans">
          <button
            onClick={() => resetGame(true)}
            className="w-full sm:w-auto px-6 py-3 border border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            id="reset-btn"
          >
            <RotateCcw className="w-4 h-4" />
            重置並打亂
          </button>
          
          <button
            onClick={handleCheckAnswer}
            disabled={isSuccess}
            className={`
              w-full sm:w-auto px-12 py-4 font-bold rounded-full shadow-2xl transition-all flex items-center justify-center gap-2 text-white text-lg
              ${isSuccess 
                ? 'bg-emerald-600 hover:bg-emerald-700 cursor-not-allowed ring-4 ring-emerald-600/20' 
                : 'bg-amber-600 hover:bg-amber-500 active:scale-95 ring-4 ring-amber-600/20'
              }
            `}
            id="check-btn"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                完美通關！
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                檢查答案
              </>
            )}
          </button>

          {!isSuccess && attempts >= 2 && (
            <button
              onClick={() => {
                setShowSolution(true);
                // Reveal dates on timeline slot
                const solvedTimeline = [...HISTORICAL_EVENTS];
                setTimeline(solvedTimeline);
                setPoolCards([]);
              }}
              className="w-full sm:w-auto px-5 py-3 text-amber-300 bg-amber-950/40 border border-amber-800/30 hover:bg-amber-950/60 font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              id="solution-btn"
            >
              <BookOpen className="w-4 h-4" />
              查看歷史年表
            </button>
          )}
        </div>

        {/* Leaderboard Submission Form */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900 border-2 border-amber-500/30 rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl text-center space-y-4"
          >
            <div className="flex justify-center">
              <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center shadow-inner">
                <Trophy className="w-9 h-9 text-amber-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-serif text-amber-400">登入時光旅人殿堂！</h2>
              <p className="text-slate-300 text-sm font-sans">
                恭喜！你只用了 <span className="font-mono text-amber-400 font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">{formatTime(seconds)}</span> 且僅嘗試了 <span className="font-mono text-amber-400 font-bold bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">{attempts}</span> 次，即成功將台灣歷史事件完美歸位！
              </p>
            </div>

            {!rankSaved ? (
              <form onSubmit={handleSaveToLeaderboard} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 pt-2 font-sans">
                <div className="relative flex-1">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="輸入你的冒險家代號 (例如：時光旅人)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm placeholder:text-slate-500 text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-100 font-bold rounded-xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  提交紀錄
                </button>
              </form>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 font-bold flex items-center justify-center gap-1.5 font-sans pt-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />
                成功登榜！快到下方排行榜看看你的光榮排行吧！
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Explanation and History Timeline details panel (revealed on win or clicking view timeline) */}
        <AnimatePresence>
          {showSolution && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-slate-800/90 border border-slate-700 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-500 flex items-center gap-2">
                    <BookOpen className="w-5.5 h-5.5 text-amber-500" />
                    台灣歷史年表詳解
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm font-sans">
                    恭喜完成學習！一起來深入探索這四個在台灣史上留下深遠印記的歷史時期：
                  </p>
                </div>
                {isSuccess && (
                  <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-3 py-1 rounded-full text-xs font-bold shadow-sm font-sans">
                    🎓 歷史大師認證
                  </div>
                )}
              </div>

              {/* Sequential timeline stack */}
              <div className="space-y-6 relative before:absolute before:top-4 before:bottom-4 before:left-4 sm:before:left-1/2 before:w-0.5 before:bg-slate-700">
                {HISTORICAL_EVENTS.map((event, index) => {
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex flex-col sm:flex-row ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''} gap-8 items-start sm:items-center`}
                    >
                      {/* Anchor Timeline point */}
                      <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center z-10 shadow-md">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                      </div>

                      {/* Content block side */}
                      <div className="w-full sm:w-[46%] pl-10 sm:pl-0">
                        <div className="card-paper p-5 rounded-xl border border-stone-300 shadow-lg space-y-3 text-slate-900 relative overflow-hidden">
                          {/* Top Border on detail cards too for theme continuity */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${event.id === 'netherlands-fortress' ? 'bg-blue-800' : event.id === 'koxinga-arrival' ? 'bg-amber-700' : event.id === 'qing-rule' ? 'bg-emerald-800' : 'bg-red-800'}`}></div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-lg font-bold text-slate-950 font-serif">
                              {event.title}
                            </span>
                            <span className={`text-xs font-extrabold font-mono px-3 py-0.5 rounded-full shadow-sm ${getPeriodColor(event.id)}`}>
                              {event.yearText}
                            </span>
                          </div>

                          <div className="text-xs text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded inline-block font-sans">
                            時期：{event.period}
                          </div>

                          <p className="text-xs text-stone-700 leading-relaxed font-sans">
                            {event.description}
                          </p>

                          {/* Historical Key facts bullets */}
                          <div className="space-y-1.5 pt-2.5 border-t border-stone-200">
                            <h4 className="text-[11px] font-bold text-stone-800 flex items-center gap-1 font-sans">
                              <Info className="w-3.5 h-3.5 text-stone-500" />
                              歷史關鍵重點
                            </h4>
                            <ul className="list-disc list-inside space-y-1 pl-1 font-sans">
                              {event.keyFacts.map((fact, idx) => (
                                <li key={idx} className="text-[11px] text-stone-600 leading-relaxed">
                                  {fact}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Spacer block for standard two-column timeline */}
                      <div className="hidden sm:block w-[46%]"></div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Permanent Leaderboard Section */}
        <section className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-4 gap-2">
            <h2 className="text-xl font-serif font-bold text-amber-500 flex items-center gap-2">
              <Trophy className="w-5.5 h-5.5 text-amber-500 animate-pulse" />
              時光旅人排行榜
            </h2>
            <span className="text-xs text-slate-400 font-sans">
              （依「完成時間」排序，時間相同則比對「嘗試次數」）
            </span>
          </div>

          {leaderboardLoading ? (
            <div className="text-center py-12 space-y-3 font-sans">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">正在載入雲端排行榜...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-10 space-y-3 font-sans">
              <div className="bg-slate-900/60 text-slate-600 w-12 h-12 rounded-full inline-flex items-center justify-center border border-slate-800">
                <Trophy className="w-6 h-6 stroke-[1.25]" />
              </div>
              <p className="text-slate-400 text-sm">目前尚無挑戰紀錄</p>
              <p className="text-slate-500 text-xs font-serif italic text-amber-500/40">快開始挑戰，寫下你的傳奇歷史紀錄！</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/40">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 bg-slate-900/80 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold text-center w-16">排名</th>
                    <th className="py-3 px-4 font-bold">挑戰者</th>
                    <th className="py-3 px-4 font-bold text-center">完成時間</th>
                    <th className="py-3 px-4 font-bold text-center">嘗試次數</th>
                    <th className="py-3 px-4 font-bold text-right hidden sm:table-cell">挑戰日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {leaderboard.map((entry, index) => {
                    const isTop3 = index < 3;
                    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    return (
                      <tr 
                        key={entry.id} 
                        className={`transition-colors hover:bg-slate-800/40 ${entry.name === userName && isSuccess ? 'bg-amber-500/10 text-amber-300 font-medium' : ''}`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {rankEmoji ? (
                            <span className="text-xl leading-none">{rankEmoji}</span>
                          ) : (
                            <span className="font-mono text-slate-400 text-xs">{index + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-serif">
                          <span className="flex items-center gap-1.5">
                            {entry.name}
                            {entry.name === userName && isSuccess && (
                              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-sans font-bold">
                                本次
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">
                          {formatTime(entry.time)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                          {entry.attempts} 次
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono hidden sm:table-cell">
                          {entry.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  if (confirm('確定要清除所有排行榜紀錄嗎？')) {
                    localStorage.removeItem('taiwan_history_leaderboard');
                    setLeaderboard([]);
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-red-400 font-sans transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                清除所有紀錄
              </button>
            </div>
          )}
        </section>

      </div>

      {/* Modern, Eye-safe Error & Guidance Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowErrorModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-slate-800 border-2 border-slate-700 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative z-10 text-center space-y-5"
              id="error-modal"
            >
              <button 
                onClick={() => setShowErrorModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto bg-red-500/10 border border-red-500/20 text-red-500 w-16 h-16 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2 font-serif">
                <h3 className="text-2xl font-bold text-slate-100">
                  順序不對喔！
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line font-sans">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2 font-sans">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95"
                  id="error-modal-ok-btn"
                >
                  我知道了，再試試！
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="mt-16 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-6">
        <p className="font-serif italic text-amber-500/60">歷史是浩瀚的河流，每一個時期都是精采的一頁。</p>
        <p className="mt-1 font-mono">台灣歷史事件排序遊戲 © 2026</p>
      </footer>
    </div>
  );
}
