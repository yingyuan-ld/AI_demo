"""第五步：生成（Generate）
检索到的条款 + 用户问题，交给大模型写出答案。

检索复用 store.py；生成走百炼聊天模型。没有检索到内容时不让模型瞎编。
"""

from __future__ import annotations

from pathlib import Path

from embed import make_client
from store import DEMO_QUERY, TOP_K, embed_query, open_collection, query_topk

# 预览路径，以及用来写答案的聊天模型
PREVIEW_PATH = Path(__file__).parent / "生成预览.txt"
CHAT_MODEL = "qwen-plus"


# 把命中条款编进提示词：只能依据这些内容答，并标出原页
def build_messages(question: str, hits: list[tuple[float, dict]]) -> list[dict]:
    context_parts = []
    for i, (_, item) in enumerate(hits, start=1):
        page = item.get("page")
        chunk_index = item.get("chunk_index")
        text = (item.get("text") or "").strip()
        context_parts.append(f"【片段 {i}｜原页 {page}｜切片 {chunk_index}】\n{text}")
    context = "\n\n".join(context_parts)
    return [
        {
            "role": "system",
            "content": (
                "你是保险条款问答助手。只根据用户提供的保单片段回答，"
                "不要使用片段之外的知识，不要编造数字或责任。"
                "如果片段里没有答案，明确说「根据已检索到的保单内容无法确定」。"
                "回答时用中文，尽量引用片段中的原句，并注明原 PDF 页码。"
            ),
        },
        {
            "role": "user",
            "content": f"保单片段：\n{context}\n\n问题：{question}",
        },
    ]


# 调用百炼聊天接口，根据检索片段生成答案
def generate_answer(question: str, hits: list[tuple[float, dict]]) -> str:
    client = make_client()
    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=build_messages(question, hits),
        temperature=0.2,
    )
    return (response.choices[0].message.content or "").strip()


# 把问题、命中条款和模型答案写入预览，方便人工核对有没有胡编
def write_generate_preview(
    question: str,
    hits: list[tuple[float, dict]] | None,
    answer: str | None,
) -> None:
    lines = [
        f"聊天模型：{CHAT_MODEL}",
        f"检索条数：{TOP_K}",
        f"测试问题：{question}",
        "",
    ]
    if hits is None:
        lines.append("未生成：缺少 DASHSCOPE_API_KEY，无法嵌入问题或调用聊天模型。")
    elif not hits:
        lines.append("未生成：没有检索到任何片段。")
    else:
        for i, (score, item) in enumerate(hits, start=1):
            lines.append(
                f"--- 命中 {i}  相似度 {score:.4f}  原页 {item.get('page')}  切片 {item.get('chunk_index')} ---"
            )
            lines.append((item.get("text") or "")[:400])
            lines.append("")
        lines.append("--- 模型答案 ---")
        lines.append(answer or "")
    PREVIEW_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"preview_file={PREVIEW_PATH}")


def main() -> None:
    # 打开 Chroma → 检索 Top-K → 生成答案 → 写预览
    collection = open_collection()
    hits = None
    answer = None
    try:
        query_vec = embed_query(DEMO_QUERY)
        hits = query_topk(collection, query_vec, TOP_K)
        print(f"query={DEMO_QUERY}")
        print(f"top_scores={[round(s, 4) for s, _ in hits]}")
        if hits:
            answer = generate_answer(DEMO_QUERY, hits)
            print(f"chat_model={CHAT_MODEL}")
    except SystemExit as exc:
        print(exc)

    write_generate_preview(DEMO_QUERY, hits, answer)


if __name__ == "__main__":
    main()
