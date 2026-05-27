import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { EditorApp } from './EditorApp';
import { MultiplayerClient } from './game/multiplayer';

type AppMode = 'menu' | 'editor' | 'multiplayer_play';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('menu');
  const [multiplayerClient, setMultiplayerClient] = useState<MultiplayerClient | null>(null);

  const handleStartMultiplayer = (client: MultiplayerClient) => {
    setMultiplayerClient(client);
    setAppMode('editor');
  };

  if (appMode === 'editor' || appMode === 'multiplayer_play') {
    return <EditorApp onBackToGame={() => { setAppMode('menu'); setMultiplayerClient(null); }} multiplayerClient={multiplayerClient} />;
  }

  return <MainMenu onOpenEditor={() => setAppMode('editor')} onStartMultiplayer={handleStartMultiplayer} />;
}

export default App;
