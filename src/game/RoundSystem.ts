export type DayOfWeek = 
  | 'ПОНЕДЕЛЬНИК' 
  | 'ВТОРНИК' 
  | 'СРЕДА' 
  | 'ЧЕТВЕРГ' 
  | 'ПЯТНИЦА' 
  | 'СУББОТА' 
  | 'ВОСКРЕСЕНЬЕ';

export type RoundPhase = 
  | 'waiting'      // Ожидание игроков
  | 'starting'     // Отсчёт до начала
  | 'active'       // Раунд идёт
  | 'ending'       // Раунд заканчивается
  | 'intermission'; // Перерыв между раундами

export type RoundResult = 'none' | 'guards_win' | 'prisoners_win' | 'time_up';

export interface RoundState {
  day: DayOfWeek;
  dayIndex: number;
  phase: RoundPhase;
  timeLeft: number; // секунды
  roundNumber: number;
  result: RoundResult;
  guardsAlive: number;
  prisonersAlive: number;
}

const DAYS: DayOfWeek[] = [
  'ПОНЕДЕЛЬНИК',
  'ВТОРНИК', 
  'СРЕДА',
  'ЧЕТВЕРГ',
  'ПЯТНИЦА',
  'СУББОТА',
  'ВОСКРЕСЕНЬЕ'
];

export class RoundSystem {
  private dayIndex = 0;
  private phase: RoundPhase = 'waiting';
  private timeLeft = 0;
  private roundNumber = 1;
  private result: RoundResult = 'none';
  
  // Настройки времени (в секундах)
  private readonly ROUND_DURATION = 300; // 5 минут на раунд
  private readonly START_COUNTDOWN = 5;  // 5 секунд до начала
  private readonly END_DURATION = 5;     // 5 секунд показ результата
  private readonly INTERMISSION = 10;    // 10 секунд перерыв
  
  // Счётчики игроков
  private guardsAlive = 0;
  private prisonersAlive = 0;
  private totalGuards = 0;
  private totalPrisoners = 0;
  
  // Callbacks
  public onStateChange?: (state: RoundState) => void;
  public onRoundStart?: () => void;
  public onRoundEnd?: (result: RoundResult) => void;
  public onRespawn?: () => void;

  constructor() {}

  getState(): RoundState {
    return {
      day: DAYS[this.dayIndex],
      dayIndex: this.dayIndex,
      phase: this.phase,
      timeLeft: Math.ceil(this.timeLeft),
      roundNumber: this.roundNumber,
      result: this.result,
      guardsAlive: this.guardsAlive,
      prisonersAlive: this.prisonersAlive
    };
  }

  // Установка количества игроков
  setPlayerCounts(guards: number, prisoners: number) {
    this.totalGuards = guards;
    this.totalPrisoners = prisoners;
    this.guardsAlive = guards;
    this.prisonersAlive = prisoners;
    this.notifyStateChange();
  }

  // Игрок умер
  playerDied(team: 'guard' | 'prisoner') {
    if (team === 'guard') {
      this.guardsAlive = Math.max(0, this.guardsAlive - 1);
    } else {
      this.prisonersAlive = Math.max(0, this.prisonersAlive - 1);
    }
    
    this.notifyStateChange();
    this.checkRoundEnd();
  }

  // Начать игру (первый раунд)
  startGame() {
    this.dayIndex = 0;
    this.roundNumber = 1;
    this.startCountdown();
  }

  // Запуск отсчёта до начала раунда
  private startCountdown() {
    this.phase = 'starting';
    this.timeLeft = this.START_COUNTDOWN;
    this.result = 'none';
    this.guardsAlive = this.totalGuards;
    this.prisonersAlive = this.totalPrisoners;
    this.notifyStateChange();
  }

  // Начало активной фазы раунда
  private startActivePhase() {
    this.phase = 'active';
    this.timeLeft = this.ROUND_DURATION;
    
    if (this.onRoundStart) {
      this.onRoundStart();
    }
    if (this.onRespawn) {
      this.onRespawn();
    }
    
    this.notifyStateChange();
  }

  // Проверка условий окончания раунда
  private checkRoundEnd() {
    if (this.phase !== 'active') return;

    if (this.guardsAlive <= 0) {
      this.endRound('prisoners_win');
    } else if (this.prisonersAlive <= 0) {
      this.endRound('guards_win');
    }
  }

  // Завершение раунда
  private endRound(result: RoundResult) {
    this.phase = 'ending';
    this.result = result;
    this.timeLeft = this.END_DURATION;
    
    if (this.onRoundEnd) {
      this.onRoundEnd(result);
    }
    
    this.notifyStateChange();
  }

  // Переход к перерыву между раундами
  private startIntermission() {
    this.phase = 'intermission';
    this.timeLeft = this.INTERMISSION;
    this.notifyStateChange();
  }

  // Следующий раунд
  private nextRound() {
    this.dayIndex = (this.dayIndex + 1) % 7;
    this.roundNumber++;
    this.startCountdown();
  }

  // Обновление (вызывать каждый кадр)
  update(delta: number) {
    if (this.phase === 'waiting') return;

    this.timeLeft -= delta;

    if (this.timeLeft <= 0) {
      switch (this.phase) {
        case 'starting':
          this.startActivePhase();
          break;
        case 'active':
          // Время вышло - победа охраны
          this.endRound('time_up');
          break;
        case 'ending':
          this.startIntermission();
          break;
        case 'intermission':
          this.nextRound();
          break;
      }
    }

    this.notifyStateChange();
  }

  // Форматирование времени
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Получить цвет дня
  static getDayColor(dayIndex: number): string {
    const colors = [
      '#ef4444', // Понедельник - красный
      '#f97316', // Вторник - оранжевый
      '#eab308', // Среда - жёлтый
      '#22c55e', // Четверг - зелёный
      '#3b82f6', // Пятница - синий
      '#8b5cf6', // Суббота - фиолетовый
      '#ec4899', // Воскресенье - розовый
    ];
    return colors[dayIndex];
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  reset() {
    this.dayIndex = 0;
    this.phase = 'waiting';
    this.timeLeft = 0;
    this.roundNumber = 1;
    this.result = 'none';
    this.notifyStateChange();
  }
}
