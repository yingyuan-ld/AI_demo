import { useMemo, useRef, useState } from "react";
import type { Network } from "vis-network";
import { CaseOverview } from "./components/CaseOverview";
import { DetailPanel } from "./components/DetailPanel";
import { GraphToolbar } from "./components/GraphToolbar";
import { GraphView } from "./components/GraphView";
import { Legend } from "./components/Legend";
import { SearchBar } from "./components/SearchBar";
import { TransferList } from "./components/TransferList";
import { useInvestigation } from "./hooks/useInvestigation";
import { EDGE_MAP, FEATURED_ROOT, NODE_MAP } from "./mock/graphData";

export default function App() {
  const graph = useInvestigation();
  const networkRef = useRef<Network | null>(null);
  const [hint, setHint] = useState("输入地址或选择示例案件，开始资金溯源");

  const selectedNode =
    graph.selection?.kind === "node" ? (NODE_MAP.get(graph.selection.id) ?? null) : null;
  const selectedEdge =
    graph.selection?.kind === "edge" ? (EDGE_MAP.get(graph.selection.id) ?? null) : null;
  const root = graph.rootId ? (NODE_MAP.get(graph.rootId) ?? null) : null;

  const hiddenNeighbors = selectedNode
    ? graph.hiddenNeighborCount(selectedNode.id)
    : 0;

  const status = useMemo(() => {
    if (!graph.rootId) return "等待分析";
    return `根节点 ${root?.name ?? ""} · 已展开 ${graph.expanded.size} 个节点`;
  }, [graph.expanded.size, graph.rootId, root?.name]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⬡</span>
          <div>
            <strong>TRON Trace</strong>
            <em>资金溯源分析平台</em>
          </div>
        </div>
        <SearchBar
          analyzing={graph.analyzing}
          lookupKnown={graph.lookupKnown}
          onSearch={async (address) => {
            const ok = await graph.startFrom(address);
            if (ok) setHint("单击节点或边查看详情 · 双击节点展开 / 折叠 · 滚轮缩放 · 拖拽平移");
            return ok;
          }}
        />
        <div className="case-pill">
          <span>演示案件</span>
          <b>TRN-2026-0911 暗影拆分</b>
        </div>
      </header>

      <div className="workspace">
        <aside className="left-rail">
          <CaseOverview
            root={root}
            visibleNodes={graph.visibleNodes}
            visibleEdges={graph.visibleEdges}
          />
          <Legend hiddenTypes={graph.hiddenTypes} onToggle={graph.toggleType} />
          <TransferList
            edges={graph.visibleEdges}
            selectedId={graph.selection?.kind === "edge" ? graph.selection.id : null}
            onSelect={(id) => graph.setSelection({ kind: "edge", id })}
          />
          <section className="rail-card">
            <header>操作说明</header>
            <ul className="howto">
              <li>单击节点 / 边查看详情</li>
              <li>双击节点展开或折叠下一层</li>
              <li>拖拽节点、平移画布、滚轮缩放</li>
              <li>高风险节点带红色光晕，边上的金额为 TRC-20 转账</li>
            </ul>
          </section>
        </aside>

        <main className="stage">
          <GraphToolbar
            physics={graph.physics}
            canOperate={Boolean(graph.rootId)}
            onFit={() => networkRef.current?.fit({ animation: true })}
            onExpandAll={graph.expandAll}
            onCollapse={graph.collapseToRoot}
            onTogglePhysics={() => graph.setPhysics(!graph.physics)}
          />
          {!graph.rootId && !graph.analyzing && (
            <div className="empty-state">
              <p>TRON 链上资金流向工作台</p>
              <h1>从一笔地址，展开整条资金路径</h1>
              <button
                type="button"
                onClick={() => {
                  void graph.startFrom(FEATURED_ROOT);
                  setHint("单击节点或边查看详情 · 双击节点展开 / 折叠 · 滚轮缩放 · 拖拽平移");
                }}
              >
                载入演示案件根地址
              </button>
            </div>
          )}
          {graph.analyzing && (
            <div className="empty-state analyzing">
              <div className="spinner" />
              <p>正在扫描 TRON 账本并构建资金网图…</p>
            </div>
          )}
          <GraphView
            nodes={graph.visibleNodes}
            edges={graph.visibleEdges}
            rootId={graph.rootId}
            selection={graph.selection}
            pathIds={graph.pathIds}
            hiddenNeighborCount={graph.hiddenNeighborCount}
            physics={graph.physics}
            onReady={(network) => {
              networkRef.current = network;
            }}
            onSelectNode={(id) => graph.setSelection({ kind: "node", id })}
            onSelectEdge={(id) => graph.setSelection({ kind: "edge", id })}
            onClear={() => graph.setSelection(null)}
            onToggleExpand={graph.toggleExpand}
          />
        </main>

        <DetailPanel
          node={selectedEdge ? null : selectedNode}
          edge={selectedEdge}
          isExpanded={Boolean(selectedNode && graph.expanded.has(selectedNode.id))}
          hiddenNeighbors={hiddenNeighbors}
          onClose={() => graph.setSelection(null)}
          onExpand={() => selectedNode && graph.expandNode(selectedNode.id)}
          onCollapse={() => selectedNode && graph.collapseNode(selectedNode.id)}
        />
      </div>

      <footer className="statusbar">
        <span>{status}</span>
        <span>{hint}</span>
        <span>USDT-TRC20 · Mock 数据 · 仅供面试演示</span>
      </footer>
    </div>
  );
}
