import { useState, type ReactNode } from "react";
import type { AddressNode, TransferEdge } from "../types";
import { ENTITY_META } from "../types";
import { NODE_MAP } from "../mock/graphData";
import {
  formatFullAmount,
  formatTime,
  riskLabel,
  riskTone,
} from "../utils/format";

interface DetailPanelProps {
  node: AddressNode | null;
  edge: TransferEdge | null;
  isExpanded: boolean;
  hiddenNeighbors: number;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}

const CATEGORY_LABEL: Record<AddressNode["entityCategory"], string> = {
  exchange_official: "交易所官方",
  exchange_user: "交易所用户",
  unknown: "未知实体",
  illicit: "非法 / 高危实体",
  contract: "智能合约",
  mixer: "混币服务",
};

export function DetailPanel({
  node,
  edge,
  isExpanded,
  hiddenNeighbors,
  onClose,
  onExpand,
  onCollapse,
}: DetailPanelProps) {
  if (!node && !edge) {
    return (
      <aside className="detail-panel is-empty">
        <h2>详情</h2>
        <p>点击节点查看地址档案，点击连边查看转账关系。</p>
        <p className="hint">双击节点可展开或折叠下一层交易对手。</p>
      </aside>
    );
  }

  if (edge) {
    const from = NODE_MAP.get(edge.from);
    const to = NODE_MAP.get(edge.to);
    return (
      <aside className="detail-panel">
        <header className="detail-head">
          <div>
            <p className="kicker">转账关系</p>
            <h2>
              {from?.name ?? "发送方"} → {to?.name ?? "接收方"}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="amount-hero">
          {formatFullAmount(edge.amount, edge.token)}
        </div>
        <Field label="交易哈希 TxID">
          <code>{edge.txid}</code>
          <CopyButton text={edge.txid} />
        </Field>
        <Field label="时间戳">{formatTime(edge.timestamp)}</Field>
        <Field label="发送方">
          <code>{from?.address}</code>
          <CopyButton text={from?.address ?? ""} />
        </Field>
        <Field label="接收方">
          <code>{to?.address}</code>
          <CopyButton text={to?.address ?? ""} />
        </Field>
        <Field label="代币类型">{edge.token} · TRC-20</Field>
        <Field label="风险标记">
          {edge.riskFlags.length ? (
            <ul className="flag-list">
              {edge.riskFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : (
            <span className="muted">无明显风险标记</span>
          )}
        </Field>
      </aside>
    );
  }

  if (!node) return null;
  const tone = riskTone(node.riskScore);
  const typeMeta = ENTITY_META[node.type];

  return (
    <aside className="detail-panel">
      <header className="detail-head">
        <div>
          <p className="kicker">{typeMeta.label}</p>
          <h2>{node.name}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose}>
          ×
        </button>
      </header>

      <div className={`risk-meter is-${tone}`}>
        <div className="risk-score">{node.riskScore}</div>
        <div>
          <strong>{riskLabel(node.riskScore)}</strong>
          <p>风险评分 0–100</p>
        </div>
        <div className="risk-bar">
          <i style={{ width: `${node.riskScore}%` }} />
        </div>
      </div>

      <Field label="地址哈希">
        <code>{node.address}</code>
        <CopyButton text={node.address} />
      </Field>
      <Field label="地址标签">
        {CATEGORY_LABEL[node.entityCategory]}
        {node.tags.length > 0 && (
          <div className="tag-row">
            {node.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </Field>
      <Field label="关联实体">{node.entityName}</Field>
      <Field label="余额">
        <div className="balance-grid">
          <div>
            <em>TRX</em>
            <b>{node.balanceTrx.toLocaleString()}</b>
          </div>
          <div>
            <em>USDT</em>
            <b>{node.balanceUsdt.toLocaleString()}</b>
          </div>
        </div>
      </Field>
      <Field label="交易计数">
        转入 {node.txIn.toLocaleString()} 笔 · 转出 {node.txOut.toLocaleString()} 笔
      </Field>
      <Field label="首次出现时间">{formatTime(node.firstSeen)}</Field>
      <Field label="风险标记">
        {node.riskFlags.length ? (
          <ul className="flag-list">
            {node.riskFlags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        ) : (
          <span className="muted">暂无额外风险标记</span>
        )}
      </Field>
      <p className="note">{node.note}</p>
      <div className="detail-actions">
        <button type="button" onClick={onExpand} disabled={hiddenNeighbors === 0 && isExpanded}>
          展开下一层{hiddenNeighbors > 0 ? `（${hiddenNeighbors}）` : ""}
        </button>
        <button type="button" className="ghost" onClick={onCollapse} disabled={!isExpanded}>
          折叠该节点
        </button>
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}
