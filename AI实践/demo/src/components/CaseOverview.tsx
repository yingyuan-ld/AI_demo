import { CASE_META, DATASET } from "../mock/graphData";
import type { AddressNode, TransferEdge } from "../types";
import { formatAmount } from "../utils/format";

interface CaseOverviewProps {
  root: AddressNode | null;
  visibleNodes: AddressNode[];
  visibleEdges: TransferEdge[];
}

export function CaseOverview({ root, visibleNodes, visibleEdges }: CaseOverviewProps) {
  const highRisk = visibleNodes.filter((node) => node.riskScore >= 80).length;
  const volume = visibleEdges.reduce((sum, edge) => {
    return edge.token === "USDT" ? sum + edge.amount : sum;
  }, 0);

  return (
    <section className="rail-card case-card">
      <p className="kicker">{CASE_META.id}</p>
      <h2>{CASE_META.title}</h2>
      <p className="summary">{CASE_META.summary}</p>
      <dl className="stat-grid">
        <div>
          <dt>链 / 资产</dt>
          <dd>
            {CASE_META.chain} · {CASE_META.asset}
          </dd>
        </div>
        <div>
          <dt>时间窗</dt>
          <dd>{CASE_META.window}</dd>
        </div>
        <div>
          <dt>可见节点</dt>
          <dd>
            {visibleNodes.length} / {DATASET.nodes.length}
          </dd>
        </div>
        <div>
          <dt>可见边</dt>
          <dd>
            {visibleEdges.length} / {DATASET.edges.length}
          </dd>
        </div>
        <div>
          <dt>高风险节点</dt>
          <dd>{highRisk}</dd>
        </div>
        <div>
          <dt>可见 USDT 流量</dt>
          <dd>{formatAmount(volume, "USDT")}</dd>
        </div>
      </dl>
      {root && (
        <p className="root-line">
          当前根节点 <strong>{root.name}</strong>
        </p>
      )}
    </section>
  );
}
