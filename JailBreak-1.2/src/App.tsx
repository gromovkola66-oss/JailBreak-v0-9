import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { ServerBrowser } from './components/ServerBrowser';
import { TeamSelect } from './components/TeamSelect';
import { EditorApp } from './EditorApp';
import { MultiplayerClient } from './game/multiplayer';

type AppMode = 'menu' | 'server_browser' | 'team_select' | 'multiplayer_play' | 'editor';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('menu');
  const [multiplayerClient, setMultiplayerClient] = useState<MultiplayerClient | null>(null);
  const [multiplayerTeam, setMultiplayerTeam] = useState<'guard' | 'prisoner'>('prisoner');

  if (appMode === 'editor') {
    return <EditorApp onBackToGame={() => { setAppMode('menu'); }} />;
  }

  if (appMode === 'multiplayer_play') {
    return (
      <EditorApp
        onBackToGame={() => {
          multiplayerClient?.disconnect();
          setMultiplayerClient(null);
          setAppMode('menu');
        }}
        multiplayerClient={multiplayerClient}
        multiplayerTeam={multiplayerTeam}
      />
    );
  }

  if (appMode === 'server_browser') {
    return (
      <ServerBrowser
        onConnected={(client) => {
          setMultiplayerClient(client);
          setAppMode('team_select');
        }}
        onBack={() => setAppMode('menu')}
      />
    );
  }

  if (appMode === 'team_select' && multiplayerClient) {
    return (
      <TeamSelect
        multiplayerClient={multiplayerClient}
        onTeamSelected={(team) => {
          setMultiplayerTeam(team);
          setAppMode('multiplayer_play');
        }}
        onDisconnect={() => {
          multiplayerClient.disconnect();
          setMultiplayerClient(null);
          setAppMode('server_browser');
        }}
      />
    );
  }

  return (
    <MainMenu
      onOpenEditor={() => setAppMode('editor')}
      onOpenServers={() => setAppMode('server_browser')}
    />
  );
}

export default App;
