import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

// --- Types ---

interface TreeNode {
  id: string;
  text: string;
  children: TreeNode[];
  status: 'unchanged' | 'added' | 'removed';
}

interface ThemeColors {
  bg: string;
  border: string;
  text: string;
}

interface Theme {
  unchanged: ThemeColors;
  added: ThemeColors;
  removed: ThemeColors;
  edge: string;
  background: string;
}

const THEMES: Record<string, Theme> = {
  classic: {
    unchanged: { bg: 'white', border: '#777', text: 'black' },
    added: { bg: '#e6fffa', border: '#38a169', text: 'black' },
    removed: { bg: '#fff5f5', border: '#e53e3e', text: 'black' },
    edge: '#b1b1b7',
    background: '#f8f9fa'
  },
  dark: {
    unchanged: { bg: '#1e293b', border: '#475569', text: '#e2e8f0' },
    added: { bg: '#064e3b', border: '#059669', text: '#ecfdf5' },
    removed: { bg: '#7f1d1d', border: '#dc2626', text: '#fef2f2' },
    edge: '#475569',
    background: '#0f172a'
  },
  vibrant: {
    unchanged: { bg: '#fff', border: '#6366f1', text: '#312e81' },
    added: { bg: '#d1fae5', border: '#10b981', text: '#064e3b' },
    removed: { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
    edge: '#6366f1',
    background: '#eef2ff'
  },
  minimal: {
    unchanged: { bg: '#fff', border: '#000', text: '#000' },
    added: { bg: '#fff', border: '#000', text: '#000' },
    removed: { bg: '#fff', border: '#000', text: '#000' },
    edge: '#000',
    background: '#fff'
  }
};

// Override minimal to have some distinction
THEMES.minimal.added.border = '#666';
THEMES.minimal.removed.border = '#ccc';
THEMES.minimal.removed.text = '#ccc';

// --- Parsers ---

const parseMarkdown = (markdown: string): TreeNode[] => {
  if (!markdown) return [];
  const lines = markdown.split('\n').filter(line => line.trim() !== '');
  const root: TreeNode = { id: 'root', text: 'Root', children: [], status: 'unchanged' };
  const stack: { node: TreeNode; level: number }[] = [{ node: root, level: -1 }];

  lines.forEach((line, index) => {
    const match = line.match(/^(\s*)-\s+(.*)/);
    if (!match) return;

    const indent = match[1].length;
    const text = match[2];
    const level = indent / 2; // Assuming 2 spaces per indent

    const newNode: TreeNode = {
      id: `node-${index}-${text}`, // Simple ID generation
      text,
      children: [],
      status: 'unchanged',
    };

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    parent.children.push(newNode);
    stack.push({ node: newNode, level });
  });

  return root.children; // Return top-level nodes
};

// --- Diff Logic ---

const diffTrees = (nodes1: TreeNode[], nodes2: TreeNode[]): TreeNode[] => {
  const merged: TreeNode[] = [];
  const map1 = new Map(nodes1.map(n => [n.text, n]));
  const map2 = new Map(nodes2.map(n => [n.text, n]));

  const allKeys = new Set([...map1.keys(), ...map2.keys()]);

  allKeys.forEach(key => {
    const node1 = map1.get(key);
    const node2 = map2.get(key);

    if (node1 && node2) {
      // Exists in both
      merged.push({
        ...node2,
        status: 'unchanged',
        children: diffTrees(node1.children, node2.children),
      });
    } else if (node2) {
      // Only in 2 (Added)
      merged.push({
        ...node2,
        status: 'added',
        children: markAll(node2.children, 'added'),
      });
    } else if (node1) {
      // Only in 1 (Removed)
      merged.push({
        ...node1,
        status: 'removed',
        children: markAll(node1.children, 'removed'),
      });
    }
  });

  return merged;
};

const markAll = (nodes: TreeNode[], status: 'added' | 'removed'): TreeNode[] => {
  return nodes.map(node => ({
    ...node,
    status,
    children: markAll(node.children, status),
  }));
};

// --- Layout Logic ---

const calculateLayout = (nodes: TreeNode[], xSpacing: number, ySpacing: number, themeName: string) => {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const theme = THEMES[themeName];
  
  let leafY = 0;
  const processNode = (node: TreeNode, depth: number, parentId: string | null): { y: number; id: string } => {
    const id = node.id || Math.random().toString();
    const x = depth * xSpacing;
    let y = 0;

    if (node.children.length === 0) {
      y = leafY;
      leafY += ySpacing;
    } else {
      const childrenResults = node.children.map(child => processNode(child, depth + 1, id));
      const firstChildY = childrenResults[0].y;
      const lastChildY = childrenResults[childrenResults.length - 1].y;
      y = (firstChildY + lastChildY) / 2;
    }

    // Add Node
    flowNodes.push({
      id,
      data: { label: node.text, status: node.status, themeName },
      position: { x, y },
      type: 'custom', // Use custom node
    });

    // Add Edge
    if (parentId) {
      flowEdges.push({
        id: `${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'default', // Bezier curve
        markerEnd: { type: MarkerType.ArrowClosed, color: theme.edge },
        style: { stroke: theme.edge, strokeWidth: 2 },
      });
    }

    return { y, id };
  };

  nodes.forEach(node => processNode(node, 0, null));

  return { flowNodes, flowEdges };
};


// --- Custom Node Component ---

const CustomNode = ({ data }: { data: { label: string; status: string; themeName: string } }) => {
  const theme = THEMES[data.themeName || 'classic'];
  const status = data.status as 'unchanged' | 'added' | 'removed';
  const colors = theme[status];

  return (
    <div style={{
      padding: '10px 20px',
      borderRadius: '5px',
      border: `2px solid ${colors.border}`,
      backgroundColor: colors.bg,
      color: colors.text,
      minWidth: '100px',
      textAlign: 'center',
      fontSize: '14px',
      position: 'relative',
      transition: 'all 0.3s ease',
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// --- Main Component ---

export interface MindMapProps {
  markdown?: string;
  baseMarkdown?: string;
  newMarkdown?: string;
  theme?: string;
  xSpacing?: number;
  ySpacing?: number;
  isPreview?: boolean;
  className?: string;
}

export const MindMap = ({
  markdown,
  baseMarkdown,
  newMarkdown,
  theme = 'classic',
  xSpacing = 200,
  ySpacing = 50,
  isPreview = false,
  className = '',
}: MindMapProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const handleRender = useCallback(() => {
    const content = markdown !== undefined ? markdown : newMarkdown;
    const base = markdown !== undefined ? markdown : baseMarkdown;

    const tree1 = parseMarkdown(base || '');
    const tree2 = parseMarkdown(content || '');
    const mergedTree = diffTrees(tree1, tree2);
    
    const { flowNodes, flowEdges } = calculateLayout(mergedTree, xSpacing, ySpacing, theme);
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [markdown, baseMarkdown, newMarkdown, xSpacing, ySpacing, theme, setNodes, setEdges]);

  // Initial render and update on props change
  useEffect(() => {
    handleRender();
  }, [handleRender]);

  // Auto fit view when entering preview mode or when content changes
  useEffect(() => {
    if (isPreview && rfInstance) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => rfInstance.fitView(), 50);
    }
  }, [isPreview, rfInstance, nodes, edges]);

  return (
    <div className={`w-full h-full ${className}`} style={{ backgroundColor: THEMES[theme].background }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onInit={setRfInstance}
          nodesDraggable={!isPreview}
          nodesConnectable={!isPreview}
          elementsSelectable={!isPreview}
          zoomOnScroll={!isPreview}
          zoomOnPinch={!isPreview}
          zoomOnDoubleClick={!isPreview}
          panOnScroll={false}
          panOnDrag={true}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          {!isPreview && <Controls />}
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default MindMap;
