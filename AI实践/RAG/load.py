"""第一步：加载（Loader）
把 PDF 读成 LangChain 的 Document 列表。
文字页直接抽取；有图片且几乎抽不出字时，调用通义千问 VL 转写。

需要环境变量 DASHSCOPE_API_KEY（仅图片页会用到）。
"""

from __future__ import annotations

import base64
import os
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from openai import OpenAI
from pypdf import PdfReader

BASE_DIR = Path(__file__).parent
PDF_PATH = BASE_DIR / "物料" / "电子保单.pdf"
PREVIEW_PATH = BASE_DIR / "加载预览.txt"
VL_MODEL = "qwen-vl-plus"
# 文字太少才认为「这一页主要靠图」，避免 Logo/印章页每页都调 API
TEXT_THRESHOLD = 30
# 单页最多把几张图发给多模态，防止某页嵌了几百个小图
MAX_IMAGES_PER_PAGE = 3


def page_images(page) -> list:
    try:
        return list(page.images)
    except Exception:
        return []


def transcribe_images(client: OpenAI, images: list) -> str:
    picked = sorted(images, key=lambda img: len(img.data), reverse=True)[:MAX_IMAGES_PER_PAGE]
    content: list[dict] = []
    for img in picked:
        b64 = base64.b64encode(img.data).decode("ascii")
        mime = "image/png" if img.name.lower().endswith(".png") else "image/jpeg"
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            }
        )
    content.append(
        {
            "type": "text",
            "text": (
                "请把图片里所有可见文字完整转写出来，保持原有顺序和大致换行。"
                "不要翻译，不要总结，不要补充图片中没有的内容。"
                "如果某些字看不清，用【看不清】标出。"
            ),
        }
    )
    completion = client.chat.completions.create(
        model=VL_MODEL,
        messages=[{"role": "user", "content": content}],
    )
    return (completion.choices[0].message.content or "").strip()


def load_documents() -> list:
    """加载 PDF，必要时用 VL 补图片页，返回 Document 列表（仍在内存里）。"""
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"找不到文件：{PDF_PATH}")

    loader = PyPDFLoader(str(PDF_PATH))
    docs = loader.load()
    reader = PdfReader(str(PDF_PATH))
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
    client = (
        OpenAI(
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        if api_key
        else None
    )

    for index, doc in enumerate(docs):
        page = reader.pages[index]
        images = page_images(page)
        text = doc.page_content.strip()
        doc.metadata["image_count"] = len(images)
        doc.metadata["extract"] = "text"

        if not images or len(text) >= TEXT_THRESHOLD:
            continue

        if client is None:
            doc.metadata["extract"] = "image_need_vl"
            continue

        print(f"vl_page={index + 1} images={len(images)}")
        transcribed = transcribe_images(client, images)
        if transcribed:
            doc.page_content = transcribed
            doc.metadata["extract"] = "vl"

    return docs


def write_load_preview(docs: list) -> None:
    empty_pages = [i for i, doc in enumerate(docs, start=1) if not doc.page_content.strip()]
    vl_pages = sum(1 for doc in docs if doc.metadata.get("extract") == "vl")
    skipped_no_key = sum(1 for doc in docs if doc.metadata.get("extract") == "image_need_vl")
    lines = [
        f"文件：{PDF_PATH.name}",
        f"加载结果：{len(docs)} 页（每页一个 Document）",
        f"空页数量：{len(empty_pages)}",
        f"多模态转写页数：{vl_pages}",
        f"有图但缺 API Key 而跳过：{skipped_no_key}",
        "",
    ]

    for i, doc in enumerate(docs, start=1):
        text = doc.page_content.strip()
        preview = text[:400] if text else "【本页没有抽出文字，可能是扫描件/图片 PDF】"
        lines.append(f"--- 第 {i} 页 ---")
        lines.append(f"字数：{len(text)}")
        lines.append(f"图片数：{doc.metadata.get('image_count', 0)}")
        lines.append(f"抽取方式：{doc.metadata.get('extract')}")
        lines.append(f"来源：{doc.metadata.get('source', '')}")
        lines.append(f"页码：{doc.metadata.get('page', '')}")
        lines.append("预览：")
        lines.append(preview)
        lines.append("")

    PREVIEW_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"loaded_pages={len(docs)}")
    print(f"empty_pages={len(empty_pages)}")
    print(f"vl_pages={vl_pages}")
    print(f"skipped_no_key={skipped_no_key}")
    print(f"preview_file={PREVIEW_PATH}")


def main() -> None:
    docs = load_documents()
    write_load_preview(docs)


if __name__ == "__main__":
    main()
