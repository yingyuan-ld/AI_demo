"""用通义千问 VL 把 PDF 第 2 页（图片页）转成文字。

需要环境变量 DASHSCOPE_API_KEY，不要把 Key 写进代码。
PowerShell 示例：
    $env:DASHSCOPE_API_KEY = "你的key"
    python 01_vl_page2.py
"""

from __future__ import annotations

import base64
import os
from pathlib import Path

from openai import OpenAI
from pypdf import PdfReader

BASE_DIR = Path(__file__).parent
PDF_PATH = BASE_DIR / "物料" / "电子保单.pdf"
OUT_PATH = BASE_DIR / "第2页_多模态转写.txt"
MODEL = "qwen-vl-plus"


def page_image_base64(pdf_path: Path, page_index: int = 1) -> str:
    reader = PdfReader(str(pdf_path))
    page = reader.pages[page_index]
    images = list(page.images)
    if not images:
        raise RuntimeError(f"第 {page_index + 1} 页没有图片，不需要多模态。")
    return base64.b64encode(images[0].data).decode("ascii")


def main() -> None:
    api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("未找到环境变量 DASHSCOPE_API_KEY。请先设置后再运行。")

    if not PDF_PATH.exists():
        raise FileNotFoundError(f"找不到文件：{PDF_PATH}")

    image_b64 = page_image_base64(PDF_PATH, page_index=1)
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    completion = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                    {
                        "type": "text",
                        "text": (
                            "请把这张图片里所有可见文字完整转写出来，保持原有顺序和大致换行。"
                            "不要翻译，不要总结，不要补充图片中没有的内容。"
                            "如果某些字看不清，用【看不清】标出。"
                        ),
                    },
                ],
            }
        ],
    )
    text = completion.choices[0].message.content or ""
    usage = completion.usage
    header = [
        f"模型：{MODEL}",
        f"输入 Token：{getattr(usage, 'prompt_tokens', '未知')}",
        f"输出 Token：{getattr(usage, 'completion_tokens', '未知')}",
        "",
        text.strip(),
        "",
    ]
    OUT_PATH.write_text("\n".join(header), encoding="utf-8")
    print(f"ok=1 file={OUT_PATH}")
    if usage:
        print(f"prompt_tokens={usage.prompt_tokens}")
        print(f"completion_tokens={usage.completion_tokens}")


if __name__ == "__main__":
    main()
