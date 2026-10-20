import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Check, 
  AlertCircle, 
  Layers, 
  FileCode, 
  Network, 
  Database, 
  ShieldAlert, 
  ListTodo, 
  StickyNote, 
  Plus
} from 'lucide-react';

export function InspectorDrawer({ 
  isOpen, 
  onClose, 
  selectedEntity, 
  entityType, 
  activeTab, 
  onSave, 
  onDelete, 
  saving 
}) {
  const [formData, setFormData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (selectedEntity) {
      setFormData({ ...selectedEntity });
      setErrorMessage(null);
      setSaveSuccess(false);
    }
  }, [selectedEntity]);

  if (!isOpen || !selectedEntity) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, text) => {
    const arr = text.split('\n').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      [field]: arr
    }));
  };

  const handleJsonChange = (field, text) => {
    try {
      if (!text.trim()) {
        handleChange(field, null);
      } else {
        const parsed = JSON.parse(text);
        handleChange(field, parsed);
      }
      setErrorMessage(null);
    } catch {
      // Keep raw string or mark invalid
      handleChange(field, text);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await onSave(formData, entityType);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save changes');
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case 'milestone': return 'Milestone Inspector';
      case 'module': return 'Module Inspector';
      case 'api': return 'API Endpoint Inspector';
      case 'dataModel': return 'Data Model Inspector';
      case 'rule': return 'Rule Inspector';
      case 'task': return 'Task Inspector';
      case 'file': return 'Codebase File Inspector';
      case 'canvas': return 'Canvas Note Inspector';
      default: return 'Node Inspector';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-obsidian-900 border-l border-white/10 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-obsidian-950/70">
        <div>
          <h3 className="font-bold text-sm text-emerald-50 flex items-center gap-2">
            <span>{getEntityTitle()}</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
              {formData.id || formData.path || 'New'}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">Two-way edits persist to .project-control JSON</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-obsidian-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Common ID field */}
        {entityType !== 'file' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">ID</label>
            <input
              type="text"
              value={formData.id || ''}
              onChange={(e) => handleChange('id', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
              required
            />
          </div>
        )}

        {/* 1. Milestone specific fields */}
        {entityType === 'milestone' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
              <select
                value={formData.status || 'planned'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Outcome</label>
              <textarea
                value={formData.targetOutcome || ''}
                onChange={(e) => handleChange('targetOutcome', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Deliverables (one per line)</label>
              <textarea
                value={(formData.deliverables || []).join('\n')}
                onChange={(e) => handleArrayChange('deliverables', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>
          </>
        )}

        {/* 2. Module specific fields */}
        {entityType === 'module' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Layer</label>
              <select
                value={formData.layer || 'core'}
                onChange={(e) => handleChange('layer', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              >
                <option value="core">Core</option>
                <option value="server">Server</option>
                <option value="ui">UI</option>
                <option value="cli">CLI</option>
                <option value="scanner">Scanner</option>
                <option value="shared">Shared</option>
                <option value="config">Config</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Responsibilities (one per line)</label>
              <textarea
                value={(formData.responsibilities || []).join('\n')}
                onChange={(e) => handleArrayChange('responsibilities', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dependencies (comma separated)</label>
              <input
                type="text"
                value={(formData.dependencies || []).join(', ')}
                onChange={(e) => handleChange('dependencies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none font-mono"
              />
            </div>
          </>
        )}

        {/* 3. API Endpoint fields */}
        {entityType === 'api' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Method</label>
                <select
                  value={formData.method || 'GET'}
                  onChange={(e) => handleChange('method', e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs font-mono outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Endpoint Path</label>
                <input
                  type="text"
                  value={formData.endpoint || formData.path || ''}
                  onChange={(e) => handleChange('endpoint', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Module ID</label>
              <input
                type="text"
                value={formData.moduleId || ''}
                onChange={(e) => handleChange('moduleId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Request Payload (JSON)</label>
              <textarea
                value={typeof formData.requestPayload === 'object' ? JSON.stringify(formData.requestPayload, null, 2) : formData.requestPayload || ''}
                onChange={(e) => handleJsonChange('requestPayload', e.target.value)}
                rows={2}
                placeholder="{ }"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Response Payload (JSON)</label>
              <textarea
                value={typeof formData.responsePayload === 'object' ? JSON.stringify(formData.responsePayload, null, 2) : formData.responsePayload || ''}
                onChange={(e) => handleJsonChange('responsePayload', e.target.value)}
                rows={2}
                placeholder="{ }"
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
              />
            </div>
          </>
        )}

        {/* 4. Task specific fields */}
        {entityType === 'task' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Task Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status || 'ready'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
                >
                  <option value="ready">Ready</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="planned">Planned</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Milestone</label>
                <input
                  type="text"
                  value={formData.milestoneId || ''}
                  onChange={(e) => handleChange('milestoneId', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Acceptance Criteria (one per line)</label>
              <textarea
                value={(formData.acceptanceCriteria || []).join('\n')}
                onChange={(e) => handleArrayChange('acceptanceCriteria', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Files (one per line)</label>
              <textarea
                value={(formData.assignedFiles || []).join('\n')}
                onChange={(e) => handleArrayChange('assignedFiles', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
              />
            </div>
          </>
        )}

        {/* 5. Codebase File fields */}
        {entityType === 'file' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">File Path</label>
              <input
                type="text"
                value={formData.path || ''}
                onChange={(e) => handleChange('path', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 font-mono text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Layer</label>
              <select
                value={formData.layer || 'core'}
                onChange={(e) => handleChange('layer', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              >
                <option value="core">Core</option>
                <option value="server">Server</option>
                <option value="ui">UI</option>
                <option value="cli">CLI</option>
                <option value="config">Config</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Role</label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Intended Responsibility</label>
              <textarea
                value={formData.intendedResponsibility || ''}
                onChange={(e) => handleChange('intendedResponsibility', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observed Responsibility (Drift check)</label>
              <textarea
                value={formData.observedResponsibility || ''}
                onChange={(e) => handleChange('observedResponsibility', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>
          </>
        )}

        {/* 6. Sticky Note fields */}
        {entityType === 'canvas' && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Note Title / Label</label>
              <input
                type="text"
                value={formData.label || formData.data?.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Color Theme</label>
              <select
                value={formData.color || formData.data?.color || 'emerald'}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              >
                <option value="emerald">Emerald</option>
                <option value="cyan">Cyan</option>
                <option value="yellow">Yellow</option>
                <option value="rose">Rose</option>
                <option value="purple">Purple</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Note Content</label>
              <textarea
                value={formData.description || formData.data?.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-obsidian-950 border border-white/10 focus:border-emerald-500 text-slate-200 text-xs outline-none"
              />
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-obsidian-950 font-bold text-xs transition-all shadow-glow-sm disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </>
            )}
          </button>

          {formData.id && (
            <button
              type="button"
              onClick={() => onDelete(formData.id || formData.path, entityType)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 transition-colors"
              title="Delete node"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
