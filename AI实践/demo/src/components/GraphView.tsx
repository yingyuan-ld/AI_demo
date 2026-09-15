import { useEffect, useRef } from "react";
import { DataSet } from "vis-data";
import { Network, type Options } from "vis-network";
import "vis-network/styles/vis-network.css";
import type { AddressNode, TransferEdge } from "../types";
import { ENTITY_META } from "../types";
import { shortAddress } from "../utils/address";
import { formatAmount } from "../utils/format";

interface GraphViewProps {
  nodes: AddressNode[];
  edges: TransferEdge[];
  rootId: string | null;
  selection: { kind: "node"; id: string } | { kind: "edge"; id: string } | null;
  pathIds: Set<string>;
  hiddenNeighborCount: (id: string) => number;
  physics: boolean;
  onReady: (network: Network | null) => void;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onClear: () => void;
  onToggleExpand: (id: string) => void;
}

interface VisNode {
  id: string;
  label: string;
  shape: string;
  size: number;
  borderWidth: number;
  color: {
    background: string;
    border: string;
    highlight: { background: string; border: string };
  };
  font: { color: string; size: number; face: string; strokeWidth: number };
  shadow: boolean | { enabled: boolean; color: string; size: number };
  title: string;
}

interface VisEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  arrows: string;
  width: number;
  color: { color: string; highlight: string };
  font: { color: string; size: number; strokeWidth: number; align: string };
  smooth: { enabled: boolean; type: string; roundness: number };
}

const options: Options = {
  autoResize: true,
  interaction: {
    hover: true,
    tooltipDelay: 120,
    dragNodes: true,
    dragView: true,
    zoomView: true,
    keyboard: false,
    selectable: true,
  },
  layout: { improvedLayout: true },
  physics: {
    enabled: true,
    barnesHut: {
      gravitationalConstant: -22000,
      centralGravity: 0.18,
      springLength: 168,
      springConstant: 0.035,
      damping: 0.42,
      avoidOverlap: 0.35,
    },
    stabilization: { iterations: 90, fit: true },
  },
  nodes: {
    chosen: true,
  },
  edges: {
    chosen: true,
    selectionWidth: 2,
  },
};

function toVisNode(
  node: AddressNode,
  ctx: {
    rootId: string | null;
    selectionId: string | null;
    pathIds: Set<string>;
    hiddenCount: number;
  },
): VisNode {
  const meta = ENTITY_META[node.type];
  const isRoot = node.id === ctx.rootId;
  const isSelected = node.id === ctx.selectionId;
  const onPath = ctx.pathIds.has(node.id);
  const riskBorder =
    node.riskScore >= 85 ? "#F43F5E" : node.riskScore >= 60 ? "#F5A623" : meta.color;
  const badge = ctx.hiddenCount > 0 ? `\n+${ctx.hiddenCount}` : "";
  return {
    id: node.id,
    label: `${isRoot ? "★ " : ""}${node.name}\n${shortAddress(node.address)}${badge}`,
    shape: meta.shape,
    size: isRoot ? 34 : 16 + Math.min(12, node.riskScore / 9),
    borderWidth: isSelected ? 4 : isRoot ? 4 : onPath ? 3 : 2,
    color: {
      background: meta.color,
      border: isSelected ? "#F8FAFC" : onPath ? "#7DD3FC" : riskBorder,
      highlight: { background: meta.color, border: "#FFFFFF" },
    },
    font: {
      color: "#E8EEF7",
      size: 12,
      face: "IBM Plex Sans",
      strokeWidth: 0,
    },
    shadow: node.riskScore >= 85
      ? { enabled: true, color: "rgba(244,63,94,0.45)", size: 18 }
      : false,
    title: `${node.name}\n${node.address}\n风险 ${node.riskScore} · ${meta.label}`,
  };
}

function toVisEdge(
  edge: TransferEdge,
  ctx: { selectedEdge: string | null; pathIds: Set<string> },
): VisEdge {
  const risky = edge.riskFlags.length > 0;
  const onPath = ctx.pathIds.has(edge.from) && ctx.pathIds.has(edge.to);
  const selected = ctx.selectedEdge === edge.id;
  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    label: formatAmount(edge.amount, edge.token),
    arrows: "to",
    width: selected || onPath ? 3 : edge.amount >= 500_000 ? 2.6 : edge.amount >= 80_000 ? 1.8 : 1.2,
    color: {
      color: selected ? "#7DD3FC" : onPath ? "#38BDF8" : risky ? "#FB7185" : "#4B5C78",
      highlight: "#E2E8F0",
    },
    font: {
      color: "#93A4BB",
      size: 10,
      strokeWidth: 0,
      align: "middle",
    },
    smooth: { enabled: true, type: "cubicBezier", roundness: 0.22 },
  };
}

export function GraphView({
  nodes,
  edges,
  rootId,
  selection,
  pathIds,
  hiddenNeighborCount,
  physics,
  onReady,
  onSelectNode,
  onSelectEdge,
  onClear,
  onToggleExpand,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodeDs = useRef(new DataSet<VisNode, "id">([]));
  const edgeDs = useRef(new DataSet<VisEdge, "id">([]));
  const callbacksRef = useRef({ onSelectNode, onSelectEdge, onClear, onToggleExpand, onReady });
  callbacksRef.current = { onSelectNode, onSelectEdge, onClear, onToggleExpand, onReady };

  useEffect(() => {
    if (!containerRef.current) return;
    const network = new Network(
      containerRef.current,
      { nodes: nodeDs.current as never, edges: edgeDs.current as never },
      options,
    );
    networkRef.current = network;
    callbacksRef.current.onReady(network);

    network.on("click", (params) => {
      if (params.nodes.length) {
        callbacksRef.current.onSelectNode(String(params.nodes[0]));
        return;
      }
      if (params.edges.length) {
        callbacksRef.current.onSelectEdge(String(params.edges[0]));
        return;
      }
      callbacksRef.current.onClear();
    });

    network.on("doubleClick", (params) => {
      if (params.nodes.length) {
        callbacksRef.current.onToggleExpand(String(params.nodes[0]));
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
      callbacksRef.current.onReady(null);
    };
  }, []);

  useEffect(() => {
    networkRef.current?.setOptions({ physics: { enabled: physics } });
  }, [physics]);

  useEffect(() => {
    const selectedNodeId = selection?.kind === "node" ? selection.id : null;
    const selectedEdgeId = selection?.kind === "edge" ? selection.id : null;
    const nextNodes = nodes.map((node) =>
      toVisNode(node, {
        rootId,
        selectionId: selectedNodeId,
        pathIds,
        hiddenCount: hiddenNeighborCount(node.id),
      }),
    );
    const nextEdges = edges.map((edge) =>
      toVisEdge(edge, { selectedEdge: selectedEdgeId, pathIds }),
    );

    const nextNodeIds = new Set(nextNodes.map((item) => item.id));
    const nextEdgeIds = new Set(nextEdges.map((item) => item.id));
    const removeNodes: string[] = [];
    const removeEdges: string[] = [];
    nodeDs.current.forEach((item) => {
      if (!nextNodeIds.has(item.id)) removeNodes.push(item.id);
    });
    edgeDs.current.forEach((item) => {
      if (!nextEdgeIds.has(item.id)) removeEdges.push(item.id);
    });
    if (removeEdges.length) edgeDs.current.remove(removeEdges);
    if (removeNodes.length) nodeDs.current.remove(removeNodes);
    nodeDs.current.update(nextNodes);
    edgeDs.current.update(nextEdges);
  }, [nodes, edges, rootId, selection, pathIds, hiddenNeighborCount]);

  return <div ref={containerRef} className="graph-canvas" />;
}
