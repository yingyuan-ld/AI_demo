/** 链上地址的实体类型，决定节点颜色、形状和图例分类 */
export type EntityType =
  | "wallet" // 普通钱包
  | "exchange" // 交易所官方热钱包
  | "mixer" // 混币器
  | "sanctioned" // 受制裁地址
  | "contract" // 智能合约
  | "exchange_user"; // 交易所用户充值/提现地址

/** 地址归属的实体分类，用于详情面板中的「地址标签」 */
export type EntityCategory =
  | "exchange_official" // 交易所官方
  | "exchange_user" // 交易所用户
  | "unknown" // 未知实体
  | "illicit" // 非法 / 高危实体
  | "contract" // 智能合约
  | "mixer"; // 混币服务

/** 转账代币符号 */
export type TokenSymbol = "USDT" | "TRX";

/** 图谱中的地址节点 */
export interface AddressNode {
  /** 节点唯一标识，与 address 相同 */
  id: string;
  /** TRON 地址哈希（T 开头，34 位 Base58） */
  address: string;
  /** 节点展示名称，如 ShadowVault-01、Binance Hot Wallet */
  name: string;
  /** 实体类型，控制节点视觉编码 */
  type: EntityType;
  /** 地址标签分类：交易所官方、交易所用户等 */
  entityCategory: EntityCategory;
  /** 关联的已知实体名称，如 Binance、OFAC SDN 关联集群 */
  entityName: string;
  /** 风险评分，取值 0–100 */
  riskScore: number;
  /** 风险标记列表，如「直接接触混币器」 */
  riskFlags: string[];
  /** 业务标签，如「热钱包」「剥链」「出金」 */
  tags: string[];
  /** TRX 余额 */
  balanceTrx: number;
  /** USDT（TRC-20）余额 */
  balanceUsdt: number;
  /** 转入交易笔数 */
  txIn: number;
  /** 转出交易笔数 */
  txOut: number;
  /** 链上首次出现时间（ISO 8601） */
  firstSeen: string;
  /** 调查备注 / 研判说明 */
  note: string;
}

/** 图谱中的转账边（TRC-20 资金关系） */
export interface TransferEdge {
  /** 边唯一标识 */
  id: string;
  /** 发送方节点 id */
  from: string;
  /** 接收方节点 id */
  to: string;
  /** 交易哈希 TxID */
  txid: string;
  /** 转账金额 */
  amount: number;
  /** 代币类型 */
  token: TokenSymbol;
  /** 转账时间戳（ISO 8601） */
  timestamp: string;
  /** 该笔交易的风险标记，如「与混币器直接交互」 */
  riskFlags: string[];
}

/** 完整 mock 图谱：节点集合 + 边集合 */
export interface GraphDataset {
  /** 地址节点列表 */
  nodes: AddressNode[];
  /** 转账关系列表 */
  edges: TransferEdge[];
}

/** 各实体类型的图例元数据：中文名、颜色、节点形状 */
export const ENTITY_META: Record<
  EntityType,
  { label: string; color: string; shape: string }
> = {
  wallet: { label: "普通钱包", color: "#5B8FF9", shape: "dot" },
  exchange: { label: "交易所", color: "#22C55E", shape: "diamond" },
  mixer: { label: "混币器", color: "#F5A623", shape: "triangle" },
  sanctioned: { label: "受制裁地址", color: "#F43F5E", shape: "star" },
  contract: { label: "合约地址", color: "#A78BFA", shape: "square" },
  exchange_user: { label: "交易所用户", color: "#38BDF8", shape: "hexagon" },
};
