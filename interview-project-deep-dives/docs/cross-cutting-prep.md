# Cross-Cutting Prep

## Common threads you can draw between both projects

- **Kafka in both**, but for different purposes: BCT = cache invalidation + async order workflows; PepsiCo = streaming ingestion + batch work distribution. Saying this shows you understand Kafka as a tool, not a buzzword.
- **Measure before optimizing** (BCT instrumentation story) and **design for failure** (outbox, DLQ, idempotency).
- **Frontend + backend + infra ownership** — true full-stack seniority.

## Handling the AI angle consistently (important — matches your A.Team profile)

Your public profile says "AI Engineer" and "integrating LLM-powered features" at BCT, with GPT/OpenAI as a skill. Keep the story consistent:

- **All hands-on LLM work lives in the BCT project.** Lead with the **order-intelligence pipeline** (Deep-Dive #3) — high-stakes, revenue-path automation with real AI engineering (structured extraction, SKU matching, confidence gating, per-field evals, human-in-the-loop). Mention the **assistant** (Deep-Dive #4) second, briefly, as breadth. Never open with the chatbot — "we built a chatbot" is commoditized; "we automated order entry safely" is senior.
- **Don't claim LLM work at PepsiCo** — the timeline (2021–2024) makes heavy LLM production work implausible and an interviewer may probe it. If asked "did you use AI at PepsiCo?", the honest, strong answer: "PepsiCo was data-driven (real-time aggregates powering item recommendations to merchants) but pre-LLM for us; my hands-on LLM production work is at BCT, plus personal projects with the OpenAI API."
- If asked "AI Engineer — really?": position yourself as a **senior full-stack engineer who ships LLM-powered product features** — integration, grounding, evals, guardrails, cost control — rather than a model-training ML researcher. That's exactly what most "AI Engineer" roles want, and it's defensible.
- Also mention day-to-day AI leverage: you use AI coding tools (Cursor/Copilot-class) in your workflow and drove adoption practices on the team (review AI output like any junior engineer's PR).

## "Walk me through a project" — recommended order (5–7 min)

1. One-line business context (who uses it, why it matters).
2. Your specific role/ownership.
3. Architecture in ~4 sentences (don't monologue — invite questions).
4. One deep-dive problem with numbers.
5. Result + what you'd do differently.

## "What would you do differently?" (have one per project)

- **BCT (platform):** Introduce the transactional outbox from day one instead of after the stale-cache incident; also invest earlier in load testing month-end scenarios.
- **BCT (AI):** Build the golden eval set *before* the first prompt, not alongside it — early iterations were judged by eyeballing outputs, which slowed us down until the harness existed. Also start capturing reviewer corrections as structured data from day one.
- **PepsiCo:** Start with stricter MFE contracts and a shared component library from the beginning — we retrofitted governance after version-mismatch pain.

## AI probe-hardening: specifics to memorize (answer instantly, not approximately)

- **Embeddings:** `text-embedding-3-small`, 1536 dimensions, cosine similarity, HNSW index in pgvector, top-5 retrieval.
- **Models:** use current names when speaking (e.g., GPT-4o for extraction/answers, GPT-4o-mini for routing/cheap stages) — vague "GPT-4-class" phrasing is a tell.
- **Pipeline numbers (pick these and never vary them across interviews):** ~70% of inbound POs straight-through at steady state (started near 30% at conservative launch); per-field extraction accuracy 97%+ on quantity/price after the correction loop; review queue turnaround under 10 minutes vs. hours of manual keying.
- **Assistant number:** ~30% ticket deflection on covered categories in the first quarter.
- **Multi-turn (assistant):** conversation history in Redis per session, older turns summarized near the token budget, tool *results* stored so follow-ups ("and the month before?") resolve.
- **Tool-call failure:** GraphQL errors returned to the model as structured failure messages — it says it couldn't retrieve the data, never guesses. Retries with backoff on 429s, circuit breaker on provider outage.
- **LLM-as-judge:** a stronger model grades against ground truth, calibrated against human grading on a sample first; golden-set regression blocks the change.

## Rapid-fire numbers cheat sheet

- 9+ years experience · BCT: 40% query-time reduction, millions of req/day, AI order pipeline (~70% straight-through processing, 97%+ field accuracy) + LLM assistant (~30% ticket deflection) · PepsiCo: 500K PDFs/cycle, +40% merchant satisfaction · Lenovo: microfrontends for 2W/4W insurance + Kafka notifications (backup story if asked for a third project).
