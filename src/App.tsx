import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { EditorApp } from './EditorApp';

type AppMode = 'menu' | 'editor';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('menu');

  if (appMode === 'editor') {
    return <EditorApp onBackToGame={() => setAppMode('menu')} />;
  }

  return <MainMenu onOpenEditor={() => setAppMode('editor')} />;
}

export default App;
