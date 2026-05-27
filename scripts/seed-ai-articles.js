// Seed 10 AI-technology articles with fictional dates
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wiki.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const insert = db.prepare(`
  INSERT OR REPLACE INTO articles (slug, title, body, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`);

const articles = [
  {
    slug: 'transformer-architecture',
    title: 'Transformer Architecture',
    date: '2024-03-12',
    body: `# Transformer Architecture

The Transformer is the foundational neural network architecture behind modern large language models. Introduced by Vaswani et al. in the 2017 paper *Attention Is All You Need*, it replaced recurrent networks with a fully attention-based approach.

## Core concepts

### Self-attention

Self-attention allows each token in a sequence to attend to every other token, computing a weighted sum of value vectors based on query-key similarity:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

### Multi-head attention

Multiple attention heads run in parallel, each learning different relational patterns. Their outputs are concatenated and projected:

\`\`\`python
def multi_head_attention(Q, K, V, num_heads=8):
    head_dim = Q.shape[-1] // num_heads
    heads = []
    for i in range(num_heads):
        q = Q[..., i*head_dim:(i+1)*head_dim]
        k = K[..., i*head_dim:(i+1)*head_dim]
        v = V[..., i*head_dim:(i+1)*head_dim]
        heads.append(scaled_dot_product_attention(q, k, v))
    return linear(concat(heads))
\`\`\`

### Feed-forward layers

Each transformer block contains a position-wise feed-forward network applied identically to each token:

\`\`\`
FFN(x) = max(0, xW₁ + b₁)W₂ + b₂
\`\`\`

## Encoder vs decoder

| Component | Purpose | Used by |
|---|---|---|
| Encoder | Bidirectional context | BERT, RoBERTa |
| Decoder | Autoregressive generation | GPT series |
| Encoder-decoder | Seq2seq tasks | T5, BART |

## Positional encoding

Since attention is permutation-invariant, transformers inject positional information via sinusoidal encodings or learned embeddings added to the input token representations.

## Scaling laws

Research shows transformer performance follows predictable power laws with respect to model size, dataset size, and compute — the foundation for planning frontier model training runs.

See also: [[Attention Mechanisms]], [[Large Language Models]], [[BERT and GPT]]`,
  },
  {
    slug: 'retrieval-augmented-generation',
    title: 'Retrieval-Augmented Generation',
    date: '2024-05-20',
    body: `# Retrieval-Augmented Generation

Retrieval-Augmented Generation (RAG) grounds language model outputs in external knowledge retrieved at inference time. It addresses the key limitations of parametric knowledge: staleness, hallucination, and lack of auditability.

## Architecture overview

A RAG pipeline has three stages:

1. **Indexing** — documents are chunked, embedded, and stored in a vector database
2. **Retrieval** — the user query is embedded and used to fetch top-k similar chunks
3. **Generation** — retrieved chunks are injected into the LLM prompt as context

\`\`\`python
def rag_query(question: str, retriever, llm) -> str:
    chunks = retriever.search(question, top_k=5)
    context = "\\n\\n".join(chunks)
    prompt = f"Context:\\n{context}\\n\\nQuestion: {question}\\nAnswer:"
    return llm.generate(prompt)
\`\`\`

## Retrieval strategies

### Dense retrieval

Bi-encoder models (e.g. \`text-embedding-3-large\`) encode query and documents into a shared embedding space. Approximate nearest-neighbour search (FAISS, HNSW) makes this fast at scale.

### Sparse retrieval (BM25)

Classic TF-IDF based keyword matching. Fast and excellent for exact-match queries but lacks semantic understanding.

### Hybrid retrieval

Combining dense and sparse scores via Reciprocal Rank Fusion (RRF) consistently outperforms either approach alone:

\`\`\`python
def rrf_score(dense_rank, sparse_rank, k=60):
    return 1/(k + dense_rank) + 1/(k + sparse_rank)
\`\`\`

## Advanced patterns

- **Re-ranking** — a cross-encoder re-scores the top-k results for precision
- **HyDE** — generate a hypothetical answer first, then retrieve similar documents
- **Contextual compression** — extract only the relevant sentences from each chunk

## Evaluation metrics

| Metric | Measures |
|---|---|
| Recall@k | Are the right chunks retrieved? |
| Faithfulness | Does the answer stay within the context? |
| Answer relevance | Does the answer address the question? |

See also: [[Vector Databases]], [[Embedding Models]], [[Transformer Architecture]]`,
  },
  {
    slug: 'fine-tuning-llms',
    title: 'Fine-tuning Large Language Models',
    date: '2024-01-08',
    body: `# Fine-tuning Large Language Models

Fine-tuning adapts a pretrained LLM to a specific task or domain by continuing training on curated data. It sits between full pretraining (expensive) and prompting (limited).

## Approaches

### Full fine-tuning

All model weights are updated. Requires significant GPU memory but achieves the best task performance. Practical only for models up to ~7B parameters on commodity hardware.

### Parameter-efficient fine-tuning (PEFT)

Only a small fraction of parameters are trained, keeping the base model frozen.

#### LoRA (Low-Rank Adaptation)

LoRA injects trainable rank-decomposition matrices into each attention layer:

\`\`\`python
# Original: W ∈ R^{d×k}
# LoRA: W + ΔW = W + BA, where B ∈ R^{d×r}, A ∈ R^{r×k}, r << d

class LoRALayer(nn.Module):
    def __init__(self, in_features, out_features, rank=8, alpha=16):
        super().__init__()
        self.lora_A = nn.Linear(in_features, rank, bias=False)
        self.lora_B = nn.Linear(rank, out_features, bias=False)
        self.scale = alpha / rank
        nn.init.kaiming_uniform_(self.lora_A.weight)
        nn.init.zeros_(self.lora_B.weight)

    def forward(self, x, base_output):
        return base_output + self.lora_B(self.lora_A(x)) * self.scale
\`\`\`

#### QLoRA

Combines 4-bit quantization with LoRA, enabling fine-tuning of 70B models on a single A100 GPU.

## Instruction tuning

Supervised fine-tuning on (instruction, response) pairs teaches the model to follow natural language instructions. Data quality dominates quantity — 1k high-quality examples often outperform 100k noisy ones.

## RLHF

Reinforcement Learning from Human Feedback aligns model behaviour with human preferences:

1. Collect human preference comparisons
2. Train a reward model
3. Optimize the LLM against the reward model via PPO or DPO

## Common pitfalls

- **Catastrophic forgetting** — fine-tuning degrades general capabilities
- **Overfitting** — small datasets lead to memorisation, not generalisation
- **Distribution shift** — fine-tuning data that doesn't match inference inputs

See also: [[Transformer Architecture]], [[Large Language Models]], [[Alignment and RLHF]]`,
  },
  {
    slug: 'vector-databases',
    title: 'Vector Databases',
    date: '2023-11-15',
    body: `# Vector Databases

Vector databases store high-dimensional embeddings and provide efficient approximate nearest-neighbour (ANN) search. They are the storage layer underpinning RAG systems, semantic search, and recommendation engines.

## Why vector databases exist

Traditional SQL databases compare rows by exact values. Vector similarity requires measuring distance in hundreds or thousands of dimensions — operations that relational databases handle poorly at scale.

## Core operations

\`\`\`python
import qdrant_client as qc

client = qc.QdrantClient(":memory:")
client.create_collection("docs", vectors_config=qc.models.VectorParams(size=1536, distance=qc.models.Distance.COSINE))

# Upsert vectors
client.upsert("docs", points=[
    qc.models.PointStruct(id=1, vector=embedding, payload={"text": "...", "source": "doc.pdf"})
])

# Query
results = client.search("docs", query_vector=query_embedding, limit=5)
\`\`\`

## Indexing algorithms

| Algorithm | Type | Trade-off |
|---|---|---|
| HNSW | Graph-based | Fast queries, high memory |
| IVF | Cluster-based | Lower memory, slower build |
| PQ | Compression | Smallest storage, some accuracy loss |
| FLAT | Brute force | 100% recall, slow at scale |

## Distance metrics

- **Cosine similarity** — angle between vectors; standard for text embeddings
- **Dot product** — magnitude-weighted cosine; used when embeddings are normalised
- **L2 (Euclidean)** — absolute distance; common for image embeddings

## Major systems

- **Qdrant** — Rust-based, excellent filtering, open-source
- **Weaviate** — GraphQL API, built-in hybrid search
- **Pinecone** — managed service, serverless tier
- **pgvector** — PostgreSQL extension; good for teams already using Postgres
- **Chroma** — lightweight, great for prototyping

## Metadata filtering

Production RAG systems almost always filter by metadata (date range, document type, user permissions) before or during vector search — not after. Pre-filtering reduces the search space; post-filtering wastes compute.

See also: [[Retrieval-Augmented Generation]], [[Embedding Models]]`,
  },
  {
    slug: 'prompt-engineering',
    title: 'Prompt Engineering',
    date: '2024-02-29',
    body: `# Prompt Engineering

Prompt engineering is the practice of designing inputs to language models to reliably elicit desired outputs. It is part craft, part empirical science.

## Fundamental techniques

### Zero-shot prompting

Simply describe the task without examples:

\`\`\`
Classify the sentiment of the following review as Positive, Negative, or Neutral.

Review: "The product arrived damaged and support was unhelpful."
Sentiment:
\`\`\`

### Few-shot prompting

Provide 2–5 input/output examples before the actual query. Dramatically improves performance on classification and extraction tasks.

### Chain-of-thought (CoT)

Instruct the model to reason step-by-step before answering. Append *"Let's think step by step"* or provide CoT examples:

\`\`\`
Q: A train travels 60 km/h for 2.5 hours. How far does it go?
A: Let's think step by step.
   Distance = speed × time
   Distance = 60 × 2.5 = 150 km
   Answer: 150 km
\`\`\`

## Structured output

Request JSON directly and validate with a schema:

\`\`\`python
prompt = """
Extract the following fields from the email and return valid JSON:
{ "sender": string, "subject": string, "urgency": "high"|"medium"|"low" }

Email: {email_text}
"""
\`\`\`

## System prompts

In chat models, the system prompt sets persistent instructions, persona, and constraints. Keep it focused: long, contradictory system prompts degrade performance.

## Common failure modes

| Problem | Likely cause | Fix |
|---|---|---|
| Hallucination | No grounding | Add retrieved context (RAG) |
| Instruction drift | Long conversation | Summarise or re-inject system prompt |
| Inconsistent format | Ambiguous spec | Show exact output example |
| Sycophancy | Confirmation bias | Ask model to steelman opposing view |

## Meta-prompting

Use the model to improve its own prompts. Provide a draft prompt and ask: *"What's missing or ambiguous in these instructions?"*

See also: [[Retrieval-Augmented Generation]], [[Fine-tuning Large Language Models]], [[Evaluation and Benchmarking]]`,
  },
  {
    slug: 'embedding-models',
    title: 'Embedding Models',
    date: '2023-09-04',
    body: `# Embedding Models

Embedding models convert text (or other modalities) into dense numerical vectors that capture semantic meaning. Similar content maps to nearby points in the embedding space.

## How they work

A sentence like *"the bank approved the loan"* is tokenised, passed through a transformer encoder, and the output is pooled into a single fixed-length vector (e.g. 1536 dimensions for \`text-embedding-3-large\`).

## Popular models

| Model | Dimensions | Context | Best for |
|---|---|---|---|
| text-embedding-3-large | 1536 | 8191 tokens | General retrieval |
| text-embedding-3-small | 1536 | 8191 tokens | Cost-sensitive apps |
| BGE-M3 | 1024 | 8192 tokens | Multilingual |
| E5-mistral-7b | 4096 | 32k tokens | Long documents |
| Cohere Embed v3 | 1024 | 512 tokens | Reranking |

## Matryoshka embeddings

Models trained with Matryoshka Representation Learning (MRL) can be truncated to smaller dimensions without retraining. The first 256 dimensions of a 1536-dim MRL vector are still meaningful — enabling storage/latency trade-offs.

\`\`\`python
from openai import OpenAI

client = OpenAI()
response = client.embeddings.create(
    model="text-embedding-3-large",
    input="quantum entanglement explained simply",
    dimensions=512  # truncate to 512 dims
)
embedding = response.data[0].embedding  # len == 512
\`\`\`

## Chunking strategy matters

The embedding model sees the chunk, not the whole document. Poor chunking — splitting mid-sentence, including boilerplate headers — degrades retrieval quality more than model choice.

**Rules of thumb:**
- 512 tokens with 10% overlap is a safe starting point
- Split on paragraph or section boundaries, not fixed tokens
- Embed the query with the same model used for indexing

## Evaluating embeddings

Use the MTEB (Massive Text Embedding Benchmark) leaderboard to compare models across retrieval, clustering, classification, and STS tasks. Always evaluate on your domain — generic benchmarks may not reflect production performance.

See also: [[Vector Databases]], [[Retrieval-Augmented Generation]]`,
  },
  {
    slug: 'ai-agents-and-tools',
    title: 'AI Agents and Tool Use',
    date: '2024-07-11',
    body: `# AI Agents and Tool Use

An AI agent is an LLM that can take actions — calling APIs, running code, searching the web, or interacting with external systems — in a loop until a goal is achieved.

## The agent loop

\`\`\`
while not done:
    thought = llm.think(goal, history, available_tools)
    if thought.is_final_answer:
        return thought.answer
    result = execute_tool(thought.tool, thought.args)
    history.append(result)
\`\`\`

## Tool calling

Modern LLMs expose a structured tool-use API. The model returns a JSON object describing which tool to call and with what arguments:

\`\`\`python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the internet for current information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)
\`\`\`

## Agent architectures

### ReAct

Interleaves Reasoning and Acting: the model alternates between *"Thought:"* and *"Action:"* traces before producing a final answer.

### Plan-and-execute

A planner LLM decomposes the goal into subtasks; executor agents handle each in parallel.

### Multi-agent systems

Separate specialist agents (researcher, critic, writer) collaborate under an orchestrator. Increases capability but adds coordination complexity and cost.

## Reliability challenges

| Problem | Mitigation |
|---|---|
| Infinite loops | Max step limit, loop detection |
| Wrong tool selection | Better tool descriptions, examples |
| Hallucinated tool args | Schema validation, retry |
| Cost overrun | Budget limits per session |

## Memory

- **In-context** — recent conversation in the prompt window
- **External** — past interactions stored in a vector DB and retrieved
- **Episodic** — structured summaries of past sessions

See also: [[Prompt Engineering]], [[Retrieval-Augmented Generation]], [[Large Language Models]]`,
  },
  {
    slug: 'model-quantization',
    title: 'Model Quantization',
    date: '2023-12-01',
    body: `# Model Quantization

Quantization reduces the numerical precision of model weights and activations to lower memory usage and increase inference speed. It is the primary technique for running large models on consumer hardware.

## Why it works

LLM weights are typically stored as 32-bit or 16-bit floats. Quantization maps these to 8-bit integers (INT8) or lower with minimal accuracy loss because weight distributions are relatively smooth.

## Precision formats

| Format | Bits per weight | Memory (7B model) | Notes |
|---|---|---|---|
| FP32 | 32 | 28 GB | Training standard |
| BF16 / FP16 | 16 | 14 GB | Inference default |
| INT8 | 8 | 7 GB | Negligible accuracy loss |
| NF4 / INT4 | 4 | 3.5 GB | QLoRA range |
| INT2 | 2 | ~1.75 GB | Significant degradation |

## Post-training quantization (PTQ)

Applied after training without retraining. Fast but may degrade accuracy on outlier-sensitive layers.

\`\`\`python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,  # QLoRA
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    quantization_config=quantization_config,
    device_map="auto",
)
\`\`\`

## Quantization-aware training (QAT)

Simulates low-precision arithmetic during training, yielding better accuracy at a given bit-width than PTQ. Requires retraining — feasible only for smaller models or with PEFT.

## GGUF and llama.cpp

The GGUF format (used by llama.cpp) stores quantized weights in a portable binary format optimised for CPU inference. Quantization levels from Q2_K to Q8_0 give a clear accuracy/size trade-off.

\`\`\`bash
# Run a 4-bit quantized Llama 3 locally
./llama-cli -m llama-3-8b-q4_k_m.gguf -p "Explain backpropagation" -n 256
\`\`\`

See also: [[Fine-tuning Large Language Models]], [[Large Language Models]], [[Transformer Architecture]]`,
  },
  {
    slug: 'multimodal-models',
    title: 'Multimodal AI Models',
    date: '2024-04-18',
    body: `# Multimodal AI Models

Multimodal models process and generate across multiple data types — text, images, audio, and video — within a single architecture. They represent the convergence of computer vision and natural language processing.

## Vision-language models (VLMs)

VLMs accept images alongside text prompts. A visual encoder (e.g. CLIP ViT) converts the image into patch embeddings, which are projected into the LLM's token space.

\`\`\`
Input: [image_patches] + [text_tokens]
         ↓                    ↓
    Visual encoder       Text embedding
         ↓                    ↓
    Projection layer          |
         └──────────┬─────────┘
                    ↓
              Transformer LLM
                    ↓
              Text output
\`\`\`

## Capabilities

| Task | Example |
|---|---|
| Visual QA | "How many people are in this photo?" |
| OCR + reasoning | "What does the chart show about Q3?" |
| Document understanding | Extract fields from a scanned invoice |
| Image captioning | Generate alt text at scale |
| Code from screenshot | Convert a UI mockup to HTML |

## Notable models

- **GPT-4o** — text, image, audio in a single unified model
- **Claude 3.5** — strong document and chart understanding
- **Gemini 1.5 Pro** — 1M token context, native video understanding
- **LLaVA / BakLLaVA** — open-source VLMs for local deployment
- **Whisper** — audio-to-text transcription from OpenAI

## Challenges

**Hallucination in vision tasks** is more severe than in text — models confidently describe objects that aren't present. Always validate VLM outputs for safety-critical applications.

**Token cost** — a single 1024×1024 image consumes ~1700 tokens in most APIs. Long-context video is extremely expensive.

## Audio models

- **Speech-to-text** — Whisper-class models achieve near-human WER
- **Text-to-speech** — ElevenLabs, OpenAI TTS, Bark
- **Speech-to-speech** — end-to-end voice agents without intermediate transcription

See also: [[Transformer Architecture]], [[Large Language Models]], [[AI Agents and Tool Use]]`,
  },
  {
    slug: 'ai-evaluation-benchmarks',
    title: 'AI Evaluation and Benchmarks',
    date: '2024-06-03',
    body: `# AI Evaluation and Benchmarks

Rigorous evaluation is the hardest unsolved problem in AI development. Models that score well on benchmarks frequently fail in production, and benchmarks that were hard last year are often saturated today.

## Standard benchmarks

| Benchmark | Domain | Metric |
|---|---|---|
| MMLU | General knowledge (57 subjects) | Accuracy |
| HumanEval | Python code generation | pass@k |
| GSM8K | Grade-school math | Accuracy |
| HellaSwag | Commonsense reasoning | Accuracy |
| MBPP | Broader coding tasks | pass@k |
| MTEB | Text embeddings | Avg score across 56 tasks |
| MMMU | Multimodal understanding | Accuracy |

## Benchmark contamination

A critical concern: frontier models are trained on large internet corpora that may include benchmark test sets. A model scoring 90% on MMLU might have "seen" the questions during training.

> Treat published benchmark scores as an upper bound, not ground truth.

## LLM-as-judge

Using a powerful LLM (e.g. GPT-4o) to evaluate another model's outputs at scale. Cheap and fast but inherits the judge model's biases:

\`\`\`python
def llm_judge(question, model_answer, reference_answer, judge_llm):
    prompt = f"""
    Question: {question}
    Reference answer: {reference_answer}
    Model answer: {model_answer}

    Rate the model answer on correctness (1-5) and explain your rating.
    Respond as JSON: {{"score": int, "reason": str}}
    """
    return judge_llm.generate(prompt)
\`\`\`

## Building task-specific evals

For production systems, custom evals on representative samples of real queries are more valuable than any public benchmark:

1. Collect 200–500 real user queries
2. Create gold-standard answers (human or GPT-4o labelled)
3. Define metrics: exact match, semantic similarity, factuality
4. Run regression on every model or prompt change

## Red-teaming

Systematic adversarial testing — crafting prompts designed to elicit harmful, biased, or incorrect outputs. Required for safety review before any public deployment.

## Challenges

- **Goodhart's Law** — when a measure becomes a target, it ceases to be a good measure
- **Static benchmarks** — the internet catches up; today's hard benchmark is tomorrow's training data
- **Multidimensional quality** — accuracy, latency, cost, safety, and user satisfaction rarely all move in the same direction

See also: [[Large Language Models]], [[Prompt Engineering]], [[Fine-tuning Large Language Models]]`,
  },
];

const seed = db.transaction(() => {
  for (const a of articles) {
    const ts = new Date(a.date).toISOString().replace('T', ' ').slice(0, 19);
    insert.run(a.slug, a.title, a.body, ts, ts);
    console.log('  +', a.title);
  }
});

console.log('Seeding 10 AI articles…');
seed();
console.log('Done.');
