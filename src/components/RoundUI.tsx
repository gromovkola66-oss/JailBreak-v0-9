import { RoundState, RoundSystem } from '../game/RoundSystem';

interface RoundUIProps {
  roundState: RoundState | null;
}

export const RoundUI = ({ roundState }: RoundUIProps) => {
  if (!roundState) return null;

  const dayColor = RoundSystem.getDayColor(roundState.dayIndex);
  const timeFormatted = RoundSystem.formatTime(roundState.timeLeft);

  // Экран ожидания
  if (roundState.phase === 'waiting') {
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-black/80 text-white px-12 py-8 rounded-2xl text-center">
            <div className="text-2xl mb-2">Ожидание игроков</div>
            <div className="text-gray-400">Минимум 2 игрока для начала</div>
          </div>
      </div>
    );
  }

  // Экран отсчёта
  if (roundState.phase === 'starting') {
    return (
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
        <div className="text-center">
          <div 
            className="text-6xl font-bold mb-4"
            style={{ color: dayColor }}
          >
            {roundState.day}
          </div>
          <div className="text-white text-2xl mb-8">
            Раунд {roundState.roundNumber}
          </div>
          <div className="text-9xl font-bold text-white animate-pulse">
            {Math.ceil(roundState.timeLeft)}
          </div>
          <div className="text-gray-400 text-xl mt-4">
            Приготовьтесь...
          </div>
        </div>
      </div>
    );
  }

  // Экран окончания раунда
  if (roundState.phase === 'ending') {
    let resultText = '';
    let resultColor = '';

    switch (roundState.result) {
      case 'guards_win':
        resultText = 'ПОБЕДА ОХРАНЫ';
        resultColor = 'text-blue-400';
        break;
      case 'prisoners_win':
        resultText = 'ПОБЕДА ЗАКЛЮЧЁННЫХ';
        resultColor = 'text-orange-400';
        break;
      case 'time_up':
        resultText = 'ВРЕМЯ ВЫШЛО';
        resultColor = 'text-yellow-400';
        break;
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-40">
        <div className="text-center">
          <div className={`text-5xl font-bold ${resultColor} mb-4`}>
            {resultText}
          </div>
          <div className="text-white text-xl">
            {roundState.result === 'time_up' 
              ? 'Заключённые не успели сбежать. Победа охраны!'
              : roundState.result === 'guards_win'
                ? 'Все заключённые ликвидированы!'
                : 'Вся охрана уничтожена!'
            }
          </div>
        </div>
      </div>
    );
  }

  // Экран перерыва
  if (roundState.phase === 'intermission') {
    const nextDayIndex = (roundState.dayIndex + 1) % 7;
    const nextDayColor = RoundSystem.getDayColor(nextDayIndex);
    const days = ['ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА', 'ВОСКРЕСЕНЬЕ'];
    
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 pointer-events-none z-40">
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-4">Следующий день через</div>
          <div className="text-7xl font-bold text-white mb-6">
            {Math.ceil(roundState.timeLeft)}
          </div>
          <div 
            className="text-4xl font-bold"
            style={{ color: nextDayColor }}
          >
            {days[nextDayIndex]}
          </div>
        </div>
      </div>
    );
  }

  // Активный раунд - HUD элементы
  return (
    <>
      {/* Таймер и день наверху по центру */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-30">
        <div className="bg-black/70 rounded-xl px-6 py-3 flex items-center gap-4">
          {/* День */}
          <div 
            className="font-bold text-lg"
            style={{ color: dayColor }}
          >
            {roundState.day}
          </div>
          
          {/* Разделитель */}
          <div className="w-px h-6 bg-gray-600" />
          
          {/* Таймер */}
          <div className={`font-mono text-2xl font-bold ${
            roundState.timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-white'
          }`}>
            {timeFormatted}
          </div>
          
          {/* Разделитель */}
          <div className="w-px h-6 bg-gray-600" />
          
          {/* Раунд */}
          <div className="text-gray-400">
            Раунд <span className="text-white font-bold">{roundState.roundNumber}</span>
          </div>
        </div>
      </div>

      {/* Счётчик живых игроков */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-30">
        <div className="flex items-center gap-6">
          {/* Охрана */}
          <div className="bg-blue-900/70 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-blue-200 text-sm">Охрана</span>
            <span className="text-blue-300 font-bold text-xl">{roundState.guardsAlive}</span>
          </div>
          
          <div className="text-gray-500 text-xl">VS</div>
          
          {/* Заключённые */}
          <div className="bg-orange-900/70 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-orange-200 text-sm">Заключённые</span>
            <span className="text-orange-300 font-bold text-xl">{roundState.prisonersAlive}</span>
          </div>
        </div>
      </div>

      {/* Предупреждение о времени */}
      {roundState.timeLeft <= 60 && roundState.timeLeft > 0 && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-none z-30">
          <div className="bg-red-900/80 text-red-200 px-6 py-2 rounded-lg animate-pulse">
            Осталось меньше минуты
          </div>
        </div>
      )}
    </>
  );
};
