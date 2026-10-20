import React from 'react';
import { 
  Workflow, 
  Sparkles, 
  LayoutDashboard, 
  ExternalLink, 
  RefreshCw,
  FolderGit2,
  FileCheck2,
  RotateCcw
} from 'lucide-react';

export function Header({ 
  state, 
  roadmap, 
  architecture, 
  codebaseMap, 
  isDemo, 
  onToggleDemo, 
  onAutoLayout, 
  onRefresh,
  loading 
}) {
  const isInitialized = Boolean(state?.initialized);
  const projectName = state?.projectName || (isInitialized ? 'Active Project' : 'Blank Template');

  const milestoneCount = roadmap?.milestones?.length || 0;
  const apiCount = architecture?.apis?.length || 0;
  const taskCount = state?.activeTasks?.length || state?.activeHorizonTasks?.length || 0;
  const fileCount = codebaseMap?.entries?.length || codebaseMap?.files?.length || 0;

  return (
    <header className="h-16 px-5 border-b border-white/5 bg-obsidian-900/90 backdrop-blur-md flex items-center justify-between gap-4 z-20 flex-shrink-0">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-sm">
          <Workflow className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-emerald-50 tracking-tight flex items-center gap-1.5">
              <span>ProjectFlow</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                pf studio
              </span>
            </h1>
            <span className="text-slate-600">/</span>
            <span className="font-semibold text-xs text-slate-200">
              {projectName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isInitialized ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Initialized
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Uninitialized Template
              </span>
            )}
            <span className="text-slate-600">•</span>
            <span>{milestoneCount} milestones</span>
            <span className="text-slate-600">•</span>
            <span>{apiCount} APIs</span>
            <span className="text-slate-600">•</span>
            <span>{taskCount} active tasks</span>
          </div>
        </div>
      </div>

      {/* Center / Mode indicator */}
      <div className="hidden md:flex items-center gap-2 bg-obsidian-950/80 px-3 py-1.5 rounded-xl border border-white/5 text-xs">
        <span className="text-slate-500 font-mono text-[11px]">Source:</span>
        {isDemo ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-amber-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              DEMO (templates/example-project/)
            </span>
            <button
              onClick={() => onToggleDemo(false)}
              className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              Switch to Target
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              LIVE (.project-control/)
            </span>
            <button
              onClick={() => onToggleDemo(true)}
              className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
            >
              Preview Demo
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-white/10 hover:border-emerald-500/30 text-xs font-medium transition-all shadow-sm"
          title="Auto-arrange nodes using ELKjs layered layout"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Auto-Layout</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 border border-white/10 hover:border-emerald-500/30 text-xs transition-all disabled:opacity-50"
          title="Refresh State"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  );
}
