# PROJECT 2 — PepsiCo Global: Merchant Portal (Sales, Inventory & Store Operations Platform)

**Role:** Senior Software Development III · **Duration:** 10/2021 – 05/2024  
**Stack:** React.js, Next.js, Node.js, TypeScript, Microfrontends (Module Federation), Microservices, Kafka, Azure (Blob Storage, AKS), Redis, MongoDB/SQL, Jest, React Testing Library

## 30-Second Elevator Pitch

> "At PepsiCo I worked on the merchant platform — the portal store owners and merchandisers use to manage which PepsiCo items they stock, track inventory, and see near-real-time sales data. It was built as microfrontends over Node.js microservices. I owned the item/inventory management experience end to end, built the real-time sales/inventory integration, and designed a Node.js pipeline that generated and stored 500,000 store- and department-level PDF reports into Azure Blob Storage, fed by Kafka streaming. I also built the merchant feedback loop that drove a 40% improvement in merchant satisfaction scores."

## Business Context (the "why")

- PepsiCo sells through hundreds of thousands of retail stores. Merchants/store managers need to: choose which items to stock for *their* store, manage inventory (add, remove, reduce quantities), see what's selling, and get printable store/department reports (order guides, planogram/price sheets).
- Before: item selection was driven by stale batch data — merchants picked items without knowing current sales or stock, leading to over-ordering slow movers and stockouts on fast movers. Reports were generated ad hoc and slowly.

## Architecture (end to end)

```
Merchant browser
   │
   ▼
Shell app (Next.js host) — Microfrontends via Module Federation:
   ├── MFE: Item Catalog & Selection   (my primary ownership)
   ├── MFE: Inventory Management       (my primary ownership)
   ├── MFE: Sales Dashboard
   └── MFE: Reports & Downloads
   │
   ▼
API layer (Node.js BFF per domain) → Microservices on Azure (AKS):
   ├── Item Service ──────────── product master data (SQL)
   ├── Inventory Service ─────── store-level stock (MongoDB)
   ├── Sales Ingestion Service ─ consumes POS/sales events from Kafka
   └── PDF Generation Service ── Kafka consumer → renders PDFs → Azure Blob
   │
   ▼
Kafka topics: sales-events, inventory-updates, report-requests
Azure Blob Storage: generated PDFs (500K store/department documents)
Redis: hot store-level aggregates for the dashboard
```

**Key design decisions to defend:**

1. **Microfrontends (Module Federation).** Four+ teams shipping into one portal. MFEs let each domain team deploy independently — item catalog could release daily without coordinating with the sales dashboard team. Shell app owned auth, navigation, shared design system; each MFE was independently built, tested, and deployed. Tradeoffs I'll admit to: shared-dependency version management and consistent UX take real governance (we ran a shared component library and a federation contract).
2. **Real-time sales/inventory via Kafka, not polling.** POS/sales data streamed as events; the Sales Ingestion Service maintained per-store aggregates in Redis/DB. So when a merchant opened item selection, they saw *current* velocity and stock — that's what made item selection actually smarter.
3. **The 500K PDF pipeline as an async, Kafka-driven batch system** (see deep-dive #1).

## Your Role Specifically

- Owned the **item & inventory management** microfrontend and its backing services end to end: add/remove/reduce items, maintain store inventory, with optimistic UI + reconciliation.
- Designed and built the **PDF generation service** (the 500K documents story).
- Built the **merchant feedback loop**: in-context feedback widget → events → dashboard for product owners → fed the roadmap. Tied to the 40% merchant-satisfaction improvement.
- Testing: Jest + RTL suites for the MFEs; contract tests between shell and MFEs.

## Deep-Dive Story #1 — Generating 500,000 PDFs into Azure Blob (your signature story)

**S:** Every store needs department-level printed documents (order guides / price & item sheets). ~hundreds of thousands of store-department combinations ≈ 500K PDFs per generation cycle. The naive approach — generate on request — took too long per document and would melt under the batch window.  
**T:** Design a service that generates all 500K PDFs reliably within the batch window, stores them in Azure Blob Storage, and lets merchants download instantly.  
**A:**

1. **Decoupled via Kafka.** An upstream trigger publishes one message per store/department to a `report-requests` topic. This gave free work distribution, backpressure, and retry semantics.
2. **Horizontally scaled consumers.** The PDF service ran as multiple pods (AKS); Kafka partitioning spread the work. Each consumer pulled a message, fetched the store/department data, rendered the PDF, uploaded to Blob Storage with a deterministic path (`/{cycle}/{storeId}/{deptId}.pdf`).
3. **Node.js specifics:** PDF rendering is CPU-bound, which blocks the event loop — so rendering ran in a worker-thread pool, with concurrency capped per pod; streamed the PDF buffer directly to Azure Blob (no temp files on disk).
4. **Idempotency & failure handling:** deterministic blob paths made regeneration safe (overwrite, not duplicate); failed messages went to a retry topic then a DLQ with alerting; a completion tracker (counts per cycle) told us when a cycle was done and what failed.
5. **Download path:** merchants got a link that resolved to the blob via short-lived SAS URLs — the portal never proxied file bytes.

**R:** Full cycle of 500K PDFs completed reliably within the batch window; downloads became instant (pre-generated, not on-demand); failures self-healed via retries with the DLQ catching true poison messages. Scaling was a Kafka-partition/pod-count knob, not a redesign.

## Deep-Dive Story #2 — Real-time inventory & the item selection improvement

**S:** Merchants selected items with day-old batch data; fast sellers went out of stock and slow items piled up.  
**T:** Surface live sales velocity and current stock inside the item selection flow.  
**A:** Built the integration between the item-selection MFE and the sales/inventory services: Kafka consumers maintained per-store aggregates; the BFF exposed a single composed endpoint per store; the UI showed stock level and sales trend inline on each item card. For inventory edits (add/remove/reduce), used optimistic updates with server reconciliation and conflict handling (last-write-wins with an audit trail, surfaced to the merchant if their edit collided).  
**R:** Item selection went from guesswork to data-driven; combined with the feedback loop, merchant satisfaction scores improved ~40%. Adoption of the item-management flows went up because merchants trusted the numbers.

## Deep-Dive Story #3 — Merchant feedback loop (product-sense story)

**S:** We shipped features but had no structured signal on what merchants actually struggled with.  
**T/A:** Built a lightweight in-context feedback widget in the shell (thumbs + category + optional text) that published events; aggregated into a dashboard for product owners; ran a monthly triage that turned top complaints into backlog items. Several UX fixes (bulk item add, clearer stock indicators) came directly from it.  
**R:** Contributed to the 40% merchant satisfaction improvement — and it's a story showing you think beyond code, about closing the loop with users.

## Metrics to Quote

| Metric | Value |
|---|---|
| PDFs generated & stored per cycle | 500,000 (Azure Blob, Kafka-fed) |
| Merchant satisfaction | +40% improvement |
| Architecture | 4+ independently deployed microfrontends |
| Download latency | On-demand generation → instant (pre-generated + SAS URLs) |

## Likely Interview Questions & Strong Answers

**Q: Why microfrontends? Weren't they overkill?**  
A: The trigger was organizational, not technical: multiple teams on independent release cadences in one portal. MFEs removed deploy coupling. I'd caution against them for a single-team app — the governance cost (shared deps, design consistency, contract testing between shell and MFEs) is real and we paid it deliberately.

**Q: How did you handle CPU-bound PDF rendering in Node.js?**  
A: Node's event loop makes it great at I/O and terrible at CPU-bound work on the main thread. We moved rendering into a worker-thread pool with bounded concurrency per pod, kept the Kafka consumer loop non-blocking, and scaled horizontally across pods. Backpressure came naturally from Kafka — consumers only pull what they can process.

**Q: What if a PDF job fails halfway through the 500K?**  
A: Everything is idempotent — deterministic blob paths mean re-processing a message just overwrites. Retry topic for transient failures, DLQ + alert for poison messages, and a per-cycle completion tracker so we know exactly which store/departments are missing instead of re-running everything.

**Q: MongoDB for inventory but SQL for items — why?**  
A: Item master data is relational and consistency-critical (categories, pricing relationships) — SQL. Store-level inventory is high-write, document-shaped, per-store partitioned data where flexible schema helped — MongoDB fit. Polyglot persistence chosen per access pattern, not preference.

**Q: How do MFEs share state (e.g., logged-in user, selected store)?**  
A: Shell owned auth and global context (selected store), exposed via a small event-bus/props contract to MFEs. We deliberately kept shared state minimal — the more MFEs share, the more you rebuild the monolith with extra steps.
