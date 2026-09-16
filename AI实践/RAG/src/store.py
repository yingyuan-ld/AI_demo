"""第四步：存储（Store）
打开本地 Chroma 做相似度检索。

向量、正文、元数据已经在 embed 时写入 data/chroma/。
提问时才把问题编成向量，才能和库里的条款比方向。
"""

from __future__ import annotations

import chromadb

from embed import EMBED_DIM, EMBED_MODEL, make_client
from paths import CHROMA_DIR, COLLECTION_NAME, PREVIEW_STORE, ensure_dirs

DEMO_QUERY = "主险的保险期间和交费年限是多久？"
TOP_K = 3


# 打开已经建好的本地库；没有 collection 说明还没跑过 embed
def open_collection():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        collection = client.get_collection(
            COLLECTION_NAME,
            embedding_function=None,
        )
    except Exception:
        raise FileNotFoundError("找不到 Chroma collection，请先运行 python src/embed.py") from None
    if collection.count() == 0:
        raise FileNotFoundError("Chroma collection 是空的，请先运行 python src/embed.py")
    return collection


# 把用户问题编成与库相同模型、相同维度的向量，才能比方向
def embed_query(text: str) -> list[float]:
    client = make_client()
    response = client.embeddings.create(
        model=EMBED_MODEL,
        input=text,
        dimensions=EMBED_DIM,
        encoding_format="float",
    )
    return list(response.data[0].embedding)


# Chroma 返回余弦距离（越小越像）；预览里再换成 1-距离，方便和「越接近 1 越相似」对照
def query_topk(collection, query_vec: list[float], k: int) -> list[tuple[float, dict]]:
    result = collection.query(
        query_embeddings=[query_vec],
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )
    hits: list[tuple[float, dict]] = []
    documents = (result.get("documents") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    for document, metadata, distance in zip(documents, metadatas, distances):
        item = dict(metadata or {})
        item["text"] = document or ""
        similarity = 1.0 - float(distance)
        hits.append((similarity, item))
    return hits


# 把库规模、测试问题和命中条款写入预览，方便人工核对检索是否合理
def write_store_preview(
    count: int,
    question: str,
    hits: list[tuple[float, dict]] | None,
) -> None:
    ensure_dirs()
    lines = [
        f"向量库：Chroma（{CHROMA_DIR.name}/{COLLECTION_NAME}）",
        f"已入库条数：{count}",
        "检索方式：Chroma 余弦距离（预览分数 = 1 - 距离，越接近 1 越相似）",
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
    PREVIEW_STORE.write_text("\n".join(lines), encoding="utf-8")
    print(f"preview_file={PREVIEW_STORE}")


def main() -> None:
    # 打开 Chroma → 问题嵌入 → Top-K → 写预览
    collection = open_collection()
    print(f"stored={collection.count()} path={CHROMA_DIR}")

    hits = None
    try:
        query_vec = embed_query(DEMO_QUERY)
        hits = query_topk(collection, query_vec, TOP_K)
        print(f"query={DEMO_QUERY}")
        print(f"top_scores={[round(s, 4) for s, _ in hits]}")
    except SystemExit as exc:
        print(exc)

    write_store_preview(collection.count(), DEMO_QUERY, hits)


if __name__ == "__main__":
    main()
