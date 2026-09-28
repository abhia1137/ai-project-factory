# PROJECT 1 — BCT Consulting: Enterprise B2B Partner & Order Management Platform

**Role:** Senior Software Engineer (Lead) · **Duration:** 06/2024 – Present  
**Stack:** React.js, Next.js, Node.js, TypeScript, GraphQL, PostgreSQL (SQL + pgvector), Redis, Kafka, Docker, Kubernetes, AWS, OpenAI API (GPT), Jest

## 30-Second Elevator Pitch

> "At BCT Consulting I lead development of an enterprise B2B platform where our client's business partners — distributors and vendors — manage orders, catalogs, invoices, and analytics. When I joined, the platform was a set of chatty REST services with dashboards taking 4–6 seconds to load and the database buckling under peak traffic. I led a re-architecture: a GraphQL API layer over Node.js microservices, Redis caching with event-driven invalidation via Kafka, and query-level optimization in PostgreSQL. We cut average query time by ~40% across the key user-facing modules and the platform now comfortably serves millions of requests a day. On top of that foundation I designed and shipped the platform's AI order-intelligence pipeline: partners send purchase orders as PDFs, scans, and emails, and an LLM pipeline extracts structured line items, matches free-text descriptions to catalog SKUs using embeddings, validates everything against the partner's contract pricing, auto-approves clean orders, and routes only the exceptions to humans with the discrepancy flagged. That took most order entry from manual keying to straight-through processing. I also built a smaller LLM-powered partner assistant on the same foundations, and I own code reviews, technical design, and mentoring for the frontend/Node side of the team."

## Business Context (the "why")

- The client (a large enterprise) runs its partner ecosystem — distributors, resellers, vendors — through this portal.
- Partners log in to: place and track **orders**, browse the **product catalog with contract-specific pricing**, download **invoices/statements**, and view **sales analytics dashboards**.
- Pain points before the work: slow dashboards (4–6s), timeouts during month-end peaks (invoice generation + reporting load), and every new UI feature requiring backend changes because REST endpoints were rigid and over/under-fetching.

## Architecture (end to end)

```
Browser (React / Next.js — SSR for landing & catalog pages, CSR for dashboards)
        │
        ▼
Next.js + Node.js BFF layer  ──  GraphQL Gateway (Apollo Server)
        │                              │
        │                    ┌─────────┼──────────┬─────────────┐
        ▼                    ▼         ▼          ▼             ▼
   CDN / static      Order Service  Catalog   Invoice      Analytics
   assets (S3 +      (Node.js)      Service   Service      Service
   CloudFront)            │            │         │             │
                          ▼            ▼         ▼             ▼
                     PostgreSQL   PostgreSQL  PostgreSQL   Read replicas /
                          │            │         │         aggregated tables
                          └──────┬─────┴────┬────┘
                                 ▼          ▼
                              Kafka      Redis
                        (domain events: (cache: pricing,
                         OrderCreated,   catalog, session,
                         PriceUpdated,   dashboard aggregates)
                         InvoiceReady)

AI layer (added 2025):
   Order Intelligence Pipeline (headline AI system)
     Inbound PO (PDF / scan / email / spreadsheet)
       → Ingestion (S3 + Kafka `po-received` event)
       → Extraction Service (Node.js): OCR text layer → GPT structured
         extraction (JSON-schema-constrained output: line items, qty,
         price, dates, PO number) + per-field confidence
       → SKU Matching: item descriptions → embeddings → pgvector
         similarity against catalog + business-rule re-ranking
       → Validation: extracted prices/qty checked against the partner's
         contract pricing via the existing GraphQL/pricing services
       → Decision gate: high-confidence & clean → auto-create order;
         anything below threshold or with discrepancies → human review
         queue (React UI showing source doc + extraction side-by-side)
       → Every human correction is captured as labeled eval data

   Partner AI Assistant (secondary AI feature)
     ├── Function calling → whitelisted GraphQL queries with the
     │   partner's own token (structured questions)
     └── RAG over contract/product docs (pgvector) with citations
         (document questions), streamed via SSE to the chat UI
```

**Key design decisions you should be able to defend:**

1. **GraphQL gateway instead of many REST endpoints.** Dashboards needed data from 3–4 services per screen. With REST, the frontend made 6–8 sequential calls (waterfall). GraphQL lets the client ask for exactly the shape it needs in one round trip; the gateway fans out to services in parallel. Used **DataLoader** to batch and de-duplicate lookups and kill N+1 patterns.
2. **Redis as a read-through cache, invalidated by Kafka events — not TTL guesswork.** Contract pricing and catalog data is read-heavy (thousands of reads per write). Services publish domain events (`PriceUpdated`, `CatalogChanged`) to Kafka; a small consumer invalidates or refreshes the relevant Redis keys. So caches are hot AND correct, instead of choosing between a long TTL (stale prices — unacceptable in B2B contracts) and a short TTL (cache useless).
3. **Kafka for event-driven processing.** Order placement is the write path that must stay fast. On `OrderCreated`, downstream work (invoice generation, notifications, analytics aggregation, ERP sync) happens asynchronously via consumers. The synchronous API only validates + persists the order, so p99 stayed low even at peak.
4. **SQL optimization as the foundation.** Caching hides slow queries; it doesn't fix them. Profiled with `EXPLAIN ANALYZE`, added composite indexes for the top dashboard queries, replaced correlated subqueries with joins/window functions, and moved heavy reporting reads to a read replica with pre-aggregated summary tables (updated by a Kafka consumer).
5. **The LLM extracts and proposes; deterministic code decides.** In the order-intelligence pipeline, the model's only job is turning messy documents into schema-constrained JSON with per-field confidence. Whether an order is actually created is decided by deterministic validation against contract pricing and a confidence threshold — never by the model. This is the design decision to lead with: in a system where a wrong extraction becomes a wrong order, you put the LLM where it's strong (unstructured → structured) and keep it out of the decision path.
6. **Confidence-gated automation with human-in-the-loop.** Below-threshold extractions or price/qty discrepancies go to a review queue where a human sees the source document and the extraction side by side. Every correction becomes labeled eval data, so the threshold could be tightened over time with evidence, not hope. Start conservative (more human review), earn automation.
7. **LLM features built ON the existing API, not beside it.** Both AI systems reuse the platform: validation runs through the same GraphQL/pricing services as the UI, and the assistant's tool calls execute with the partner's own token — so permissions, scoping, and all the performance work (DataLoader, Redis) come for free.
8. **pgvector over a dedicated vector DB.** Catalog embeddings + document chunks were in the tens of thousands to low millions, not billions — PostgreSQL with pgvector kept the stack simple, transactional with the source data, and covered by existing backups/ops. I'd reach for a dedicated vector store only at a scale that justifies another system to operate.

## Your Role Specifically

- Led the technical design for the GraphQL layer and caching strategy; wrote the design docs and ran the review sessions.
- Hands-on: built the Apollo gateway, DataLoader batching, Redis invalidation consumers, and the top three user-facing modules in React/Next.js (orders, catalog, analytics dashboard).
- Designed and built the **order-intelligence pipeline** end to end: document ingestion, GPT structured extraction with schema-constrained output, embedding-based SKU matching, contract validation, the confidence-gated decision logic, the human review UI in React, and the eval harness measuring per-field extraction accuracy.
- Also built the **partner AI assistant** (function calling against GraphQL, RAG over contracts with pgvector, streaming chat UI, golden-set evals) — a smaller feature that reused the same AI foundations.
- Set up testing standards: Jest + React Testing Library for the frontend, integration tests against a dockerized Postgres/Redis for the resolvers.
- Mentoring: onboarded 3 new developers, ran weekly code-review sessions, introduced a PR checklist (performance, accessibility, test coverage) that measurably reduced review back-and-forth.

## Deep-Dive Story #1 — The 40% query-time reduction (your headline metric)

**S:** Partner analytics dashboard took 4–6 seconds; month-end it timed out. Support tickets from top partners were escalating to client leadership.  
**T:** I was asked to own performance end to end and get the dashboard consistently under 2 seconds.  
**A:**

1. **Measured first.** Added timing at each hop (browser → gateway → service → DB). Found ~70% of latency was in the DB layer, and the biggest offender was an N+1: the dashboard fetched 50 partners, then made one pricing query per partner.
2. Fixed N+1 with **DataLoader batching** — 51 queries became 2.
3. `EXPLAIN ANALYZE` showed sequential scans on the orders table for date-range filters; added a composite index on `(partner_id, order_date)` and rewrote a correlated subquery into a window function.
4. Put **Redis** in front of the pricing and aggregate lookups (read-through, Kafka-invalidated). Cache hit rate settled around 90%+.
5. Moved the heaviest month-end reports to a **read replica** with pre-aggregated tables.

**R:** Average query time down ~40% across the key modules; dashboard p95 went from ~5s to well under 2s; month-end timeouts eliminated. The measurement instrumentation stayed and became the team's standard perf dashboard.

## Deep-Dive Story #2 — A hard problem / failure story (interviewers always ask)

**S:** First version of the cache invalidation had a subtle bug: the Kafka consumer invalidated Redis *before* the DB transaction committed in a rare code path, so a concurrent read re-populated the cache with stale data. A partner saw an old contract price for ~an hour.  
**T:** Fix it fast, and make the class of bug impossible.  
**A:** Moved event publishing to *after* commit (transactional outbox pattern — write the event to an `outbox` table in the same transaction, a relay publishes it to Kafka). Added versioning to cache values so a stale write can't overwrite a newer one. Wrote an integration test simulating the race.  
**R:** Zero stale-price incidents since. Great story because it shows: distributed-systems maturity, owning a mistake, and fixing the *class* of bug, not the instance.

## Deep-Dive Story #3 — AI order-intelligence pipeline (your headline AI story)

**S:** A large share of partner purchase orders arrived outside the portal — emailed PDFs, scans, spreadsheets. An operations team keyed them into the system by hand: hours per day of manual entry, a multi-day backlog at month-end, and regular transcription errors (wrong SKUs, wrong quantities, prices that didn't match the partner's contract) that turned into invoice disputes downstream.  
**T:** I proposed and led an LLM pipeline to automate this — with the hard constraint that a wrong extraction becomes a wrong order, so accuracy and controllability mattered more than raw automation rate. Target: straight-through processing for clean POs, human review only for genuine exceptions.  
**A:**

1. **Structured extraction, not free generation.** Inbound documents land in S3 and emit a Kafka event. The extraction service runs the document (OCR text layer for scans) through GPT with **JSON-schema-constrained output**: PO number, dates, line items with quantity and price — plus a per-field confidence signal. The model never writes prose; it fills a schema, which makes output machine-checkable.
2. **SKU matching as a separate stage.** Partners describe products in free text ("24pk cola zero 330ml cans"). Descriptions are embedded and matched against catalog embeddings in **pgvector**, then re-ranked with business rules (partner's order history, pack-size parsing, active-catalog filter). Ambiguous matches lower the line's confidence rather than guessing.
3. **Deterministic validation — the LLM is not in the decision path.** Extracted prices and quantities are validated against the partner's contract pricing through the *existing* GraphQL/pricing services (the same code path the UI uses). The model proposes; plain code decides.
4. **Confidence-gated automation with human-in-the-loop.** Clean, high-confidence orders are auto-created. Anything below threshold — or with a price/quantity discrepancy — goes to a React review queue showing the source document and extraction side by side, with the problem field highlighted. One click to correct and approve. **Every correction is captured as labeled eval data.**
5. **Evals as the control system.** A golden set of real (anonymized) POs — clean ones, ugly scans, multi-page, handwritten-annotation edge cases — with ground-truth extractions. Every prompt or model change runs against it, measuring **per-field precision/recall** (a quantity error is worse than a date error, so fields are weighted). We started with a conservative threshold routing most orders to review, then raised automation as the eval numbers earned it.
6. **Failure handling:** retry topic and DLQ for the pipeline (same Kafka discipline as the rest of the platform); OpenAI outage degrades to the human queue — order intake never stops, it just gets slower.

**R:** The majority of inbound POs now flow straight through with no human touch; the operations team shifted from data entry to exception handling; month-end backlog eliminated; pricing-mismatch disputes caught *before* order creation instead of at invoicing. The correction-feedback loop kept improving match accuracy after launch. This is the story to lead with in AI interviews: high-stakes automation where the engineering is in accuracy, validation, and human-in-the-loop design — not in calling an API.

## Deep-Dive Story #4 — LLM partner assistant (secondary AI story, keep it short)

**S/T:** Partners filed support tickets for questions the platform could already answer ("what did I order last quarter?", "what are my contract's payment terms?"). Built an assistant on the same AI foundations as the pipeline.  
**A:** Two answer paths routed by intent: structured questions use **function calling** against a whitelist of existing GraphQL queries executed with the partner's own token (the model never touches the database and can't escape the partner's permission scope); document questions use **RAG** over contracts/docs (chunked ~500 tokens, embeddings in pgvector, top-k retrieval, answers cite the source and must come only from provided context). Quantitative values always come from the API — the model formats, it doesn't recall. Responses stream over SSE into the React chat UI. Golden set of ~150 real partner questions run on every prompt change; red-teamed for prompt injection in retrieved documents.  
**R:** Meaningful ticket deflection on covered categories and zero cross-partner data leaks — structurally impossible by design, not because the prompt asks nicely. In interviews, mention this one briefly *after* the pipeline: it shows breadth, but the pipeline is the depth.

## Metrics to Quote

| Metric | Value |
|---|---|
| Avg query time reduction | ~40% across key user-facing modules |
| Dashboard p95 | ~5s → <2s |
| Scale | Millions of requests/day |
| Cache hit rate | ~90%+ on pricing/catalog reads |
| AI order pipeline | Majority of inbound POs straight-through processed; month-end entry backlog eliminated; per-field precision/recall evals gating every change |
| AI assistant (secondary) | Function-calling + RAG (pgvector), ~150-question golden eval set, meaningful ticket deflection |
| Team impact | Onboarded 3 devs, PR checklist adopted team-wide |

## Likely Interview Questions & Strong Answers

**Q: Why GraphQL over REST here?**  
A: Not dogma — fit. Multiple frontend views composed data from several services with different shapes; REST forced either chatty waterfalls or bloated bespoke endpoints. GraphQL gave one round trip per screen and let the frontend evolve without backend churn. I'd still pick REST for simple, resource-shaped, cache-at-CDN APIs — and our public webhook-style APIs stayed REST.

**Q: How do you prevent GraphQL performance foot-guns (N+1, expensive queries)?**  
A: DataLoader for batching per request; query depth/complexity limits at the gateway; persisted queries for the production frontend so arbitrary expensive queries can't hit us; per-resolver timing metrics.

**Q: Redis — what did you cache and how did you keep it consistent?**  
A: Read-heavy, slow-changing data: contract pricing, catalog, dashboard aggregates, sessions. Consistency via event-driven invalidation from Kafka rather than TTLs, with the transactional outbox pattern so events only fire after DB commit, plus value versioning as a safety net.

**Q: What happens if Kafka is down?**  
A: Order writes still succeed (outbox table buffers events); consumers catch up when Kafka recovers — that's the point of the outbox. Caches serve slightly stale data with a fallback TTL as a backstop. Degradation is graceful, not an outage.

**Q: How did you measure the 40%?**  
A: Instrumented per-hop timings before touching anything; the 40% is the before/after on average query time for the top user-facing modules, measured over comparable traffic windows. I always establish the baseline first — otherwise "optimization" is storytelling.

**Q: A wrong extraction creates a wrong order — how do you make an LLM safe in that path?**  
A: By never letting the model make the decision. It converts documents into schema-constrained JSON with per-field confidence; deterministic code validates every value against the partner's contract via the same pricing services the UI uses, and only clean, high-confidence orders auto-create. Everything else goes to a human review queue with the discrepancy highlighted. The model does the part it's good at — unstructured to structured — and stays out of the part where being wrong costs money.

**Q: How did you measure extraction accuracy?**  
A: A versioned golden set of real anonymized POs with ground-truth extractions — clean digital PDFs through ugly scans and multi-page edge cases. Per-field precision and recall, weighted by business impact (a quantity error is worse than a date error). Every prompt or model change runs against it and regressions block the change. Production corrections from the review queue feed new eval cases, so the set grows where the pipeline actually fails.

**Q: How did you decide the auto-approve threshold?**  
A: Empirically and conservatively. Launched with a low threshold so most orders went to human review, measured false-accept and false-reject rates against reviewer decisions, and raised automation only as the eval data justified it. The framing I use: automation rate is earned by evidence, not set by ambition.

**Q: How does SKU matching work when partners write "24pk cola zero cans"?**  
A: Embedding similarity against catalog items in pgvector gets candidates; business-rule re-ranking (the partner's own order history, pack-size parsing, active-catalog filters) picks the winner. If the top candidates are too close together, we don't guess — the line's confidence drops and a human confirms. Matching accuracy improved over time because every human correction became training/eval signal.

**Q: How do you stop the LLM from hallucinating?**  
A: Architecturally, not just with prompts. In the pipeline, output is JSON-schema-constrained and every value is validated against contract data before it's used. In the assistant, quantitative answers always come from the GraphQL API via function calling, and document answers are RAG-grounded with citations and an "answer only from provided context" contract. You can't eliminate hallucination in free generation, so we constrained where free generation is allowed — then verified with golden-set evals on every change.

**Q: How do you secure LLM features in a multi-tenant B2B app?**  
A: The model never gets credentials or DB access. Pipeline validation and assistant tool calls run through the existing GraphQL API scoped to the specific partner, so row-level authz is the same layer as the normal UI. RAG retrieval filters by partner ID before similarity search, and retrieved documents are treated as untrusted input (prompt-injection filtering, output validation).

**Q: Why OpenAI's API rather than self-hosting a model?**  
A: Time-to-value and quality — the value was in the pipeline engineering and grounding, not the model weights. The LLM sits behind a thin provider-agnostic interface, so we swapped and A/B-tested models (cheaper models where accuracy allowed). I'd revisit self-hosting for data-residency requirements or if token costs at scale demanded it.

**Q: What happens if OpenAI is down?**  
A: The pipeline degrades to the human review queue — order intake never stops, it just gets slower; Kafka buffers the backlog and the pipeline catches up on recovery. The assistant shows a graceful unavailable state. An LLM provider is a dependency like any other: circuit breakers, timeouts, and a defined degraded mode.
