import { NODE_MAP } from "../mock/graphData";
import type { TransferEdge } from "../types";
import { shortAddress } from "../utils/address";
import { formatAmount } from "../utils/format";

interface TransferListProps {
  edges: TransferEdge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TransferList({ edges, selectedId, onSelect }: TransferListProps) {
  const top = [...edges]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return (
    <section className="rail-card">
      <header>可见转账</header>
      {top.length === 0 ? (
        <p className="hint">分析开始后，这里会列出当前画布上的大额转账。</p>
      ) : (
        <ul className="tx-list">
          {top.map((edge) => {
            const from = NODE_MAP.get(edge.from);
            const to = NODE_MAP.get(edge.to);
            return (
              <li key={edge.id}>
                <button
                  type="button"
                  className={`tx-item ${selectedId === edge.id ? "is-active" : ""}`}
                  onClick={() => onSelect(edge.id)}
                >
                  <b>{formatAmount(edge.amount, edge.token)}</b>
                  <span>
                    {from?.name ?? shortAddress(edge.from)} → {to?.name ?? shortAddress(edge.to)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
