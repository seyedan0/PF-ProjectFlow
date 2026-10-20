import React, { useState } from 'react';
import { X, Copy, Check, FileText, Sparkles } from 'lucide-react';

export function PromptModal({ isOpen, onClose, prompt, taskId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const wordCount = prompt ? prompt.split(/\s+/).filter(Boolean).length : 0;
  const tokenEstimate = Math.round(wordCount * 1.3);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[85vh] bg-obsidian-900 border border-emerald-500/30 rounded-2xl shadow-card shadow-glow flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-obsidian-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-50 flex items-center gap-2">
                <span>Task Context Bundle</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {taskId || 'active'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Deterministic prompt bundle compiled for your coding agent</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-emerald-400 font-semibold">{wordCount} words (~{tokenEstimate} tokens)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-obsidian-950 font-bold text-xs transition-all shadow-glow-sm"
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
              <span>{copied ? 'Copied Prompt!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 bg-obsidian-950/60 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-all">
          {prompt || 'No active task found. Generate a task first.'}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-obsidian-950/90 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero external AI API cost • Pre-compiled from .project-control graphs</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Saved to: .project-control/NEXT_TASK_PROMPT.md
          </span>
        </div>
      </div>
    </div>
  );
}
