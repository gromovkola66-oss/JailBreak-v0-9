import { useRef, useEffect, useCallback } from 'react';
import { NodeEditor, ScriptGraph } from '../editor/NodeEditor';

export interface NodeEditorPanelProps {
  visible: boolean;
  scriptGraph: ScriptGraph;
  onGraphChanged: (graph: ScriptGraph) => void;
  onClose: () => void;
}

export const NodeEditorPanel = (props: NodeEditorPanelProps) => {
  const { visible, scriptGraph, onGraphChanged, onClose } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<NodeEditor | null>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const editor = new NodeEditor(canvas);
    editor.setGraph(structuredClone(scriptGraph));
    editor.onGraphChanged = () => {
      onGraphChanged(editor.getGraph());
    };
    editorRef.current = editor;

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      editor.render();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      editor.dispose();
      editorRef.current = null;
    };
  }, [visible, scriptGraph, onGraphChanged]);

  const handleAddNode = useCallback((type: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    // Place node roughly in center of visible area
    editor.addNode(type, 200 + Math.random() * 100, 150 + Math.random() * 100);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const selected = editor.getSelectedNode();
    if (selected) {
      editor.removeNode(selected);
    }
  }, []);

  if (!visible) return null;

  const nodeTypes = [
    { category: 'events', label: 'События', color: 'bg-green-600', items: [
      { type: 'OnPlayerEnter', label: 'Игрок вошёл' },
      { type: 'OnTimer', label: 'Таймер' },
      { type: 'OnInteract', label: 'Взаимодействие' },
    ]},
    { category: 'actions', label: 'Действия', color: 'bg-blue-600', items: [
      { type: 'MoveTo', label: 'Двигать к' },
      { type: 'PlaySound', label: 'Звук' },
      { type: 'ToggleDoor', label: 'Дверь' },
      { type: 'SpawnItem', label: 'Спавн' },
      { type: 'SetVariable', label: 'Переменная' },
    ]},
    { category: 'logic', label: 'Логика', color: 'bg-purple-600', items: [
      { type: 'CompareValue', label: 'Сравнить' },
      { type: 'LogicAnd', label: 'И' },
      { type: 'LogicOr', label: 'ИЛИ' },
      { type: 'Delay', label: 'Задержка' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col pointer-events-auto" style={{ animation: 'scaleIn 0.2s ease' }}>
      {/* Toolbar */}
      <div className="glass-panel rounded-none flex items-center gap-3 px-4 py-2 border-b border-white/10">
        <span className="text-white font-bold text-sm">🔗 Скрипты</span>
        <div className="h-5 w-px bg-white/10" />
        {nodeTypes.map(group => (
          <div key={group.category} className="flex items-center gap-1">
            <span className="text-gray-400 text-[10px]">{group.label}:</span>
            {group.items.map(item => (
              <button key={item.type} onClick={() => handleAddNode(item.type)}
                className={`px-2 py-0.5 ${group.color} hover:opacity-80 text-white rounded text-[10px] transition`}>
                {item.label}
              </button>
            ))}
            <div className="h-4 w-px bg-white/10 mx-1" />
          </div>
        ))}
        <button onClick={handleDeleteSelected}
          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] transition">
          Удалить
        </button>
        <div className="flex-1" />
        <button onClick={onClose}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition">
          ✕ Закрыть
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-[#1a1a2e]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
