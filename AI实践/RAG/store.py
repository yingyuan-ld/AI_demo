"""第四步：存储（Store）
把 embed 已经落盘的向量和正文当成本地知识库，并做一次相似度检索。

498 条向量直接在内存里做余弦相似度即可，不必再装大型向量数据库。
写入本身不再调 API；提问时才把问题编成向量，才能和库里的条款比方向。
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from embed import EMBED_DIM, EMBED_MODEL, META_PATH, VECTOR_PATH, make_client

# 预览路径，以及演示问题和返回条数
BASE_DIR = Path(__file__).parent
PREVIEW_PATH = BASE_DIR / "存储预览.txt"
DEMO_QUERY = "主险的保险期间和交费年限是多久？"
TOP_K = 3


# 从磁盘读回向量矩阵和切片正文，行数必须一一对应
def load_store() -> tuple[np.ndarray, list[dict]]:
    if not VECTOR_PATH.exists() or not META_PATH.exists():
        raise FileNotFoundError("找不到 embeddings.npy 或 chunks_meta.json，请先运行 python embed.py")
    vectors = np.load(VECTOR_PATH).astype(np.float32)
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    if len(vectors) != len(meta):
        raise RuntimeError(f"向量行数 {len(vectors)} 与元数据条数 {len(meta)} 不一致")
    return vectors, meta


# 把用户问题编成与库相同模型、相同维度的向量，才能比方向
def embed_query(text: str) -> np.ndarray:
    client = make_client()
    response = client.embeddings.create(
        model=EMBED_MODEL,
        input=text,
        dimensions=EMBED_DIM,
        encoding_format="float",
    )
    return np.array(response.data[0].embedding, dtype=np.float32)


# 先归一化再点积得到余弦相似度，按分数从高到低取前 k 条
def cosine_topk(query: np.ndarray, matrix: np.ndarray, k: int) -> tuple[np.ndarray, np.ndarray]:
    q = query / (np.linalg.norm(query) + 1e-12)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-12
    scores = (matrix / norms) @ q
    index = np.argsort(-scores)[:k]
    return index, scores[index]


# 把库规模、测试问题和命中条款写入预览，方便人工核对检索是否合理
def write_store_preview(
    count: int,
    question: str,
    hits: list[tuple[float, dict]] | None,
) -> None:
    lines = [
        f"存储文件：{VECTOR_PATH.name} + {META_PATH.name}",
        f"已加载条数：{count}",
        "检索方式：余弦相似度（越接近 1 越相似）",
        "",
    ]
    if hits is None:
        lines.append("未做检索：缺少 DASHSCOPE_API_KEY，无法把问题编成向量。")
    else:
        lines.append(f"测试问题：{question}")
        lines.append("")
        for i, (score, item) in enumerate(hits, start=1):
            lines.append(
                f"--- 命中 {i}  相似度 {score:.4f}  原页 {item.get('page')}  切片 {item.get('chunk_index')} ---"
            )
            lines.append((item.get("text") or "")[:400])
            lines.append("")
    PREVIEW_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"preview_file={PREVIEW_PATH}")


def main() -> None:
    # 读库 → 问题嵌入 → 余弦 Top-K → 写预览
    vectors, meta = load_store()
    print(f"stored={len(meta)} dim={vectors.shape[1]}")

    hits = None
    try:
        query_vec = embed_query(DEMO_QUERY)
        index, scores = cosine_topk(query_vec, vectors, TOP_K)
        hits = [(float(scores[i]), meta[int(idx)]) for i, idx in enumerate(index)]
        print(f"query={DEMO_QUERY}")
        print(f"top_scores={[round(s, 4) for s, _ in hits]}")
    except SystemExit as exc:
        print(exc)

    write_store_preview(len(meta), DEMO_QUERY, hits)


if __name__ == "__main__":
    main()
