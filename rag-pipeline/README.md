# RAG Pipeline — DOM Extraction & Semantic Enrichment

This module is the **RAG-engineering** component of the Autonomous Digital Inclusion Proxy.  
It gives the AI agent "vision" over website structure by extracting, normalizing, enriching, and indexing DOM elements.

## Current Status

| Step | Description | Status |
|------|-------------|--------|
| **Step 1** | DOM Extraction Foundation | ✅ Complete |
| **Step 2** | Semantic Enrichment & Retrieval Preparation | ✅ Complete |
| **Step 3** | Embedding Generation | 🔲 Next |
| **Step 4** | Vector Indexing (Milvus) | 🔲 Planned |
| **Step 5** | Retrieval API & Orchestrator Integration | 🔲 Planned |

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

### 3. Run Step 1 — Extract DOM from a page

```bash
python main.py https://example.com
```

Output: `results/<filename>.json`

### 4. Run Step 2 — Enrich extracted records

```bash
# Enrich a single file
python enrich.py results/example_com_root_2026-03-29T11-40-28.json

# Enrich multiple files
python enrich.py results/*.json
```

Output: `results_enriched/<filename>_enriched.json`

### 5. Run tests

```bash
pip install pytest pytest-asyncio
python -m pytest tests/ -v
```

---

## Project Structure

```
rag-pipeline/
├── config.py                          # Central configuration
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
├── output/                            # Output handling
│   └── saver.py                       # Save records to JSON files
│
├── main.py                            # CLI entry — Step 1 (extraction)
├── enrich.py                          # CLI entry — Step 2 (enrichment)
├── requirements.txt                   # Python dependencies
├── results/                           # Step 1 output (raw JSON)
├── results_enriched/                  # Step 2 output (enriched JSON)
└── tests/                             # Test suite
    ├── test_extractor.py              # Step 1 tests
    └── test_enrichment.py             # Step 2 tests
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
  "label_text": null,
  "aria_label": null,
  "placeholder": null,
  "title": null,
  "alt": null,
  "href": null,
  "role": null,
  "input_type": null,
  "selector": "#btn-login",
  "xpath": "/html/body/form/button",
  "is_clickable": true,
  "is_form_control": false,
  "raw_context": "Login to your account",
  "context_summary": "Context: Login to your account",
  "action_type": "login",
  "candidate_intents": [
    "log into my account",
    "sign in to the website",
    "enter my credentials",
    "access my account",
    "press the \"Sign In\" button"
  ],
  "keywords": ["sign", "login", "sign in", "log in", "enter account", "authentication"],
  "semantic_text": "Button \"Sign In\". Used for authentication / login. Context: Login to your account",
  "retrieval_text": "Sign In sign in Button login authentication / login sign login sign in log in enter account authentication Context: Login to your account",
  "confidence_hint": "high",
  "notes": ""
}
```

### Key Enriched Fields

| Field | Purpose |
|-------|---------|
| `action_type` | Heuristic classification (login, search, contact, etc.) |
| `semantic_text` | Human-readable description for future embeddings |
| `retrieval_text` | Dense text for search indexing |
| `candidate_intents` | Phrases a user might say to trigger this element |
| `keywords` | Expanded keyword / synonym list |
| `confidence_hint` | Heuristic confidence level (low/medium/high) |
| `context_summary` | Where the element lives on the page |
| `is_clickable` | Whether the user can click this element |
| `is_form_control` | Whether this is a form field to fill in |

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

## Element Types Extracted

- `<button>`, `<a>`, `<input>`, `<textarea>`, `<select>`
- `<form>`, `<label>`
- Any element with `aria-label`, `role`, `placeholder`, `title`, or `alt` attributes
