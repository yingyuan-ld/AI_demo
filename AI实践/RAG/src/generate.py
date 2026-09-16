"""第五步：生成（Generate）
先把口语问题改写成条款用语，再检索，最后把命中条款交给大模型作答。

检索复用 store.py；重写和生成都走百炼聊天模型。没有检索到内容时不让模型瞎编。
"""

from __future__ import annotations

from embed import make_client
from paths import PREVIEW_GENERATE, ensure_dirs
from store import DEMO_QUERY, TOP_K, embed_query, open_collection, query_topk

CHAT_MODEL = "qwen-plus"


# 把最近几轮对话压成短文本，给重写和生成看指代（「这个」「那交费呢」）
def format_history(history: list[dict] | None, limit: int = 6) -> str:
    if not history:
        return ""
    lines = []
    for item in history[-limit:]:
        role = "用户" if item.get("role") == "user" else "助手"
        content = (item.get("content") or "").strip()
        if content:
            lines.append(f"{role}：{content}")
    return "\n".join(lines)


# 把口语问法改成更接近保单用词的检索问句；有历史时先补全指代
def rewrite_query(question: str, history: list[dict] | None = None) -> str:
    client = make_client()
    history_text = format_history(history)
    user_content = question
    if history_text:
        user_content = (
            f"对话历史：\n{history_text}\n\n当前问题：{question}\n"
            "请把当前问题改写成一句独立、可检索的保单问句。"
        )
    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "你负责改写保险问答的检索语句，不负责回答问题。"
                    "把用户原话改成更接近保单条款的中文问句，使用保险期间、交费年限、"
                    "保险责任、豁免等条款用语。"
                    "有对话历史时，把「这个」「那」「交费呢」等指代补全成完整问句。"
                    "只输出一句改写后的问句，不要解释，不要引号。"
                    "如果原问题已经很适合检索，就原样输出。"
                ),
            },
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
    )
    rewritten = (response.choices[0].message.content or "").strip().strip("「」\"'")
    return rewritten or question


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


# 调用百炼聊天接口，根据检索片段生成答案；历史只用来理解指代
def generate_answer(
    question: str,
    hits: list[tuple[float, dict]],
    history: list[dict] | None = None,
) -> str:
    client = make_client()
    messages = build_messages(question, hits)
    history_text = format_history(history)
    if history_text:
        messages[1]["content"] = (
            f"对话历史（仅帮助理解指代，答案仍必须来自保单片段）：\n{history_text}\n\n"
            + messages[1]["content"]
        )
    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.2,
    )
    return (response.choices[0].message.content or "").strip()


# 一轮完整问答：重写 → 检索 → 生成，给命令行和 Chat Doc 共用
def answer_question(
    collection,
    question: str,
    history: list[dict] | None = None,
) -> tuple[str, list[tuple[float, dict]], str]:
    rewritten = rewrite_query(question, history)
    query_vec = embed_query(rewritten)
    hits = query_topk(collection, query_vec, TOP_K)
    answer = generate_answer(question, hits, history) if hits else ""
    return rewritten, hits, answer


# 把原问题、改写结果、命中条款和模型答案写入预览
def write_generate_preview(
    question: str,
    rewritten: str | None,
    hits: list[tuple[float, dict]] | None,
    answer: str | None,
) -> None:
    ensure_dirs()
    lines = [
        f"聊天模型：{CHAT_MODEL}",
        f"检索条数：{TOP_K}",
        f"用户原问题：{question}",
        f"检索用问句：{rewritten or '（未改写）'}",
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
    PREVIEW_GENERATE.write_text("\n".join(lines), encoding="utf-8")
    print(f"preview_file={PREVIEW_GENERATE}")


def main() -> None:
    # 打开 Chroma → 查询重写 → 检索 Top-K → 按原问题生成答案 → 写预览
    collection = open_collection()
    rewritten = None
    hits = None
    answer = None
    try:
        rewritten, hits, answer = answer_question(collection, DEMO_QUERY)
        print(f"query={DEMO_QUERY}")
        print(f"rewritten={rewritten}")
        print(f"top_scores={[round(s, 4) for s, _ in hits]}")
        print(f"chat_model={CHAT_MODEL}")
    except SystemExit as exc:
        print(exc)

    write_generate_preview(DEMO_QUERY, rewritten, hits, answer)


if __name__ == "__main__":
    main()
