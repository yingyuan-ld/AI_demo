"""项目内统一路径。

代码在 src/，原始 PDF 和向量库在 data/，各步骤预览在 output/。
"""

from __future__ import annotations

from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
ROOT_DIR = SRC_DIR.parent
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
OUTPUT_DIR = ROOT_DIR / "output"

PDF_PATH = RAW_DIR / "电子保单.pdf"
CHROMA_DIR = DATA_DIR / "chroma"
VECTOR_PATH = DATA_DIR / "embeddings.npy"
META_PATH = DATA_DIR / "chunks_meta.json"

PREVIEW_LOAD = OUTPUT_DIR / "加载预览.txt"
PREVIEW_SPLIT = OUTPUT_DIR / "切片预览.txt"
PREVIEW_EMBED = OUTPUT_DIR / "嵌入预览.txt"
PREVIEW_STORE = OUTPUT_DIR / "存储预览.txt"
PREVIEW_GENERATE = OUTPUT_DIR / "生成预览.txt"

COLLECTION_NAME = "policy_chunks"


def ensure_dirs() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
