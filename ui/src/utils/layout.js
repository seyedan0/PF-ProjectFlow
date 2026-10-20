import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

/**
 * Calculates auto-layout positions for nodes and edges using ELKjs layered algorithm.
 * 
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} options - Layout options (direction: 'RIGHT' | 'DOWN', spacing, etc.)
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
export async function getLayoutedElements(nodes, edges, options = {}) {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: edges || [] };
  }

  const direction = options.direction || 'RIGHT'; // 'RIGHT' (LR) or 'DOWN' (TB)

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
      'elk.spacing.edgeNode': '30',
      'elk.spacing.edgeEdge': '20',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      ...(options.layoutOptions || {})
    },
    children: nodes.map(node => {
      let width = node.measured?.width || node.width || 300;
      let height = node.measured?.height || node.height || 160;

      // Type-specific sizing defaults for cleaner layout
      if (node.type === 'milestoneNode') {
        width = 340;
        height = 200;
      } else if (node.type === 'apiNode') {
        width = 320;
        height = 180;
      } else if (node.type === 'dataModelNode') {
        width = 280;
        height = 200;
      } else if (node.type === 'moduleNode') {
        width = 300;
        height = 170;
      } else if (node.type === 'taskNode') {
        width = 320;
        height = 190;
      } else if (node.type === 'fileNode') {
        width = 280;
        height = 150;
      } else if (node.type === 'stickyNoteNode') {
        width = 240;
        height = 160;
      }

      return {
        id: node.id,
        width,
        height
      };
    }),
    edges: (edges || []).map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }))
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    const layoutedNodes = nodes.map(node => {
      const nodeLayout = layoutedGraph.children.find(n => n.id === node.id);
      if (nodeLayout) {
        return {
          ...node,
          position: {
            x: Math.round(nodeLayout.x),
            y: Math.round(nodeLayout.y)
          }
        };
      }
      return node;
    });

    return { nodes: layoutedNodes, edges };
  } catch (err) {
    console.error('ELK layout error, falling back to grid positions:', err);
    // Simple fallback grid positioning
    const fallbackNodes = nodes.map((node, i) => {
      if (node.position && (node.position.x !== 0 || node.position.y !== 0)) {
        return node;
      }
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        ...node,
        position: { x: col * 340 + 50, y: row * 220 + 50 }
      };
    });
    return { nodes: fallbackNodes, edges };
  }
}
