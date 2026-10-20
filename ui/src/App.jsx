import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge
} from '@xyflow/react';

// Custom Nodes
import { MilestoneNode } from './components/nodes/MilestoneNode.jsx';
import { ModuleNode } from './components/nodes/ModuleNode.jsx';
import { ApiNode } from './components/nodes/ApiNode.jsx';
import { DataModelNode } from './components/nodes/DataModelNode.jsx';
import { RuleNode } from './components/nodes/RuleNode.jsx';
import { FileNode } from './components/nodes/FileNode.jsx';
import { TaskNode } from './components/nodes/TaskNode.jsx';
import { StickyNoteNode } from './components/nodes/StickyNoteNode.jsx';

// UI Shell Components
import { Header } from './components/Header.jsx';
import { TabBar } from './components/TabBar.jsx';
import { OnboardingBanner } from './components/OnboardingBanner.jsx';
import { AgentCommandBar } from './components/AgentCommandBar.jsx';
import { InspectorDrawer } from './components/InspectorDrawer.jsx';
import { PromptModal } from './components/PromptModal.jsx';

// Utilities
import { 
  fetchProjectState, 
  saveProjectFile, 
  bundlePrompt, 
  syncRules, 
  resetControlState 
} from './utils/api.js';
import { getLayoutedElements } from './utils/layout.js';

const nodeTypes = {
  milestoneNode: MilestoneNode,
  moduleNode: ModuleNode,
  apiNode: ApiNode,
  dataModelNode: DataModelNode,
  ruleNode: RuleNode,
  fileNode: FileNode,
  taskNode: TaskNode,
  stickyNoteNode: StickyNoteNode
};

export default function App() {
  // Query param check for ?demo=true
  const initialDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
  const [isDemo, setIsDemo] = useState(initialDemo);

  // Raw project state from server
  const [rawData, setRawData] = useState({
    state: { initialized: false },
    roadmap: { milestones: [], edges: [] },
    architecture: { modules: [], apis: [], dataModels: [], rules: [], edges: [] },
    codebaseMap: { entries: [], files: [], dependencies: [] },
    canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
    activity: []
  });

  const [activeTab, setActiveTab] = useState('roadmap');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Inspector & Modal state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState(null);

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Load project state
  const loadState = useCallback(async (demoMode = isDemo) => {
    setLoading(true);
    try {
      const data = await fetchProjectState(demoMode);
      setRawData(data);
      if (typeof data.isDemo === 'boolean') {
        setIsDemo(data.isDemo);
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    loadState(isDemo);
  }, [loadState, isDemo]);

  const handleToggleDemo = (newDemoVal) => {
    setIsDemo(newDemoVal);
    const url = new URL(window.location.href);
    if (newDemoVal) {
      url.searchParams.set('demo', 'true');
    } else {
      url.searchParams.delete('demo');
    }
    window.history.pushState({}, '', url.toString());
    loadState(newDemoVal);
  };

  // Convert raw data to React Flow nodes/edges for the active tab
  const buildGraphForTab = useCallback((tab, data) => {
    let graphNodes = [];
    let graphEdges = [];
    let direction = 'RIGHT';

    if (tab === 'roadmap') {
      const milestones = data.roadmap?.milestones || [];
      const rawEdges = data.roadmap?.edges || [];

      graphNodes = milestones.map((m, index) => ({
        id: m.id,
        type: 'milestoneNode',
        position: { x: index * 360, y: 150 },
        data: {
          milestone: m,
          isActive: data.state?.activeMilestoneId === m.id
        }
      }));

      if (rawEdges.length > 0) {
        graphEdges = rawEdges.map(e => ({
          id: e.id || `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label || '',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2 }
        }));
      } else {
        // Derive edges from dependencies
        milestones.forEach(m => {
          (m.dependencies || []).forEach(depId => {
            graphEdges.push({
              id: `edge-${depId}-${m.id}`,
              source: depId,
              target: m.id,
              animated: true,
              style: { stroke: '#10b981', strokeWidth: 2 }
            });
          });
        });
      }
    } else if (tab === 'architecture') {
      direction = 'DOWN';
      const modules = data.architecture?.modules || [];
      const apis = data.architecture?.apis || [];
      const models = data.architecture?.dataModels || [];
      const rules = data.architecture?.rules || [];
      const rawEdges = data.architecture?.edges || [];

      // Modules
      modules.forEach((mod, idx) => {
        graphNodes.push({
          id: mod.id,
          type: 'moduleNode',
          position: { x: idx * 320, y: 50 },
          data: { module: mod }
        });
      });

      // APIs
      apis.forEach((api, idx) => {
        graphNodes.push({
          id: api.id,
          type: 'apiNode',
          position: { x: idx * 340, y: 260 },
          data: { api }
        });
        if (api.moduleId) {
          graphEdges.push({
            id: `edge-${api.moduleId}-${api.id}`,
            source: api.moduleId,
            target: api.id,
            label: 'exposes',
            style: { stroke: '#3b82f6', strokeWidth: 1.5 }
          });
        }
      });

      // Models
      models.forEach((model, idx) => {
        graphNodes.push({
          id: model.id,
          type: 'dataModelNode',
          position: { x: idx * 300, y: 480 },
          data: { model }
        });
        if (model.moduleId) {
          graphEdges.push({
            id: `edge-${model.moduleId}-${model.id}`,
            source: model.moduleId,
            target: model.id,
            label: 'persists',
            style: { stroke: '#06b6d4', strokeWidth: 1.5 }
          });
        }
      });

      // Rules
      rules.forEach((rule, idx) => {
        graphNodes.push({
          id: rule.id,
          type: 'ruleNode',
          position: { x: idx * 300, y: 700 },
          data: { rule }
        });
      });

      // Include custom edges
      rawEdges.forEach(e => {
        if (!graphEdges.some(ge => ge.source === e.source && ge.target === e.target)) {
          graphEdges.push({
            id: e.id || `arch-${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            label: e.label || '',
            style: { stroke: '#10b981', strokeWidth: 2 }
          });
        }
      });
    } else if (tab === 'codebase') {
      const files = data.codebaseMap?.entries || data.codebaseMap?.files || [];
      const dependencies = data.codebaseMap?.dependencies || [];

      graphNodes = files.map((file, idx) => {
        const hasDrift = Boolean(
          file.intendedResponsibility && file.observedResponsibility &&
          file.intendedResponsibility.trim().toLowerCase() !== file.observedResponsibility.trim().toLowerCase()
        );

        return {
          id: file.path,
          type: 'fileNode',
          position: { x: (idx % 3) * 300, y: Math.floor(idx / 3) * 220 },
          data: {
            file,
            hasDrift
          }
        };
      });

      dependencies.forEach((dep, i) => {
        graphEdges.push({
          id: `dep-${i}`,
          source: dep.source || dep.from,
          target: dep.target || dep.to,
          label: dep.type || 'imports',
          style: { stroke: '#a855f7', strokeWidth: 1.5 }
        });
      });
    } else if (tab === 'tasks') {
      const activeTasks = data.state?.activeTasks || data.state?.activeHorizonTasks || [];

      graphNodes = activeTasks.map((t, idx) => ({
        id: t.id,
        type: 'taskNode',
        position: { x: idx * 350, y: 150 },
        data: { task: t }
      }));

      // Connect sequential tasks
      for (let i = 0; i < activeTasks.length - 1; i++) {
        graphEdges.push({
          id: `task-flow-${activeTasks[i].id}-${activeTasks[i + 1].id}`,
          source: activeTasks[i].id,
          target: activeTasks[i + 1].id,
          animated: true,
          label: 'next',
          style: { stroke: '#10b981', strokeWidth: 2 }
        });
      }
    } else if (tab === 'canvas') {
      const canvasNodes = data.canvas?.nodes || [];
      const canvasEdges = data.canvas?.edges || [];

      graphNodes = canvasNodes.map(n => ({
        id: n.id,
        type: n.type || 'stickyNoteNode',
        position: n.position || { x: 100, y: 100 },
        data: n.data || { label: 'Note' }
      }));

      graphEdges = canvasEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated !== false,
        label: e.label || '',
        style: e.style || { stroke: '#f59e0b', strokeWidth: 2 }
      }));
    }

    return { graphNodes, graphEdges, direction };
  }, []);

  // Update React Flow when activeTab or rawData changes
  const applyLayoutAndSet = useCallback(async (tab, data) => {
    const { graphNodes, graphEdges, direction } = buildGraphForTab(tab, data);

    if (tab === 'canvas' && graphNodes.length > 0 && graphNodes.some(n => n.position.x !== 0 || n.position.y !== 0)) {
      // Use saved canvas coordinates without re-layout
      setNodes(graphNodes);
      setEdges(graphEdges);
    } else if (graphNodes.length > 0) {
      const layouted = await getLayoutedElements(graphNodes, graphEdges, { direction });
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [buildGraphForTab, setNodes, setEdges]);

  useEffect(() => {
    applyLayoutAndSet(activeTab, rawData);
  }, [activeTab, rawData, applyLayoutAndSet]);

  // Handle Node Drag Stop: Auto-save position to canvas.json if in canvas tab or update state
  const onNodeDragStop = useCallback(async (event, node) => {
    if (activeTab === 'canvas') {
      const updatedNodes = (rawData.canvas?.nodes || []).map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            position: { x: Math.round(node.position.x), y: Math.round(node.position.y) }
          };
        }
        return n;
      });

      const updatedCanvas = {
        ...(rawData.canvas || {}),
        nodes: updatedNodes
      };

      try {
        await saveProjectFile('canvas', updatedCanvas, isDemo);
        setRawData(prev => ({ ...prev, canvas: updatedCanvas }));
      } catch (err) {
        console.error('Error saving node position to canvas.json:', err);
      }
    }
  }, [activeTab, rawData.canvas, isDemo]);

  // Node Click -> Open Inspector Drawer
  const onNodeClick = useCallback((event, node) => {
    let entity = null;
    let type = 'unknown';

    if (node.type === 'milestoneNode') {
      entity = node.data.milestone || node.data;
      type = 'milestone';
    } else if (node.type === 'moduleNode') {
      entity = node.data.module || node.data;
      type = 'module';
    } else if (node.type === 'apiNode') {
      entity = node.data.api || node.data;
      type = 'api';
    } else if (node.type === 'dataModelNode') {
      entity = node.data.model || node.data;
      type = 'dataModel';
    } else if (node.type === 'ruleNode') {
      entity = node.data.rule || node.data;
      type = 'rule';
    } else if (node.type === 'taskNode') {
      entity = node.data.task || node.data;
      type = 'task';
    } else if (node.type === 'fileNode') {
      entity = node.data.file || node.data;
      type = 'file';
    } else if (node.type === 'stickyNoteNode') {
      entity = { id: node.id, ...node.data };
      type = 'canvas';
    }

    if (entity) {
      setSelectedEntity(entity);
      setSelectedEntityType(type);
      setInspectorOpen(true);
    }
  }, []);

  // Save changes from Inspector Drawer directly to .project-control JSON
  const handleSaveEntity = async (entityData, type) => {
    setSaving(true);
    try {
      if (type === 'milestone') {
        const milestones = [...(rawData.roadmap?.milestones || [])];
        const existingIdx = milestones.findIndex(m => m.id === entityData.id);
        if (existingIdx !== -1) {
          milestones[existingIdx] = entityData;
        } else {
          milestones.push(entityData);
        }
        const updatedRoadmap = { ...(rawData.roadmap || {}), milestones };
        await saveProjectFile('roadmap', updatedRoadmap, isDemo);
        setRawData(prev => ({ ...prev, roadmap: updatedRoadmap }));
      } else if (type === 'module' || type === 'api' || type === 'dataModel' || type === 'rule') {
        const arch = { ...(rawData.architecture || {}) };
        if (type === 'module') {
          const list = [...(arch.modules || [])];
          const idx = list.findIndex(m => m.id === entityData.id);
          if (idx !== -1) list[idx] = entityData; else list.push(entityData);
          arch.modules = list;
        } else if (type === 'api') {
          const list = [...(arch.apis || [])];
          const idx = list.findIndex(a => a.id === entityData.id);
          if (idx !== -1) list[idx] = entityData; else list.push(entityData);
          arch.apis = list;
        } else if (type === 'dataModel') {
          const list = [...(arch.dataModels || [])];
          const idx = list.findIndex(m => m.id === entityData.id);
          if (idx !== -1) list[idx] = entityData; else list.push(entityData);
          arch.dataModels = list;
        } else if (type === 'rule') {
          const list = [...(arch.rules || [])];
          const idx = list.findIndex(r => r.id === entityData.id);
          if (idx !== -1) list[idx] = entityData; else list.push(entityData);
          arch.rules = list;
        }
        await saveProjectFile('architecture', arch, isDemo);
        setRawData(prev => ({ ...prev, architecture: arch }));
      } else if (type === 'task') {
        const st = { ...(rawData.state || {}) };
        const tasks = [...(st.activeTasks || st.activeHorizonTasks || [])];
        const idx = tasks.findIndex(t => t.id === entityData.id);
        if (idx !== -1) tasks[idx] = entityData; else tasks.push(entityData);
        st.activeTasks = tasks;
        await saveProjectFile('state', st, isDemo);
        setRawData(prev => ({ ...prev, state: st }));
      } else if (type === 'file') {
        const cmap = { ...(rawData.codebaseMap || {}) };
        const entries = [...(cmap.entries || cmap.files || [])];
        const idx = entries.findIndex(f => f.path === entityData.path);
        if (idx !== -1) entries[idx] = entityData; else entries.push(entityData);
        cmap.entries = entries;
        await saveProjectFile('codebase-map', cmap, isDemo);
        setRawData(prev => ({ ...prev, codebaseMap: cmap }));
      } else if (type === 'canvas') {
        const cvs = { ...(rawData.canvas || {}) };
        const canvasNodes = [...(cvs.nodes || [])];
        const idx = canvasNodes.findIndex(n => n.id === entityData.id);
        const nodeObj = {
          id: entityData.id,
          type: 'stickyNoteNode',
          position: entityData.position || { x: 100, y: 100 },
          data: {
            label: entityData.label || 'Note',
            description: entityData.description || '',
            color: entityData.color || 'emerald',
            tags: entityData.tags || []
          }
        };
        if (idx !== -1) canvasNodes[idx] = nodeObj; else canvasNodes.push(nodeObj);
        cvs.nodes = canvasNodes;
        await saveProjectFile('canvas', cvs, isDemo);
        setRawData(prev => ({ ...prev, canvas: cvs }));
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Delete Entity from Inspector Drawer
  const handleDeleteEntity = async (entityId, type) => {
    if (!window.confirm(`Are you sure you want to delete ${entityId}?`)) return;
    setSaving(true);
    try {
      if (type === 'milestone') {
        const milestones = (rawData.roadmap?.milestones || []).filter(m => m.id !== entityId);
        const updated = { ...(rawData.roadmap || {}), milestones };
        await saveProjectFile('roadmap', updated, isDemo);
        setRawData(prev => ({ ...prev, roadmap: updated }));
      } else if (type === 'module' || type === 'api' || type === 'dataModel' || type === 'rule') {
        const arch = { ...(rawData.architecture || {}) };
        if (type === 'module') arch.modules = (arch.modules || []).filter(m => m.id !== entityId);
        if (type === 'api') arch.apis = (arch.apis || []).filter(a => a.id !== entityId);
        if (type === 'dataModel') arch.dataModels = (arch.dataModels || []).filter(m => m.id !== entityId);
        if (type === 'rule') arch.rules = (arch.rules || []).filter(r => r.id !== entityId);
        await saveProjectFile('architecture', arch, isDemo);
        setRawData(prev => ({ ...prev, architecture: arch }));
      } else if (type === 'task') {
        const st = { ...(rawData.state || {}) };
        st.activeTasks = (st.activeTasks || st.activeHorizonTasks || []).filter(t => t.id !== entityId);
        await saveProjectFile('state', st, isDemo);
        setRawData(prev => ({ ...prev, state: st }));
      } else if (type === 'file') {
        const cmap = { ...(rawData.codebaseMap || {}) };
        cmap.entries = (cmap.entries || cmap.files || []).filter(f => f.path !== entityId);
        await saveProjectFile('codebase-map', cmap, isDemo);
        setRawData(prev => ({ ...prev, codebaseMap: cmap }));
      } else if (type === 'canvas') {
        const cvs = { ...(rawData.canvas || {}) };
        cvs.nodes = (cvs.nodes || []).filter(n => n.id !== entityId);
        await saveProjectFile('canvas', cvs, isDemo);
        setRawData(prev => ({ ...prev, canvas: cvs }));
      }
      setInspectorOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Open Inspector with a fresh blank skeleton for active tab
  const handleAddNewNode = () => {
    let blank = {};
    let type = 'unknown';

    if (activeTab === 'roadmap') {
      const nextOrder = (rawData.roadmap?.milestones?.length || 0) + 1;
      blank = {
        id: `M${nextOrder}`,
        title: `Phase ${nextOrder}`,
        status: 'planned',
        order: nextOrder,
        description: '',
        targetOutcome: '',
        deliverables: [],
        dependencies: []
      };
      type = 'milestone';
    } else if (activeTab === 'architecture') {
      blank = {
        id: `MOD-NEW`,
        name: 'New Module',
        layer: 'core',
        description: '',
        responsibilities: [],
        dependencies: []
      };
      type = 'module';
    } else if (activeTab === 'codebase') {
      blank = {
        path: 'src/new-file.js',
        role: 'Component or service role',
        layer: 'core',
        intendedResponsibility: '',
        observedResponsibility: '',
        status: 'planned'
      };
      type = 'file';
    } else if (activeTab === 'tasks') {
      const nextNum = (rawData.state?.activeTasks?.length || 0) + 1;
      blank = {
        id: `TASK-0${nextNum}`,
        title: `Implement feature ${nextNum}`,
        status: 'ready',
        description: '',
        acceptanceCriteria: ['Feature implementation meets design specs'],
        assignedFiles: []
      };
      type = 'task';
    } else if (activeTab === 'canvas') {
      blank = {
        id: `note-${Date.now().toString(36)}`,
        label: 'New Idea',
        color: 'emerald',
        description: '',
        tags: ['idea']
      };
      type = 'canvas';
    }

    setSelectedEntity(blank);
    setSelectedEntityType(type);
    setInspectorOpen(true);
  };

  // Trigger Context Bundle modal
  const handleBundlePrompt = async () => {
    try {
      const res = await bundlePrompt(null, isDemo);
      setPromptContent(res.prompt);
      setActiveTaskId(res.taskId);
      setPromptModalOpen(true);
    } catch (err) {
      alert(`Error bundling prompt: ${err.message}`);
    }
  };

  // Trigger Sync Rules
  const handleSyncRules = async () => {
    try {
      const res = await syncRules();
      alert(`✔ ${res.message}`);
    } catch (err) {
      alert(`Error syncing rules: ${err.message}`);
    }
  };

  // Reset .project-control to blank
  const handleResetControl = async () => {
    if (!window.confirm('Reset .project-control/ to clean blank template state? This will clear all project data.')) {
      return;
    }
    try {
      await resetControlState();
      await loadState(false);
      alert('✔ .project-control has been reset to clean blank templates.');
    } catch (err) {
      alert(`Error resetting: ${err.message}`);
    }
  };

  // Tab Badge counts
  const counts = useMemo(() => ({
    roadmap: rawData.roadmap?.milestones?.length || 0,
    architecture: (rawData.architecture?.modules?.length || 0) + (rawData.architecture?.apis?.length || 0),
    codebase: (rawData.codebaseMap?.entries?.length || rawData.codebaseMap?.files?.length || 0),
    tasks: (rawData.state?.activeTasks?.length || rawData.state?.activeHorizonTasks?.length || 0),
    canvas: rawData.canvas?.nodes?.length || 0
  }), [rawData]);

  return (
    <div className="h-screen w-screen flex flex-col bg-obsidian-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Header Bar */}
      <Header
        state={rawData.state}
        roadmap={rawData.roadmap}
        architecture={rawData.architecture}
        codebaseMap={rawData.codebaseMap}
        isDemo={isDemo}
        onToggleDemo={handleToggleDemo}
        onAutoLayout={() => applyLayoutAndSet(activeTab, rawData)}
        onRefresh={() => loadState(isDemo)}
        loading={loading}
      />

      {/* 2. Blank Onboarding Banner (if uninitialized) */}
      {!rawData.state?.initialized && (
        <OnboardingBanner
          onSwitchDemo={() => handleToggleDemo(true)}
          isDemo={isDemo}
        />
      )}

      {/* 3. Tab Bar (5 Synchronized Graphs) */}
      <TabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        counts={counts}
        onAddNode={handleAddNewNode}
      />

      {/* 4. Main React Flow Canvas */}
      <div className="flex-1 relative w-full h-full bg-obsidian-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 }
          }}
        >
          <Background color="#163826" gap={24} size={1.5} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'milestoneNode') return '#10b981';
              if (node.type === 'apiNode') return '#3b82f6';
              if (node.type === 'moduleNode') return '#14b8a6';
              if (node.type === 'dataModelNode') return '#06b6d4';
              if (node.type === 'ruleNode') return '#f43f5e';
              if (node.type === 'fileNode') return '#a855f7';
              if (node.type === 'taskNode') return '#10b981';
              return '#f59e0b';
            }}
            maskColor="rgba(7, 13, 10, 0.85)"
            className="!bg-obsidian-900/90 !border !border-white/10 !rounded-xl !overflow-hidden"
          />
        </ReactFlow>

        {/* Empty State Banner within canvas if 0 nodes */}
        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
            <div className="p-6 rounded-2xl bg-obsidian-900/90 border border-white/10 backdrop-blur-md max-w-md text-center pointer-events-auto shadow-card">
              <h4 className="font-bold text-sm text-emerald-100 mb-1">
                No elements in {activeTab.toUpperCase()} graph
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {!rawData.state?.initialized
                  ? 'ProjectFlow is in its clean blank template state. Switch to Demo Preview above to see populated graphs, or copy the Setup Prompt to your IDE agent.'
                  : 'Add a new element using the button below or ask your agent to generate tasks.'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleAddNewNode}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-obsidian-950 font-bold text-xs transition-all shadow-glow-sm"
                >
                  + Add First Element
                </button>
                {!isDemo && (
                  <button
                    onClick={() => handleToggleDemo(true)}
                    className="px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-white/10 text-xs transition-all"
                  >
                    View Demo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Agent Command Bar (Zero External AI API) */}
      <AgentCommandBar
        onBundlePrompt={handleBundlePrompt}
        onSyncRules={handleSyncRules}
        onResetControl={handleResetControl}
        activeTaskId={rawData.state?.activeTasks?.[0]?.id || 'TASK-01'}
        isDemo={isDemo}
      />

      {/* 6. Inspector Drawer (Right-Hand Slide-Over) */}
      <InspectorDrawer
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        selectedEntity={selectedEntity}
        entityType={selectedEntityType}
        activeTab={activeTab}
        onSave={handleSaveEntity}
        onDelete={handleDeleteEntity}
        saving={saving}
      />

      {/* 7. Context Bundle Modal */}
      <PromptModal
        isOpen={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        prompt={promptContent}
        taskId={activeTaskId}
      />
    </div>
  );
}
