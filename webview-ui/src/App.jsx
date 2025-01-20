import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Panel,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import SearchBox from "./components/SearchBox";
import FilterMenu from "./components/FilterMenu";

const data = window.initialData;
const initialNodes = getIntialNodes();
const initialEdges = getIntialEdges();

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagreGraph.graph().align = "UL";

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};
const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges
);

function getIntialNodes() {
  const files = data;
  const nodes = [];
  for (const [key, value] of Object.entries(files)) {
    if (key) {
      nodes.push({
        id: key,
        data: { label: key },
        position: { x: 0, y: 0 },
      });
      if (value) {
        Object.entries(value).forEach((e) => {
          if (e[1]) {
            if (!nodes.includes(value)) {
              nodes.push({
                id: e[1],
                position: { x: 0, y: 0 },
                data: { label: e[1] },
              });
            }
          }
        });
      }
    }
  }
  return nodes;
}
function getIntialEdges() {
  const files = data;
  const edges = [];
  for (const [key, value] of Object.entries(files)) {
    if (key) {
      Object.entries(value).forEach((e) => {
        edges.push({
          id: `${key}-${e[1]}`,
          source: key,
          target: e[1],
          type: ConnectionLineType.SmoothStep,
        });
      });
    }
  }
  return edges;
}

function searchNodes(query, filters) {
  return initialNodes.filter((node) => {
    const matchesSearch = node.id.includes(query);
    const matchesFilters = applyFilters(node, filters);
    return matchesSearch && matchesFilters;
  });
}

function applyFilters(node, filters) {
  return filters.every((filter) => {
    if (filter.type === "file") {
      return node.id.endsWith(filter.value);
    }
    if (filter.type === "import") {
      return node.data.importType === filter.value;
    }
    return true;
  });
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState([]);
  const [highlightedNodes, setHighlightedNodes] = useState([]);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          { ...params, type: ConnectionLineType.SmoothStep, animated: true },
          eds
        )
      ),
    []
  );

  const onLayout = useCallback(
    (direction) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges]
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    const matchingNodes = searchNodes(searchQuery, filters);
    setHighlightedNodes(matchingNodes.map((node) => node.id));
  }, [searchQuery, filters]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      // Implement navigation logic
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }} onKeyDown={handleKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        colorMode="dark"
        fitView
      >
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button onClick={() => onLayout("TB")}>vertical layout</button>
          <button onClick={() => onLayout("LR")}>horizontal layout</button>
          <SearchBox
            placeholder="Search nodes..."
            onSearch={handleSearch}
          />
          <FilterMenu
            filters={[
              { label: 'JS Files', type: 'file', value: 'js' },
              { label: 'Internal Imports', type: 'import', value: 'internal' }
            ]}
            onFilterChange={handleFilterChange}
          />
        </Panel>
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
