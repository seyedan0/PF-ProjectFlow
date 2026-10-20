import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  Terminal, 
  BookOpen, 
  ChevronRight,
  X 
} from 'lucide-react';

export function OnboardingBanner({ onSwitchDemo, isDemo }) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const SETUP_PROMPT = `Read BOOTSTRAP_INTAKE.md and .agents/skills/project-flow/SKILL.md. Analyze our project docs and initialize ProjectFlow (.project-control/) with our Macro Roadmap, API Structure, Architecture Rules, and initial tasks.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(SETUP_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (dismissed && !isDemo) {
    return (
      <div className="bg-obsidian-900 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>ProjectFlow is uninitialized. Give the setup prompt to your IDE agent to generate project control graphs.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPrompt}
            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 flex items-center gap-1 font-mono text-[11px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Setup Prompt'}</span>
          </button>
          <button
            onClick={() => setDismissed(false)}
            className="text-slate-400 hover:text-slate-200 text-xs underline"
          >
            Show Details
          </button>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-obsidian-900 via-obsidian-800 to-obsidian-900 border-b border-emerald-500/20 p-5 shadow-lg z-20">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-obsidian-700/50 transition-colors"
        title="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left column */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ProjectFlow Uninitialized — Ready for Target Project
            </span>
          </div>

          <h2 className="text-base font-bold text-emerald-50 tracking-tight">
            Repository Control Graphs are Clean & Blank
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            ProjectFlow operates with <strong className="text-emerald-300">zero external AI API keys</strong>. Your IDE coding agent (Antigravity, Cursor, Claude Code) reads your project specs, populates <code className="text-emerald-400 bg-obsidian-950 px-1 py-0.5 rounded font-mono">.project-control/</code>, and drives rolling-wave task execution.
          </p>
        </div>

        {/* Right column: Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto flex-shrink-0">
          <button
            onClick={handleCopyPrompt}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-obsidian-950 font-bold text-xs transition-all shadow-glow hover:shadow-glow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied Agent Prompt!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[2.5]" />
                <span>1-Click Copy Setup Prompt</span>
              </>
            )}
          </button>

          {!isDemo && (
            <button
              onClick={() => onSwitchDemo(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-obsidian-700 hover:bg-obsidian-600 text-slate-200 border border-white/10 hover:border-amber-500/40 font-medium text-xs transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore Demo Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Setup Prompt preview */}
      <div className="max-w-5xl mx-auto mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
        <span className="text-slate-500 font-mono text-[11px] flex-shrink-0 flex items-center gap-1">
          <Terminal className="w-3 h-3" />
          IDE Prompt:
        </span>
        <code className="font-mono text-[11px] text-emerald-300 bg-obsidian-950/90 px-2.5 py-1 rounded-md border border-white/5 flex-grow truncate select-all">
          "{SETUP_PROMPT}"
        </code>
      </div>
    </div>
  );
}
