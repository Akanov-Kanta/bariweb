# RAG Pipeline — DOM Extraction, Enrichment, Embeddings & Retrieval API

This module is the **RAG-engineering** component of the Autonomous Digital Inclusion Proxy.  
It gives the AI agent "vision" over website structure by extracting, normalizing, enriching, embedding, and retrieving interactive DOM elements through a REST API.

## Current Status

| Step | Description | Status |
|------|-------------|--------|
| **Step 1** | DOM Extraction Foundation | ✅ Complete |
| **Step 2** | Semantic Enrichment & Retrieval Preparation | ✅ Complete |
| **Step 3** | Embedding Generation & Vector Indexing | ✅ Complete |
| **Step 4** | Retrieval API Service Layer | ✅ Complete |
| **Step 5** | Milvus / RAGFlow Integration | 🔲 Next |

---

## Quick Start

### 1. Create a virtual environment (recommended)

```bash
cd rag-pipeline
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
playwright install chromium
```

### 3. Set the embeddings API key

```bash
export ALEM_EMBEDDINGS_API_KEY=sk-...
```

### 4. Run Step 1 — Extract DOM from a page

```bash
python main.py https://example.com
```

Output: `results/<filename>.json`

### 5. Run Step 2 — Enrich extracted records

```bash
python enrich.py results/*.json
```

Output: `results_enriched/<filename>_enriched.json`

### 6. Run Step 3 — Build vector index

```bash
python demo_index.py
```

Output: `index/combined_index.json`

### 7. Run Step 4 — Start the retrieval API

```bash
python run_server.py
```

API docs: http://localhost:8001/docs

### 8. Query the API

```bash
# Health check
curl http://localhost:8001/health

# Semantic search
curl -X POST http://localhost:8001/search \
  -H "Content-Type: application/json" \
  -d '{"query": "search Wikipedia", "top_k": 3}'

# Look up a specific element
curl http://localhost:8001/elements/<element_id>

# Reindex enriched files
curl -X POST http://localhost:8001/index \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 9. Run tests

```bash
pip install pytest pytest-asyncio
python -m pytest tests/ -v
```

---

## Project Structure

```
rag-pipeline/
├── config.py                          # Central configuration
├── requirements.txt                   # Python dependencies
├── run_server.py                      # API server launcher
│
├── extraction/                        # Step 1: DOM extraction
│   ├── browser.py                     # Playwright page loading & lifecycle
│   ├── extractor.py                   # Raw DOM element extraction
│   └── normalizer.py                  # Schema enforcement & deduplication
│
├── enrichment/                        # Step 2: Semantic enrichment
│   ├── schema.py                      # Enriched record schema definition
│   ├── normalizer_helpers.py          # Text cleaning & URL utilities
│   ├── action_classifier.py           # Heuristic action-type classification
│   ├── context_builder.py             # Context summary & label extraction
│   ├── keyword_generator.py           # Keyword expansion with synonyms
│   ├── semantic_text_builder.py       # semantic_text & retrieval_text generation
│   ├── intent_resolver.py             # Candidate user intent derivation
│   └── pipeline.py                    # Enrichment pipeline orchestrator
│
├── embeddings/                        # Step 3: Embedding & indexing
│   ├── text_builder.py                # Builds embedding text from enriched records
│   ├── client.py                      # Alem embeddings API client
│   ├── schema.py                      # IndexedRecord dataclass
│   ├── indexer.py                     # Indexing pipeline (embed → store)
│   └── retriever.py                   # Semantic search service
│
├── vectorstore/                       # Pluggable vector storage
│   ├── base.py                        # Abstract interface + SearchResult
│   └── local_store.py                 # MVP backend (NumPy cosine similarity)
│
├── api/                               # Step 4: REST API service
│   ├── schemas.py                     # Pydantic request/response models
│   ├── service.py                     # RetrievalService business logic
│   ├── routes.py                      # FastAPI route handlers
│   └── app.py                         # Application factory
│
├── output/                            # Output handling
│   └── saver.py                       # Save records to JSON files
│
├── main.py                            # CLI entry — Step 1 (extraction)
├── enrich.py                          # CLI entry — Step 2 (enrichment)
├── demo_index.py                      # CLI entry — Step 3 (indexing)
├── demo_search.py                     # CLI entry — Step 3 (search demo)
│
├── results/                           # Step 1 output (raw JSON)
├── results_enriched/                  # Step 2 output (enriched JSON)
├── index/                             # Step 3 output (vector index)
│
└── tests/                             # Test suite (70 tests)
    ├── test_extractor.py              # Step 1 tests
    ├── test_enrichment.py             # Step 2 tests
    ├── test_step3.py                  # Step 3 tests
    └── test_step4.py                  # Step 4 tests
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service status, record count, backend name |
| `POST` | `/search` | Semantic search over indexed DOM elements |
| `POST` | `/index` | Index enriched JSON files into the vector store |
| `GET` | `/elements/{element_id}` | Get full metadata for a specific element |

### Search Request

```json
{
  "query": "find contacts",
  "top_k": 5,
  "min_score": 0.5,
  "action_type": "contact",
  "page_url": "https://example.com",
  "tag": "a"
}
```

All fields except `query` are optional.

### Search Response

```json
{
  "query": "find contacts",
  "top_k": 5,
  "total_matches": 1,
  "search_time_ms": 920.0,
  "matches": [
    {
      "element_id": "el_104",
      "page_url": "/contacts",
      "selector": "a.contact-link",
      "tag": "a",
      "action_type": "contact",
      "semantic_text": "Link to the contacts or support page.",
      "confidence_hint": "high",
      "score": 0.92,
      "href": "/contacts",
      "keywords": ["contact", "support", "email"]
    }
  ]
}
```

---

## Enriched Output Schema

Each enriched element has this structure:

```json
{
  "element_id": "ce9ac5b7ff3fc907",
  "page_url": "https://example.com",
  "tag": "button",
  "text": "Sign In",
  "normalized_text": "sign in",
  "action_type": "login",
  "candidate_intents": ["log into my account", "sign in to the website"],
  "keywords": ["sign", "login", "sign in", "log in", "authentication"],
  "semantic_text": "Button \"Sign In\". Used for authentication / login.",
  "retrieval_text": "Sign In sign in Button login authentication...",
  "confidence_hint": "high",
  "selector": "#btn-login",
  "is_clickable": true,
  "is_form_control": false,
  "context_summary": "Context: Login to your account"
}
```

---

## Supported Action Types

| Action | Examples |
|--------|----------|
| `login` | "Sign In", "Войти", "Кіру" |
| `logout` | "Sign Out", "Выйти" |
| `register` | "Sign Up", "Регистрация" |
| `search` | "Search", "Поиск", "Іздеу" |
| `submit` | "Submit", "Отправить" |
| `contact` | "Contact Us", "Контакты" |
| `support` | "Help", "Поддержка", "Көмек" |
| `purchase` | "Buy Now", "Купить" |
| `navigate` | "Learn More", "Подробнее" |
| `menu` | "Menu", "Меню" |
| `filter` | "Filter", "Фильтр" |
| `close` | "Close", "Закрыть" |
| `cancel` | "Cancel", "Отмена" |
| `delete` | "Delete", "Удалить" |
| `download` | "Download", "Скачать" |
| `upload` | "Upload", "Прикрепить" |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALEM_EMBEDDINGS_API_KEY` | Yes | — | API key for the Alem embeddings service |
| `ALEM_EMBEDDINGS_BASE_URL` | No | `https://llm.alem.ai/v1` | Embeddings API base URL |
| `ALEM_EMBEDDINGS_MODEL` | No | `text-1024` | Embedding model name |

---

## Troubleshooting

### Port Already In Use (Error [Errno 48])
If you see `[Errno 48] error while attempting to bind on address ('0.0.0.0', 8000)`, it means the main backend or another process is already using that port. 

RAG Pipeline now uses **8001** by default. To kill a process on a specific port:

```bash
# Find and kill process on port 8000
lsof -i :8000 -t | xargs kill -9

# Find and kill process on port 8001
lsof -i :8001 -t | xargs kill -9
```
