interface TeamSelectProps {
  onSelectTeam: (team: 'guard' | 'prisoner') => void;
  guardCount: number;
  prisonerCount: number;
}

export const TeamSelect = ({ onSelectTeam, guardCount, prisonerCount }: TeamSelectProps) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Заголовок */}
        <h1 className="text-5xl font-bold text-white mb-2">JAILBREAK</h1>
        <p className="text-gray-400 mb-12">Выберите команду</p>

        {/* Карточки команд */}
        <div className="flex gap-8">
          {/* Охрана */}
          <button
            onClick={() => onSelectTeam('guard')}
            className="group relative w-72 bg-gradient-to-b from-blue-900/80 to-blue-950/80 
                       border-2 border-blue-500/50 rounded-2xl p-8 
                       hover:border-blue-400 hover:scale-105 
                       transition-all duration-300 cursor-pointer"
          >
            <h2 className="text-2xl font-bold text-blue-400 mb-4">ОХРАНА</h2>
            
            {/* Описание */}
            <p className="text-gray-400 text-sm mb-4">
              Контролируй заключённых и проводи смертельные игры
            </p>
            
            {/* Особенности */}
            <div className="space-y-2 text-left text-sm">
              <div className="text-green-400">Спавн с оружием (AK-47)</div>
              <div className="text-green-400">Доступ к оружейной</div>
              <div className="text-green-400">Управление дверьми камер</div>
            </div>

            {/* Количество игроков */}
            <div className="mt-6 pt-4 border-t border-blue-500/30">
              <span className="text-blue-300">Игроков: </span>
              <span className="text-white font-bold">{guardCount}</span>
            </div>

            {/* Hover эффект */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Заключённые */}
          <button
            onClick={() => onSelectTeam('prisoner')}
            className="group relative w-72 bg-gradient-to-b from-orange-900/80 to-orange-950/80 
                       border-2 border-orange-500/50 rounded-2xl p-8 
                       hover:border-orange-400 hover:scale-105 
                       transition-all duration-300 cursor-pointer"
          >
            <h2 className="text-2xl font-bold text-orange-400 mb-4">ЗАКЛЮЧЁННЫЕ</h2>
            
            {/* Описание */}
            <p className="text-gray-400 text-sm mb-4">
              Выживай в играх или подними бунт против охраны
            </p>
            
            {/* Особенности */}
            <div className="space-y-2 text-left text-sm">
              <div className="text-yellow-400">Только кулаки</div>
              <div className="text-yellow-400">Можно украсть оружие</div>
              <div className="text-yellow-400">Победи — загадай желание</div>
            </div>

            {/* Количество игроков */}
            <div className="mt-6 pt-4 border-t border-orange-500/30">
              <span className="text-orange-300">Игроков: </span>
              <span className="text-white font-bold">{prisonerCount}</span>
            </div>

            {/* Hover эффект */}
            <div className="absolute inset-0 bg-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Баланс команд */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Баланс: 4 заключённых на 1 охранника</p>
        </div>

        {/* Инструкция */}
        <div className="mt-12 text-gray-600 text-xs">
          <p>После выбора команды нажмите в любое место для начала игры</p>
        </div>
      </div>
    </div>
  );
};
