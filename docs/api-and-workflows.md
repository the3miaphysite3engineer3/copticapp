# API, AI, and Data Workflows

This document outlines the technical details for Coptic Compass's AI capabilities, OCR ingestion, RAG, grammar data workflows, and the public API.

## AI, OCR, and RAG

The repository includes a production-integrated AI workflow called Shenute AI, plus a server-side OCR proxy and admin-facing RAG ingestion tools.

### Shenute API (`/api/shenute`)

- Endpoint: `POST /api/shenute`
- Default provider: `thoth`
- Supported providers: `thoth`, `openrouter`, `gemini`, `hf`
- Payload style: AI SDK UI messages
- Runtime behavior:
  - provider selection from request body (`inferenceProvider`)
  - retry/fallback for transient failures
  - fallback path when Hugging Face is rate-limited

### THOTH AI Credits

THOTH AI is credited to Dr. So Miyagawa (Associate Professor of Linguistics and Egyptology, University of Tsukuba). His research integrates computational linguistic methods with traditional philological approaches.

- Contact: miyagawa.so.kb@u.tsukuba.ac.jp
- Reference: https://somiyagawa.github.io/THOTH.AI/

Technical Specifications:

- Platform: Dify
- Base LLM: Claude 4.5 Sonnet (upgraded from 3.5)
- Architecture: RAG (Retrieval Augmented Generation)

Knowledge Base:

- Comprehensive Coptic Lexicon v1.2 (2020)
- Burns, D., Feder, F., John, K., Kupreyev, M., et al. (Freie Universitat Berlin)
- A Concise Dictionary of Middle Egyptian (1962) - Raymond Oliver Faulkner
- Custom instruction prompts (500 plus lines)

This list documents THOTH AI's external knowledge context. The Coptic Compass runtime dictionary is the normalized JSON dataset described below, not the historical XML source file.

### OCR Proxy (`/api/ocr`)

- Endpoint: `POST /api/ocr`
- Expected input: `multipart/form-data`
- Proxy flow:
  - client uploads file to `/api/ocr`
  - app forwards to `OCR_SERVICE_URL`
  - upstream body and content-type are returned to client
- Optional controls:
  - query `?lang=<code>` (for example `cop`)
  - `OCR_UPLOAD_FIELD` to match upstream form-field conventions

### Admin RAG Ingestion (`/api/admin/rag/*`)

- Ingestion endpoint: `POST /api/admin/rag/ingest`
- Status endpoint: `GET /api/admin/rag/status`
- Logs endpoint: `GET /api/admin/rag/logs`
- JSON source ingestion: `POST /api/admin/rag/ingest-json-sources`
- Supported file types: PDF, image, DOCX, text-like formats
- Processing pipeline:
  - extract text (native parser + OCR when enabled)
  - verify/reconcile PDF native extraction vs OCR output
  - chunk with overlap
  - generate embeddings via selected provider
  - normalize embedding dimensions for DB compatibility
  - insert into `public.coptic_documents`

### Embedding Dimensions

There are two separate dimension concepts:

- Source embedding dimension: what the provider/model returns.
- Storage vector dimension: what `public.coptic_documents.embedding` expects.

Current model defaults in this project:
| Provider | Model | Source Dimension |
| ------------ | ------------------------------------------- | ---------------------------------- |
| Gemini | `gemini-embedding-2-preview` | `3072` (configured output default) |
| Hugging Face | `sentence-transformers/all-mpnet-base-v2` | `768` |
| OpenRouter | `nvidia/llama-nemotron-embed-vl-1b-v2:free` | `2048` |

Current DB target:

- `RAG_VECTOR_DIMENSIONS=768`

Implementation notes:

- Ingestion reconciles source dimensions to `RAG_VECTOR_DIMENSIONS` before DB insert.
- If the DB reports a different expected `vector(N)` size, ingestion can auto-adapt and retry.

## Data Workflows

### Grammar

Grammar lesson source files live under `src/content/grammar`. They are exported into public JSON files used by the site and API.

```bash
npm run data:grammar:export
```

The export writes to `public/data/grammar/v1` and also runs automatically before production builds.

### Dictionary

The public dictionary currently ships from the normalized checked-in dataset at `public/data/dictionary.json`.

Runtime dictionary data should stay structured and app-facing: dialect forms, meanings, Greek equivalents, plural forms, entry relations, etymology, part of speech, and gender. Raw/source-only text fields, attestations, and source notes are intentionally not part of the runtime payload.

Primary app surfaces:

- `/en/dictionary` and `/nl/dictionary` for localized search and browsing.
- `/en/entry/<id>` and `/nl/entry/<id>` for canonical localized entry pages.

Dictionary API surfaces:

- `/api/v1/dictionary/search?q=<query>` for paginated search.
- `/api/v1/dictionary/search-index` for the reduced client/search index.

## Public APIs

The repository exposes read-only public grammar and dictionary datasets.

Grammar entry points:

- `/api/v1/grammar`
- `/api/v1/grammar/manifest`
- `/api/v1/grammar/lessons`
- `/api/v1/grammar/concepts`
- `/api/v1/grammar/examples`
- `/api/v1/grammar/exercises`
- `/api/v1/grammar/footnotes`
- `/api/v1/grammar/sources`

Dictionary entry points:

- `/api/v1/dictionary/search`
- `/api/v1/dictionary/search-index`

Docs and developer pages:

- `/api-docs`
- `/api/openapi.json` for the combined public OpenAPI document covering grammar, dictionary, Shenute AI, and OCR
- `/en/developers`
- `/nl/developers`

Additional app API surfaces:

- `/api/shenute`
- `/api/ocr`
- `/api/admin/rag/status`
- `/api/admin/rag/logs`
- `/api/admin/rag/ingest`
- `/api/admin/rag/ingest-json-sources`

## Troubleshooting

### Admin dashboard shows submission/database errors

Symptoms: pending submissions count falls back to `0`, submissions section shows setup/database warning.
Checks:

- apply latest Supabase migrations (`npm run db:push`)
- verify `submissions` schema is up to date (including soft-delete support)
- verify admin account/role and session are valid

### RAG insert fails with vector dimension mismatch

Example: `Failed to insert document chunks: expected 768 dimensions, not 2048`
Checks:

- confirm `RAG_VECTOR_DIMENSIONS` matches your DB column (`vector(768)` by default)
- confirm source model dimension for your selected provider
- keep one vector table per target dimension in production if you want strict no-reprojection indexing

### OCR errors or empty extraction

Checks:

- verify `OCR_SERVICE_URL`
- set `OCR_UPLOAD_FIELD` if upstream expects non-default form field names
- test OCR endpoint directly: `POST /api/ocr?lang=cop` with a sample image/PDF

### Local dev server repeatedly exits

Checks:

- ensure Node version matches `.nvmrc` and `package.json` engines (`>=22.13.0 <23`)
- remove stale lock file (`.next/dev/lock`) and restart
- run focused lint/type checks for touched files when Turbopack output is noisy
