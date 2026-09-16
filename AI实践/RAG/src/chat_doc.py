"""Chat Doc：对着已入库的电子保单连续提问。

多轮对话走 generate.answer_question（查询重写 + Chroma 检索 + 生成）。
向量库只打开一次，历史留在浏览器会话里。
"""

from __future__ import annotations

import streamlit as st

from generate import CHAT_MODEL, answer_question
from store import open_collection


# 会话里只连一次 Chroma，避免每条消息都重新打开磁盘
@st.cache_resource
def load_collection():
    return open_collection()


# 在答案下面展开命中条款，方便核对有没有胡编
def render_sources(rewritten: str, hits: list[tuple[float, dict]]) -> None:
    with st.expander("检索依据", expanded=False):
        st.caption(f"检索用问句：{rewritten}")
        for i, (score, item) in enumerate(hits, start=1):
            page = item.get("page")
            chunk_index = item.get("chunk_index")
            st.markdown(f"**命中 {i}** · 相似度 {score:.4f} · 原页 {page} · 切片 {chunk_index}")
            st.text((item.get("text") or "")[:400])


def main() -> None:
    st.set_page_config(page_title="人身保险合同", page_icon="📄", layout="centered")
    st.title("中国平安人身保险合同")
    st.caption("基于已切片入库的电子保单问答。只根据检索到的条款回答。")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    # 侧栏显示库状态，并提供清空对话
    with st.sidebar:
        st.subheader("知识库")
        try:
            collection = load_collection()
            st.write(f"已入库 {collection.count()} 条切片")
            st.write(f"生成模型：{CHAT_MODEL}")
        except FileNotFoundError as exc:
            st.error(str(exc))
            st.stop()
        if st.button("清空对话"):
            st.session_state.messages = []
            st.rerun()

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message["role"] == "assistant" and message.get("hits"):
                render_sources(message.get("rewritten") or "", message["hits"])

    prompt = st.chat_input("问保单，例如：主险能保多久？")
    if not prompt:
        return

    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    history = [item for item in st.session_state.messages[:-1] if item.get("role") in ("user", "assistant")]
    with st.chat_message("assistant"):
        with st.spinner("正在检索并生成…"):
            try:
                rewritten, hits, answer = answer_question(collection, prompt, history)
            except SystemExit as exc:
                st.error(str(exc))
                st.session_state.messages.pop()
                return
        text = answer or "没有检索到相关条款，无法回答。"
        st.markdown(text)
        if hits:
            render_sources(rewritten, hits)

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": text,
            "rewritten": rewritten,
            "hits": hits,
        }
    )


if __name__ == "__main__":
    main()
