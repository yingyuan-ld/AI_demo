"""第二步：切片（Split）
对加载得到的 Document 列表切块，不处理预览文件。

保单中文按段落/句号切，块与块之间留一点重叠，避免条款在边界被切断。
"""

from __future__ import annotations

from langchain_text_splitters import RecursiveCharacterTextSplitter

from load import load_documents
from paths import PREVIEW_SPLIT, ensure_dirs

# 按长度切分的块大小、重叠字数
CHUNK_SIZE = 500
CHUNK_OVERLAP = 80


# 丢掉空页后，按段落/句号递归切成不超过 CHUNK_SIZE 的块，并写入切片序号
def split_documents(docs: list) -> list:
    nonempty = [doc for doc in docs if doc.page_content.strip()]
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", "。", "；", "，", " ", ""],
    )
    chunks = splitter.split_documents(nonempty)
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["chunk_chars"] = len(chunk.page_content)
    return chunks


# 把切片统计和前 12 块正文写入预览文件，方便人工抽查
def write_split_preview(docs: list, chunks: list) -> None:
    ensure_dirs()
    lengths = [len(c.page_content) for c in chunks]
    avg = round(sum(lengths) / len(lengths), 1) if lengths else 0
    lines = [
        f"来源页数（非空）：{len([d for d in docs if d.page_content.strip()])} / {len(docs)}",
        f"切片数量：{len(chunks)}",
        f"chunk_size={CHUNK_SIZE}  overlap={CHUNK_OVERLAP}",
        f"切片字数：最小 {min(lengths) if lengths else 0} / 平均 {avg} / 最大 {max(lengths) if lengths else 0}",
        "",
    ]

    show = chunks[:12]
    for chunk in show:
        page = chunk.metadata.get("page", "")
        extract = chunk.metadata.get("extract", "")
        idx = chunk.metadata.get("chunk_index")
        text = chunk.page_content.strip()
        lines.append(f"--- 切片 {idx}（原 PDF 页码 {page}，抽取 {extract}）---")
        lines.append(f"字数：{len(text)}")
        lines.append(text)
        lines.append("")

    if len(chunks) > len(show):
        lines.append(f"... 其余 {len(chunks) - len(show)} 个切片已生成，未全部写入预览。")

    PREVIEW_SPLIT.write_text("\n".join(lines), encoding="utf-8")
    print(f"source_pages={len(docs)}")
    print(f"chunks={len(chunks)}")
    print(f"chunk_chars_min={min(lengths) if lengths else 0}")
    print(f"chunk_chars_avg={avg}")
    print(f"chunk_chars_max={max(lengths) if lengths else 0}")
    print(f"preview_file={PREVIEW_SPLIT}")


def main() -> None:
    # 先加载 Document，再切片，最后写出给人看的预览
    docs = load_documents()
    chunks = split_documents(docs)
    write_split_preview(docs, chunks)


if __name__ == "__main__":
    main()
