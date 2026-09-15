import { useCallback, useMemo, useState } from "react";
import type { EntityType } from "../types";
import {
  DATASET,
  getIncidentEdges,
  getNeighbors,
  NODE_MAP,
  shortestPath,
} from "../mock/graphData";
import { isValidTronAddress } from "../utils/address";

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "edge"; id: string }
  | null;

export function useInvestigation() {
  const [rootId, setRootId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<EntityType>>(new Set());
  const [physics, setPhysics] = useState(true);

  const visibleIds = useMemo(() => {
    if (!rootId) return new Set<string>();
    const visible = new Set<string>([rootId]);
    for (const id of expanded) {
      for (const neighbor of getNeighbors(id)) visible.add(neighbor);
    }
    for (const id of [...visible]) {
      const node = NODE_MAP.get(id);
      if (node && hiddenTypes.has(node.type) && id !== rootId) visible.delete(id);
    }
    return visible;
  }, [rootId, expanded, hiddenTypes]);

  const visibleNodes = useMemo(
    () => DATASET.nodes.filter((node) => visibleIds.has(node.id)),
    [visibleIds],
  );

  const visibleEdges = useMemo(
    () => getIncidentEdges(visibleIds),
    [visibleIds],
  );

  const hiddenNeighborCount = useCallback(
    (id: string) => {
      return getNeighbors(id).filter((neighbor) => !visibleIds.has(neighbor)).length;
    },
    [visibleIds],
  );

  const pathIds = useMemo(() => {
    if (!rootId || selection?.kind !== "node") return new Set<string>();
    const path = shortestPath(rootId, selection.id);
    return new Set(path ?? []);
  }, [rootId, selection]);

  const startFrom = useCallback(async (address: string) => {
    const id = address.trim();
    if (!NODE_MAP.has(id)) return false;
    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 850));
    setRootId(id);
    setExpanded(new Set([id]));
    setSelection({ kind: "node", id });
    setAnalyzing(false);
    return true;
  }, []);

  const expandNode = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const collapseNode = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        if (rootId && id === rootId) next.add(rootId);
        return next;
      });
    },
    [rootId],
  );

  const toggleExpand = useCallback(
    (id: string) => {
      if (expanded.has(id) && hiddenNeighborCount(id) === 0) collapseNode(id);
      else expandNode(id);
    },
    [collapseNode, expandNode, expanded, hiddenNeighborCount],
  );

  const expandAll = useCallback(() => {
    setExpanded(new Set(DATASET.nodes.map((node) => node.id)));
  }, []);

  const collapseToRoot = useCallback(() => {
    if (!rootId) return;
    setExpanded(new Set([rootId]));
  }, [rootId]);

  const toggleType = useCallback((type: EntityType) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const lookupKnown = useCallback((address: string) => {
    const id = address.trim();
    if (!isValidTronAddress(id)) return "invalid" as const;
    if (!NODE_MAP.has(id)) return "unknown" as const;
    return "known" as const;
  }, []);

  return {
    rootId,
    expanded,
    selection,
    setSelection,
    analyzing,
    hiddenTypes,
    physics,
    setPhysics,
    visibleNodes,
    visibleEdges,
    pathIds,
    hiddenNeighborCount,
    startFrom,
    expandNode,
    collapseNode,
    toggleExpand,
    expandAll,
    collapseToRoot,
    toggleType,
    lookupKnown,
  };
}
