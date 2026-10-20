import React from 'react';
import { 
  Milestone, 
  Network, 
  FolderTree, 
  ListTodo, 
  Lightbulb, 
  Plus
} from 'lucide-react';

export function TabBar({ activeTab, onSelectTab, counts, onAddNode }) {
  const tabs = [
    {
      id: 'roadmap',
      label: 'Macro Roadmap',
      icon: Milestone,
      count: counts.roadmap,
      desc: 'Phases & Milestones',
      color: 'text-emerald-400'
    },
    {
      id: 'architecture',
      label: 'API & Architecture',
      icon: Network,
      count: counts.architecture,
      desc: 'Modules, Endpoints, Models & Rules',
      color: 'text-blue-400'
    },
    {
      id: 'codebase',
      label: 'Codebase & File Map',
      icon: FolderTree,
      count: counts.codebase,
      desc: 'File roles & Architecture drift',
      color: 'text-purple-400'
    },
    {
      id: 'tasks',
      label: 'Active Rolling-Wave Tasks',
      icon: ListTodo,
      count: counts.tasks,
      desc: 'Horizon tasks & AC',
      color: 'text-cyan-400'
    },
    {
      id: 'canvas',
      label: 'Ideation Canvas',
      icon: Lightbulb,
      count: counts.canvas,
      desc: 'Whiteboard & Notes',
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="px-5 py-2 border-b border-white/5 bg-obsidian-950/70 flex items-center justify-between gap-3 overflow-x-auto z-10 flex-shrink-0">
      <div className="flex items-center gap-1.5 min-w-max">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-glow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-emerald-500/25 text-emerald-200'
                      : 'bg-obsidian-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add New Node to current tab */}
      <button
        onClick={onAddNode}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-obsidian-950 font-semibold text-xs transition-all shadow-glow-sm flex-shrink-0"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Add {activeTab === 'roadmap' ? 'Milestone' : activeTab === 'tasks' ? 'Task' : activeTab === 'canvas' ? 'Note' : 'Node'}</span>
      </button>
    </div>
  );
}
