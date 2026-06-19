Here's the same plan in English. The strategic premise first — **the medical silo is already half-solved for you.** Korea's Health Information Highway (My Health Way) is a national de-siloing platform that aggregates hospital and public-agency data in KR Core format under patient consent, so your pipeline's medical-data strategy should be "Highway first, direct EMR integration as backfill." What you genuinely have to solve yourself is the **care/welfare silo** (ADL, cognition, family support — none of which the Highway carries) and **real-time PGHD** (wearables, home measurements). Design around that asymmetry.## The pipeline, layer by layer

**① Ingestion.** Each source has a different pattern. Medical and public data come in via **batch pull** — when a case opens, the data-collection agent confirms consent and fetches the patient's history from the Highway (the 12 medical items plus the three public feeds). Care assessments come in via **form entry** (the local government's integrated eligibility assessment and case managers entering ADL/cognition scores). Wearables and monitoring come in as a **real-time stream** wired straight to the risk-surveillance agent. The trick is making batch and stream coexist in one pipeline, so you put a message bus (Kafka or similar) in the middle and split "past history = batch, new events = stream."

**② Normalize.** This is the heart of de-siloing. Highway data is already KR Core, so it's absorbed almost unchanged; direct-EMR feeds go through adapters; care assessments map to your ICP `Observation` profiles. The hardest part here is **patient identity (MPI)** — the same person exists under different keys in the hospital, the nursing home, and public systems, so a master patient index has to resolve them into one person before anything else, or every downstream step attaches data to the wrong patient. Codes are normalized with ConceptMaps (KCD, LOINC, drug codes), and `$validate` enforces profile conformance before anything lands.

**③ Canonical FHIR store.** A single source of truth. Every agent read/write happens here (the "agent action = FHIR transaction" principle from earlier), external-origin resources are tagged with `meta.source` + `Provenance`, and access is gated by `Consent`. Time-series for the risk model is pulled out via FHIR Bulk `$export` into a separate feature store for training and inference.

**④ Serving the agents.** Pathway-recommendation and resource-matching agents read the store; the risk-surveillance agent subscribes to the stream via FHIR Subscription.

**Governance (cross-cutting).** Consent, audit, de-identification, and access control aren't a final stage — they apply at every step. Because integrated care entangles medical, long-term-care, and welfare institutions, consent is legally sensitive (the Integrated Care Support Act), so a consent check before ingestion is a no-exception gate.

## Four problems specific to this environment

What separates this from a generic pipeline: first, **patient identity** (different keys per system → an MPI is mandatory); second, the **medical/care asymmetry** (the Highway fills only the medical half, so the care half needs its own collection design); third, **batch/stream duality** (merging historical records with real-time vitals into one model); and fourth, **consent granularity** (consent by item, institution, and time period, enforced at the resource level). If those four aren't solved, no amount of clean normalization keeps the pipeline from leaking.

## Build order (MVP first)

Don't build it all at once. A realistic sequence is: (1) **Highway integration + the canonical FHIR store** first — this secures the medical half at the lowest cost, since it's already KR Core and needs minimal transformation; (2) **MPI + the consent gate** — the foundation of de-siloing; (3) the **care-assessment form path** — the other half; (4) **real-time streaming + risk surveillance** — the most complex, so leave it for last. Even just (1) + (2) is enough to start running the pathway-recommendation agent.

---

Since you're assembling the repo, I can drop this English write-up into the bundle as a doc — e.g., `docs/data-pipeline.md` alongside the IG — so it travels with the project. Want me to add it?