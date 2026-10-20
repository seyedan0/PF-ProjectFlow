import React, { useState } from 'react';
import { 
  Bot, 
  FileText, 
  GitFork, 
  Search, 
  RefreshCw, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function AgentCommandBar({ 
  onBundlePrompt, 
  onSyncRules, 
  onResetControl, 
  activeTaskId, 
  isDemo 
}) {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied to clipboard: "${label}"`);
  };

  // Agent Prompts (Zero AI API - deterministic prompts for the IDE agent)
  const NEXT_TASK_PROMPT = `Read .agents/skills/project-flow/SKILL.md (Mode 1: Next Task / Rolling-Wave Planner). Check .project-control/roadmap.json and .project-control/state.json. Generate the next rolling-wave task for the active milestone, update state.json, and run npm run pf:prompt.`;

  const DRIFT_AUDIT_PROMPT = `Read .agents/skills/project-flow/SKILL.md (Mode 4: Architecture Drift & Codebase Map Auditor). Audit codebase files against .project-control/architecture.json, detect any architectural or layer drift, and update .project-control/codebase-map.json.`;

  const TASK_COMPLETION_PROMPT = `Read .agents/skills/project-flow/SKILL.md (Mode 2: Task Execution & Finisher). Verify the acceptance criteria for ${activeTaskId || 'the active task'}, update codebase-map.json, and run: npm run pf:complete ${activeTaskId || '<taskId>'} -- --summary "Completed deliverables".`;

  return (
    <div className="border-t border-white/5 bg-obsidian-900/95 backdrop-blur-md px-5 py-2.5 flex items-center justify-between gap-4 z-10 flex-shrink-0">
      {/* Left: Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold">
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Agent Command Bar</span>
        </div>
        <span className="hidden lg:inline text-[11px] text-slate-500">
          Zero AI API • Copy ready-to-paste instructions for your IDE agent
        </span>
      </div>

      {/* Center: Command Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Next Task Planner */}
        <button
          onClick={() => copyToClipboard(NEXT_TASK_PROMPT, 'Ask Agent: Generate Next Task')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-white/10 hover:border-emerald-500/30 text-xs font-medium transition-all group"
          title="Copies prompt to instruct IDE Agent to plan next rolling wave task"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Plan Next Task</span>
        </button>

        {/* Copy Context Bundle */}
        <button
          onClick={onBundlePrompt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600/30 to-emerald-700/30 hover:from-emerald-600/40 hover:to-emerald-700/40 text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition-all shadow-glow-sm"
          title="Build and view NEXT_TASK_PROMPT.md context bundle"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Context Bundle (NEXT_TASK_PROMPT)</span>
        </button>

        {/* Drift Audit */}
        <button
          onClick={() => copyToClipboard(DRIFT_AUDIT_PROMPT, 'Ask Agent: Run Architecture Drift Audit')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-white/10 hover:border-amber-500/30 text-xs font-medium transition-all group"
          title="Copies prompt to instruct IDE Agent to audit codebase map for drift"
        >
          <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Drift Audit</span>
        </button>

        {/* Sync Rules */}
        <button
          onClick={onSyncRules}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-white/10 hover:border-cyan-500/30 text-xs font-medium transition-all"
          title="Syncs rules to .cursorrules, CLAUDE.md, and .agents/rules/"
        >
          <GitFork className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sync Rules</span>
        </button>

        {/* Reset State */}
        {!isDemo && (
          <button
            onClick={onResetControl}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20 text-xs transition-all"
            title="Reset .project-control/ to clean blank template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute bottom-16 right-6 bg-obsidian-800 text-emerald-300 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-card shadow-glow-sm z-50 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
