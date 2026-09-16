"""第三步：嵌入（Embed）
把切片后的文本变成向量。使用阿里云百炼 text-embedding-v3（中文友好）。

向量会写入 data/chroma/。npy/json 只是给人看的备份，检索不再读它们。
"""

from __future__ import annotations

import json
import os

import chromadb
import numpy as np
from openai import OpenAI

from load import load_documents
from paths import (
    CHROMA_DIR,
    COLLECTION_NAME,
    META_PATH,
    PREVIEW_EMBED,
    VECTOR_PATH,
    ensure_dirs,
)
from split import split_documents

EMBED_MODEL = "text-embedding-v3"
EMBED_DIM = 1024
BATCH_SIZE = 10


# 用环境变量里的 Key 创建客户端，请求打到百炼的 OpenAI 兼容地址
def make_client() -> OpenAI:
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("未找到环境变量 DASHSCOPE_API_KEY，嵌入需要调用百炼向量模型。")
    return OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )


# 按 BATCH_SIZE 分批调用嵌入接口，拼回与原文顺序一致的向量列表
def embed_texts(client: OpenAI, texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    total = len(texts)
    for start in range(0, total, BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        response = client.embeddings.create(
            model=EMBED_MODEL,
            input=batch,
            dimensions=EMBED_DIM,
            encoding_format="float",
        )
        ordered = sorted(response.data, key=lambda item: item.index)
        vectors.extend(item.embedding for item in ordered)
        print(f"embedded={min(start + BATCH_SIZE, total)}/{total}")
    return vectors


# 把向量和正文写入 Chroma；每次重建，避免重复跑时堆两份切片
def save_to_chroma(chunks: list, vectors: list[list[float]]):
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=None,
        configuration={"hnsw": {"space": "cosine"}},
    )
    collection.add(
        ids=[f"chunk-{chunk.metadata.get('chunk_index', i)}" for i, chunk in enumerate(chunks)],
        embeddings=vectors,
        documents=[chunk.page_content for chunk in chunks],
        metadatas=[
            {
                "chunk_index": int(chunk.metadata.get("chunk_index", i)),
                "page": int(chunk.metadata.get("page") or 0),
                "extract": str(chunk.metadata.get("extract") or ""),
                "source": str(chunk.metadata.get("source") or ""),
            }
            for i, chunk in enumerate(chunks)
        ],
    )
    return collection


# 向量写入 npy/json 备份，并灌进 Chroma，供下一步检索
def save_embeddings(chunks: list, vectors: list[list[float]]) -> None:
    ensure_dirs()
    array = np.array(vectors, dtype=np.float32)
    np.save(VECTOR_PATH, array)
    meta = []
    for chunk, vector in zip(chunks, vectors):
        meta.append(
            {
                "chunk_index": chunk.metadata.get("chunk_index"),
                "page": chunk.metadata.get("page"),
                "extract": chunk.metadata.get("extract"),
                "source": chunk.metadata.get("source"),
                "text": chunk.page_content,
                "dim": len(vector),
            }
        )
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    collection = save_to_chroma(chunks, vectors)
    print(f"chroma_stored={collection.count()}")


# 写一份给人看的摘要：模型、维度、第 0 块正文和向量前几维
def write_embed_preview(chunks: list, vectors: list[list[float]]) -> None:
    ensure_dirs()
    first = vectors[0] if vectors else []
    preview_dims = ", ".join(f"{x:.6f}" for x in first[:8])
    lines = [
        f"模型：{EMBED_MODEL}",
        f"向量维度：{len(first) if first else 0}（指定 {EMBED_DIM}）",
        f"切片数量：{len(chunks)}",
        f"向量文件：{VECTOR_PATH.name}",
        f"元数据文件：{META_PATH.name}",
        "",
        "--- 第 0 个切片 ---",
        f"原 PDF 页码：{chunks[0].metadata.get('page') if chunks else ''}",
        f"正文预览：{(chunks[0].page_content[:200] if chunks else '')}",
        f"向量前 8 维：[{preview_dims}]",
        "",
        "说明：每个切片对应一行 1024 维小数。数值本身没有可读含义，",
        "相近的文本会得到方向接近的向量，供后面检索使用。",
    ]
    PREVIEW_EMBED.write_text("\n".join(lines), encoding="utf-8")
    print(f"chunks={len(chunks)}")
    print(f"dim={len(first) if first else 0}")
    print(f"preview_file={PREVIEW_EMBED}")
    print(f"vector_file={VECTOR_PATH}")
    print(f"meta_file={META_PATH}")


def main() -> None:
    # 加载 → 切片 → 批量嵌入 → 落盘 → 写预览
    docs = load_documents()
    chunks = split_documents(docs)
    client = make_client()
    vectors = embed_texts(client, [chunk.page_content for chunk in chunks])
    if len(vectors) != len(chunks):
        raise RuntimeError(f"向量数量 {len(vectors)} 与切片数量 {len(chunks)} 不一致")
    save_embeddings(chunks, vectors)
    write_embed_preview(chunks, vectors)


if __name__ == "__main__":
    main()
