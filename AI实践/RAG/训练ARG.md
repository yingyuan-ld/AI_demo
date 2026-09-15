# 文档向量化
## 加载 loader
csv html json md pdf 。。。
↓
document
## 文档切片 split
基于长度：按固定字数 / Token 数切开。
from langchain_text_splitters import CharacterTextSplitter
基于文本架构：按文章结构切，如标题、章节、段落、列表，一块尽量对应一个完整小节。
from langchain_text_splitters import RecursiveCharacterTextSplitter
基于文档结构：PDF页、Markdown、JSON
基于语义（智能）：用模型判断语义边界，意思变了再切开，比按字数更贴内容，成本更高。
## 嵌入 embed
常见嵌入封装（LangChain）：

| 模型名 | 模型方 | 说明 |
|---|---|---|
| OpenAIEmbeddings | openai | 多个模型，一般嵌入维度 1024 |
| OllamaEmbeddings | 多方 | 可以运行多种开源嵌入模型 |
| JinaEmbeddings | Jina.ai | 顶级多语言嵌入模型 |
| ZhipuAIEmbeddings | zhipu | 中文能力较强，嵌入维度 1024 |



## 存储 store

