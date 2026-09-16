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
| DashScopeEmbeddings | 阿里云百炼  |

## 存储 store
把向量和正文放进可检索的知识库。
`embed.py` 嵌入后写入本地 Chroma（`chroma_db/policy_chunks`），距离函数用 `cosine`。
`store.py` 打开这个 collection 做检索，不再读 npy/json。

文本找向量
vector_store.similarity_search(query)
向量库的相似性搜索。
vector_store.similarity_search_by_vector(embedding_vector)
+词法检索 = 混合检索

## 检索 retrieve
当前是向量检索器：Chroma `collection.query`（余弦距离 Top-K）。LangChain 里可再包成 `as_retriever()`。

| 检索器 | 适用场景 | 说明 |
|---|---|---|
| 向量检索器 | 向量数据库检索查询 | 大部分向量库都支持。现在的 Chroma 就是这一种 |
| 文档检索器 | 内部知识库 / 企业内网 | 可以用类似 ES 搭一个私有化的强大检索器 |
| 外部检索器 | 搜索场景优化 | 用外部 API 检索，可不依赖自建数据库 |
| 关系数据库检索器 | SQL 查询、图数据查询 | 重点在对查询语言的重建（写更好的 SQL） |
| 词法搜索检索器 | 精准的字面匹配 | 类似传统搜索引擎，代表为 BM25 |
| 多重检索 | 需要更好的召回率 | 返回与原始问题扩展后最相关的文档块 |
| 多重检索之分解 | Deep research | 把原始问题扩成子问题，再分别检索后汇总答案 |

## 生成 generate
查询重写、查询重构
检索调优
    压缩：去掉多余 // eg:LLMChainExtractor
    相似性分数
    排序  // 文档按与查询的相关性降序排列。LongContextReorder 解决lost in the middle

## Chat Doc
`chat_doc.py`：Streamlit 多轮对话。历史参与查询重写（补全「这个」「那交费呢」），检索仍走 Chroma，答案带来源页码。
启动：`streamlit run chat_doc.py`


