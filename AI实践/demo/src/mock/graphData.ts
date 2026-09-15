import type { AddressNode, GraphDataset, TransferEdge } from "../types";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function tronAddress(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let address = "T";
  for (let i = 0; i < 33; i += 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    address += B58[(hash >>> 0) % B58.length];
  }
  return address;
}

function txid(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  let hex = "";
  for (let i = 0; i < 32; i += 1) {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
    hex += ((hash >>> 0) % 16).toString(16);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489917);
    hex += ((hash >>> 0) % 16).toString(16);
  }
  return hex.slice(0, 64);
}

const ids = {
  shadow: tronAddress("shadowvault-01"),
  binance: tronAddress("binance-hot-usdt"),
  okx: tronAddress("okx-hot-usdt"),
  mixer: tronAddress("tronmixer-01"),
  ofac: tronAddress("ofac-cluster-7"),
  hopA: tronAddress("transit-alpha"),
  hopB: tronAddress("transit-bravo"),
  usdt: tronAddress("usdt-trc20-contract"),
  bnUser1: tronAddress("binance-user-4412"),
  bnUser2: tronAddress("binance-user-7781"),
  mixHop1: tronAddress("peel-chain-01"),
  mixHop2: tronAddress("peel-chain-02"),
  mixHop3: tronAddress("peel-chain-03"),
  hopA1: tronAddress("otc-desk-alpha"),
  hopA2: tronAddress("transit-alpha-2"),
  hopB1: tronAddress("nested-mixer-x"),
  htx: tronAddress("htx-hot-usdt"),
  sunswap: tronAddress("sunswap-v3-router"),
  cashout: tronAddress("cashout-wallet-19"),
  bybit: tronAddress("bybit-hot-usdt"),
  mixHop1a: tronAddress("peel-chain-01b"),
  mixHop2a: tronAddress("darkmarket-escrow"),
  hopA2a: tronAddress("fresh-wallet-09"),
  hopB1a: tronAddress("nested-mixer-x2"),
  victim1: tronAddress("victim-cluster-01"),
  victim2: tronAddress("victim-cluster-02"),
  otcIn: tronAddress("otc-inbound-desk"),
  gate: tronAddress("gate-hot-usdt"),
};

function node(
  id: string,
  rest: Omit<AddressNode, "id" | "address">,
): AddressNode {
  return { id, address: id, ...rest };
}

function edge(
  key: string,
  from: string,
  to: string,
  amount: number,
  token: "USDT" | "TRX",
  timestamp: string,
  riskFlags: string[] = [],
): TransferEdge {
  return {
    id: `e-${key}`,
    from,
    to,
    txid: txid(key),
    amount,
    token,
    timestamp,
    riskFlags,
  };
}

const nodes: AddressNode[] = [
  node(ids.shadow, {
    name: "ShadowVault-01",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "未知集群 / 高风险归集钱包",
    riskScore: 92,
    riskFlags: ["短时大额拆分", "直接接触混币器", "对手方含制裁地址"],
    tags: ["资金归集", "拆分出金"],
    balanceTrx: 18420.55,
    balanceUsdt: 126880.12,
    txIn: 38,
    txOut: 64,
    firstSeen: "2026-08-14T09:12:00+08:00",
    note: "近 30 天将约 400 万 USDT 拆分至交易所、混币器与制裁地址，疑似赃款清洗入口。",
  }),
  node(ids.binance, {
    name: "Binance Hot Wallet",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "Binance",
    riskScore: 12,
    riskFlags: [],
    tags: ["中心化交易所", "热钱包"],
    balanceTrx: 8902210.4,
    balanceUsdt: 184220000,
    txIn: 188420,
    txOut: 176331,
    firstSeen: "2019-04-11T00:00:00+08:00",
    note: "币安 USDT-TRC20 热钱包。根地址曾向该地址充值，疑似尝试法币出金。",
  }),
  node(ids.okx, {
    name: "OKX Hot Wallet",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "OKX",
    riskScore: 14,
    riskFlags: [],
    tags: ["中心化交易所", "热钱包"],
    balanceTrx: 4412900,
    balanceUsdt: 66210000,
    txIn: 99210,
    txOut: 97402,
    firstSeen: "2020-02-18T00:00:00+08:00",
    note: "OKX 官方热钱包，承接 ShadowVault 一笔中等规模充值。",
  }),
  node(ids.mixer, {
    name: "TronMixer-01",
    type: "mixer",
    entityCategory: "mixer",
    entityName: "TronMixer",
    riskScore: 96,
    riskFlags: ["混币服务", "剥链拆分"],
    tags: ["混币器", "高混淆"],
    balanceTrx: 220.8,
    balanceUsdt: 44890.3,
    txIn: 4210,
    txOut: 4688,
    firstSeen: "2024-11-02T16:40:00+08:00",
    note: "已知 TRON 混币入口，将入金拆成多条剥链（peel chain）后分散至交易所与暗网托管。",
  }),
  node(ids.ofac, {
    name: "OFAC Cluster-7",
    type: "sanctioned",
    entityCategory: "illicit",
    entityName: "OFAC SDN 关联集群",
    riskScore: 100,
    riskFlags: ["制裁名单", "禁止交互"],
    tags: ["OFAC", "制裁"],
    balanceTrx: 12.04,
    balanceUsdt: 880410.55,
    txIn: 612,
    txOut: 344,
    firstSeen: "2023-07-09T08:00:00+08:00",
    note: "与 OFAC SDN 名单实体聚类关联，任何直接转账均应标记为严重合规风险。",
  }),
  node(ids.hopA, {
    name: "Transit-A",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "中转钱包 A",
    riskScore: 58,
    riskFlags: ["高频中转"],
    tags: ["中转", "剥壳"],
    balanceTrx: 320.1,
    balanceUsdt: 18440.2,
    txIn: 44,
    txOut: 51,
    firstSeen: "2026-08-16T11:08:00+08:00",
    note: "根地址下游一层中转，资金继续流向场外柜台与 DEX 路由合约。",
  }),
  node(ids.hopB, {
    name: "Transit-B",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "中转钱包 B",
    riskScore: 67,
    riskFlags: ["二次混币前置"],
    tags: ["中转"],
    balanceTrx: 88.6,
    balanceUsdt: 9200.4,
    txIn: 29,
    txOut: 31,
    firstSeen: "2026-08-17T19:22:00+08:00",
    note: "将资金导入 NestedMixer，形成二次混淆路径。",
  }),
  node(ids.usdt, {
    name: "USDT TRC-20",
    type: "contract",
    entityCategory: "contract",
    entityName: "Tether USD (TRC-20)",
    riskScore: 5,
    riskFlags: [],
    tags: ["TRC-20", "稳定币合约"],
    balanceTrx: 0,
    balanceUsdt: 0,
    txIn: 0,
    txOut: 0,
    firstSeen: "2019-04-16T00:00:00+08:00",
    note: "USDT TRC-20 合约。图谱中的金额均以该代币为主，合约节点用于标识资产类型。",
  }),
  node(ids.bnUser1, {
    name: "Binance User #4412",
    type: "exchange_user",
    entityCategory: "exchange_user",
    entityName: "Binance 用户充值地址",
    riskScore: 41,
    riskFlags: ["交易所提现后再分散"],
    tags: ["KYC 未知", "提现地址"],
    balanceTrx: 1540.2,
    balanceUsdt: 62400,
    txIn: 18,
    txOut: 22,
    firstSeen: "2026-08-20T08:11:00+08:00",
    note: "归因到币安用户充值/提现子地址，资金离开平台后继续拆分至出金钱包与 Bybit。",
  }),
  node(ids.bnUser2, {
    name: "Binance User #7781",
    type: "exchange_user",
    entityCategory: "exchange_user",
    entityName: "Binance 用户充值地址",
    riskScore: 36,
    riskFlags: [],
    tags: ["KYC 未知"],
    balanceTrx: 220.4,
    balanceUsdt: 11880,
    txIn: 9,
    txOut: 7,
    firstSeen: "2026-08-22T14:03:00+08:00",
    note: "较小额提现地址，与 OKX 出金路径存在交叉。",
  }),
  node(ids.mixHop1, {
    name: "Peel-Chain-01",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "混币剥链钱包",
    riskScore: 88,
    riskFlags: ["混币器直接输出"],
    tags: ["剥链"],
    balanceTrx: 44.2,
    balanceUsdt: 2100,
    txIn: 16,
    txOut: 19,
    firstSeen: "2026-08-18T02:40:00+08:00",
    note: "混币器输出 hop，继续拆向 HTX 与更深层剥链。",
  }),
  node(ids.mixHop2, {
    name: "Peel-Chain-02",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "混币剥链钱包",
    riskScore: 90,
    riskFlags: ["混币器直接输出", "暗网相关"],
    tags: ["剥链"],
    balanceTrx: 12.8,
    balanceUsdt: 640,
    txIn: 21,
    txOut: 24,
    firstSeen: "2026-08-18T03:05:00+08:00",
    note: "该 hop 将资金导入暗网托管地址，并有一部分流入 Gate.io。",
  }),
  node(ids.mixHop3, {
    name: "Peel-Chain-03",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "混币剥链钱包",
    riskScore: 84,
    riskFlags: ["混币器直接输出"],
    tags: ["剥链"],
    balanceTrx: 9.1,
    balanceUsdt: 880,
    txIn: 11,
    txOut: 14,
    firstSeen: "2026-08-18T04:18:00+08:00",
    note: "剥链第三跳，接入 NestedMixer 形成交叉混淆。",
  }),
  node(ids.hopA1, {
    name: "OTC Desk Alpha",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "场外兑换柜台 Alpha",
    riskScore: 48,
    riskFlags: ["场外出金"],
    tags: ["OTC"],
    balanceTrx: 5600,
    balanceUsdt: 2400000,
    txIn: 3201,
    txOut: 3018,
    firstSeen: "2022-05-01T00:00:00+08:00",
    note: "亚洲场外柜台热钱包，常被用于绕过 KYC 的现金兑换。",
  }),
  node(ids.hopA2, {
    name: "Transit-A2",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "二层中转",
    riskScore: 52,
    riskFlags: [],
    tags: ["中转"],
    balanceTrx: 76.3,
    balanceUsdt: 4310,
    txIn: 15,
    txOut: 16,
    firstSeen: "2026-08-19T10:44:00+08:00",
    note: "Transit-A 的下游新鲜地址，最终流向 Gate.io。",
  }),
  node(ids.hopB1, {
    name: "NestedMixer-X",
    type: "mixer",
    entityCategory: "mixer",
    entityName: "NestedMixer",
    riskScore: 94,
    riskFlags: ["二次混币"],
    tags: ["混币器"],
    balanceTrx: 40.2,
    balanceUsdt: 12200,
    txIn: 880,
    txOut: 910,
    firstSeen: "2025-01-20T12:00:00+08:00",
    note: "二层混币服务，承接 Transit-B 与 Peel-Chain-03 的合流。",
  }),
  node(ids.htx, {
    name: "HTX Hot Wallet",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "HTX",
    riskScore: 16,
    riskFlags: [],
    tags: ["中心化交易所"],
    balanceTrx: 2200100,
    balanceUsdt: 44120000,
    txIn: 55420,
    txOut: 54880,
    firstSeen: "2018-09-01T00:00:00+08:00",
    note: "混币剥链的主要出金所之一。",
  }),
  node(ids.sunswap, {
    name: "SunSwap Router",
    type: "contract",
    entityCategory: "contract",
    entityName: "SunSwap V3",
    riskScore: 22,
    riskFlags: ["DEX 兑换"],
    tags: ["DEX", "路由合约"],
    balanceTrx: 0,
    balanceUsdt: 0,
    txIn: 0,
    txOut: 0,
    firstSeen: "2021-08-08T00:00:00+08:00",
    note: "去中心化交易路由。Transit-A 曾通过该合约兑换小额 USDT。",
  }),
  node(ids.cashout, {
    name: "Cashout-Wallet",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "出金聚合钱包",
    riskScore: 63,
    riskFlags: ["多源汇入"],
    tags: ["出金"],
    balanceTrx: 210.5,
    balanceUsdt: 33400,
    txIn: 27,
    txOut: 8,
    firstSeen: "2026-08-21T07:30:00+08:00",
    note: "同时接收交易所用户与 OTC 柜台资金，疑似最终现金兑换前的聚合点。",
  }),
  node(ids.bybit, {
    name: "Bybit Hot Wallet",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "Bybit",
    riskScore: 15,
    riskFlags: [],
    tags: ["中心化交易所"],
    balanceTrx: 1800400,
    balanceUsdt: 31880000,
    txIn: 44120,
    txOut: 43990,
    firstSeen: "2021-03-15T00:00:00+08:00",
    note: "剥链与币安用户提现的交叉出金点。",
  }),
  node(ids.mixHop1a, {
    name: "Peel-Chain-01b",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "三层剥链",
    riskScore: 79,
    riskFlags: ["混币下游"],
    tags: ["剥链"],
    balanceTrx: 6.2,
    balanceUsdt: 1540,
    txIn: 8,
    txOut: 9,
    firstSeen: "2026-08-23T21:16:00+08:00",
    note: "第三层剥链，最终将资金送入 Bybit。",
  }),
  node(ids.mixHop2a, {
    name: "DarkMarket Escrow",
    type: "sanctioned",
    entityCategory: "illicit",
    entityName: "暗网市场托管",
    riskScore: 98,
    riskFlags: ["暗网", "高危实体"],
    tags: ["暗网", "托管"],
    balanceTrx: 3.3,
    balanceUsdt: 229400,
    txIn: 540,
    txOut: 488,
    firstSeen: "2024-06-12T00:00:00+08:00",
    note: "被标记为暗网托管地址，与 OFAC 集群存在双向小额交互。",
  }),
  node(ids.hopA2a, {
    name: "Fresh Wallet 09",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "新创建钱包",
    riskScore: 44,
    riskFlags: ["地址新鲜"],
    tags: ["新地址"],
    balanceTrx: 18.9,
    balanceUsdt: 2200,
    txIn: 4,
    txOut: 3,
    firstSeen: "2026-08-28T09:00:00+08:00",
    note: "首次出现距今不足两周，资金快速转出至 Gate.io。",
  }),
  node(ids.hopB1a, {
    name: "NestedMixer-X2",
    type: "mixer",
    entityCategory: "mixer",
    entityName: "NestedMixer 子池",
    riskScore: 93,
    riskFlags: ["二次混币", "回流主混币器"],
    tags: ["混币器"],
    balanceTrx: 11.4,
    balanceUsdt: 7600,
    txIn: 210,
    txOut: 198,
    firstSeen: "2025-04-02T00:00:00+08:00",
    note: "NestedMixer 子池，部分资金回流 TronMixer-01，拉长追踪路径。",
  }),
  node(ids.victim1, {
    name: "Victim Cluster-01",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "疑似被盗资金来源",
    riskScore: 28,
    riskFlags: ["疑似受害者"],
    tags: ["入金来源"],
    balanceTrx: 440.2,
    balanceUsdt: 12800,
    txIn: 62,
    txOut: 8,
    firstSeen: "2025-12-03T00:00:00+08:00",
    note: "历史行为正常的长期钱包，在 8 月中旬向 ShadowVault 大额转出，疑似钓鱼或私钥泄露。",
  }),
  node(ids.victim2, {
    name: "Victim Cluster-02",
    type: "wallet",
    entityCategory: "unknown",
    entityName: "疑似被盗资金来源",
    riskScore: 31,
    riskFlags: ["疑似受害者"],
    tags: ["入金来源"],
    balanceTrx: 88.0,
    balanceUsdt: 5400,
    txIn: 21,
    txOut: 6,
    firstSeen: "2026-01-19T00:00:00+08:00",
    note: "第二笔被盗入金来源，与 Cluster-01 无直接链上往来。",
  }),
  node(ids.otcIn, {
    name: "OTC Inbound Desk",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "场外入金柜台",
    riskScore: 39,
    riskFlags: [],
    tags: ["OTC"],
    balanceTrx: 12040,
    balanceUsdt: 8800000,
    txIn: 2104,
    txOut: 1990,
    firstSeen: "2021-11-11T00:00:00+08:00",
    note: "向根地址注入一笔场外资金，可能用于配资或洗钱铺垫。",
  }),
  node(ids.gate, {
    name: "Gate.io Hot Wallet",
    type: "exchange",
    entityCategory: "exchange_official",
    entityName: "Gate.io",
    riskScore: 13,
    riskFlags: [],
    tags: ["中心化交易所"],
    balanceTrx: 990200,
    balanceUsdt: 22100000,
    txIn: 33012,
    txOut: 32880,
    firstSeen: "2019-08-08T00:00:00+08:00",
    note: "剥链与新鲜地址的共同出金交易所。",
  }),
];

const edges: TransferEdge[] = [
  edge("v1-root", ids.victim1, ids.shadow, 1_850_000, "USDT", "2026-08-14T09:18:11+08:00", [
    "疑似被盗资金入账",
  ]),
  edge("v2-root", ids.victim2, ids.shadow, 980_000, "USDT", "2026-08-15T02:41:09+08:00", [
    "疑似被盗资金入账",
  ]),
  edge("otc-root", ids.otcIn, ids.shadow, 720_500, "USDT", "2026-08-15T16:03:44+08:00"),
  edge("root-bn", ids.shadow, ids.binance, 1_850_000, "USDT", "2026-08-16T10:22:18+08:00", [
    "向中心化交易所充值",
  ]),
  edge("root-okx", ids.shadow, ids.okx, 420_000, "USDT", "2026-08-16T11:05:02+08:00", [
    "向中心化交易所充值",
  ]),
  edge("root-mixer", ids.shadow, ids.mixer, 960_000, "USDT", "2026-08-16T13:47:55+08:00", [
    "与混币器直接交互",
  ]),
  edge("root-ofac", ids.shadow, ids.ofac, 380_000, "USDT", "2026-08-16T14:02:31+08:00", [
    "对手方为受制裁实体",
  ]),
  edge("root-hopA", ids.shadow, ids.hopA, 215_400, "USDT", "2026-08-16T18:29:40+08:00"),
  edge("root-hopB", ids.shadow, ids.hopB, 176_800, "USDT", "2026-08-17T19:28:03+08:00"),
  edge("bn-u1", ids.binance, ids.bnUser1, 310_000, "USDT", "2026-08-20T08:14:22+08:00", [
    "交易所提现",
  ]),
  edge("bn-u2", ids.binance, ids.bnUser2, 88_400, "USDT", "2026-08-22T14:08:11+08:00", [
    "交易所提现",
  ]),
  edge("u1-cash", ids.bnUser1, ids.cashout, 154_000, "USDT", "2026-08-21T07:36:19+08:00"),
  edge("u1-bybit", ids.bnUser1, ids.bybit, 96_200, "USDT", "2026-08-24T12:11:48+08:00", [
    "跨所搬砖/出金",
  ]),
  edge("mixer-h1", ids.mixer, ids.mixHop1, 320_000, "USDT", "2026-08-18T02:44:01+08:00", [
    "混币器剥链拆分",
  ]),
  edge("mixer-h2", ids.mixer, ids.mixHop2, 285_500, "USDT", "2026-08-18T03:09:17+08:00", [
    "混币器剥链拆分",
  ]),
  edge("mixer-h3", ids.mixer, ids.mixHop3, 198_000, "USDT", "2026-08-18T04:21:33+08:00", [
    "混币器剥链拆分",
  ]),
  edge("h1-h1a", ids.mixHop1, ids.mixHop1a, 210_000, "USDT", "2026-08-23T21:18:40+08:00"),
  edge("h1-htx", ids.mixHop1, ids.htx, 95_000, "USDT", "2026-08-25T06:02:15+08:00", [
    "混币下游交易所出金",
  ]),
  edge("h2-dark", ids.mixHop2, ids.mixHop2a, 180_000, "USDT", "2026-08-19T11:55:08+08:00", [
    "流向暗网托管",
  ]),
  edge("h2-gate", ids.mixHop2, ids.gate, 72_000, "USDT", "2026-08-26T09:40:27+08:00"),
  edge("h3-nb", ids.mixHop3, ids.hopB1, 120_000, "USDT", "2026-08-19T15:12:00+08:00", [
    "二次混币",
  ]),
  edge("h1a-bybit", ids.mixHop1a, ids.bybit, 145_000, "USDT", "2026-08-27T03:22:51+08:00"),
  edge("dark-ofac", ids.mixHop2a, ids.ofac, 40_000, "USDT", "2026-08-29T17:08:36+08:00", [
    "暗网与制裁地址交互",
  ]),
  edge("hopA-otc", ids.hopA, ids.hopA1, 130_000, "USDT", "2026-08-19T10:48:22+08:00", [
    "场外出金",
  ]),
  edge("hopA-a2", ids.hopA, ids.hopA2, 68_000, "USDT", "2026-08-19T10:51:03+08:00"),
  edge("hopA-sun", ids.hopA, ids.sunswap, 18_500, "USDT", "2026-08-19T11:02:47+08:00", [
    "DEX 兑换",
  ]),
  edge("otc-cash", ids.hopA1, ids.cashout, 77_000, "USDT", "2026-08-21T08:01:14+08:00"),
  edge("a2-fresh", ids.hopA2, ids.hopA2a, 51_200, "USDT", "2026-08-28T09:06:55+08:00"),
  edge("fresh-gate", ids.hopA2a, ids.gate, 44_000, "USDT", "2026-09-01T13:19:02+08:00"),
  edge("hopB-nb", ids.hopB, ids.hopB1, 150_000, "USDT", "2026-08-17T20:01:28+08:00", [
    "与混币器直接交互",
  ]),
  edge("nb-nb2", ids.hopB1, ids.hopB1a, 110_000, "USDT", "2026-08-18T01:14:09+08:00", [
    "二次混币",
  ]),
  edge("nb2-mixer", ids.hopB1a, ids.mixer, 60_000, "USDT", "2026-08-30T22:47:33+08:00", [
    "回流主混币器",
  ]),
  edge("hopB-htx", ids.hopB, ids.htx, 22_000, "USDT", "2026-08-27T18:33:20+08:00"),
  edge("okx-cash", ids.okx, ids.cashout, 50_000, "USDT", "2026-08-22T16:28:41+08:00", [
    "交易所提现",
  ]),
  edge("ofac-dark", ids.ofac, ids.mixHop2a, 8_800, "USDT", "2026-09-03T04:15:07+08:00", [
    "制裁地址与暗网托管互转",
  ]),
  edge("u2-okx", ids.bnUser2, ids.okx, 12_400, "USDT", "2026-08-25T11:09:18+08:00"),
  edge("sun-a2", ids.sunswap, ids.hopA2, 18_120, "USDT", "2026-08-19T11:02:51+08:00", [
    "DEX 兑换输出",
  ]),
  edge("hopA-gas", ids.hopA, ids.hopA2, 850, "TRX", "2026-08-19T10:50:44+08:00"),
  edge("h1-gas", ids.mixHop1, ids.mixHop1a, 1_200, "TRX", "2026-08-23T21:18:22+08:00"),
  edge("root-usdt", ids.shadow, ids.usdt, 0.01, "USDT", "2026-08-16T10:21:50+08:00"),
];

export const DATASET: GraphDataset = { nodes, edges };

export const NODE_MAP = new Map(nodes.map((item) => [item.id, item]));
export const EDGE_MAP = new Map(edges.map((item) => [item.id, item]));

export const FEATURED_ROOT = ids.shadow;

export const CASE_META = {
  id: "TRN-2026-0911",
  title: "暗影拆分",
  chain: "TRON",
  asset: "USDT-TRC20",
  window: "近 30 天",
  summary:
    "根地址 ShadowVault-01 在 8 月中旬汇集约 355 万 USDT 疑似被盗与场外资金，随后拆分充值至 Binance / OKX，并直接接触混币器与 OFAC 制裁集群。",
};

export const EXAMPLE_ADDRESSES = [
  { address: ids.shadow, label: "高风险归集钱包", hint: "案件根地址" },
  { address: ids.mixer, label: "TronMixer-01", hint: "混币器入口" },
  { address: ids.ofac, label: "OFAC Cluster-7", hint: "制裁地址" },
];

export function getNeighbors(id: string): string[] {
  const set = new Set<string>();
  for (const item of edges) {
    if (item.from === id) set.add(item.to);
    if (item.to === id) set.add(item.from);
  }
  return [...set];
}

export function getIncidentEdges(visibleNodeIds: Set<string>): TransferEdge[] {
  return edges.filter(
    (item) => visibleNodeIds.has(item.from) && visibleNodeIds.has(item.to),
  );
}

export function shortestPath(from: string, to: string): string[] | null {
  if (from === to) return [from];
  const queue: string[][] = [[from]];
  const seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const tail = path[path.length - 1];
    for (const next of getNeighbors(tail)) {
      if (seen.has(next)) continue;
      const nextPath = [...path, next];
      if (next === to) return nextPath;
      seen.add(next);
      queue.push(nextPath);
    }
  }
  return null;
}
