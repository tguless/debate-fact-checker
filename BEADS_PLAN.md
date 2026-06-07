# Beads Plan — Debate Fact Checker

Epic: **dfc-r9p** — Debate Fact Checker App

## Phase 1 — Foundation (MVP) ✅

- [x] dfc-r9p.1 — Next.js App Router, TypeScript, Tailwind, shadcn/ui
- [x] dfc-r9p.2 — Docker Postgres + Prisma schema (`Analysis`, `TranscriptSegment`, `TechniqueFinding`, `DetectedClaim`)
- [x] dfc-r9p.3 — YouTube transcript ingestion (`youtube-transcript-plus`)
- [x] dfc-r9p.4 — Heuristic rhetoric analyzer (Gish Gallop, firehose, correlation/causation, stats, strawman)
- [x] dfc-r9p.5 — Modern UI: URL form, technique scores, flagged claims, transcript viewer
- [x] dfc-r9p.6 — `start.sh` / `stop.sh` lifecycle scripts

## Phase 2 — Accuracy & UX

- [ ] Claim segmentation with LLM (extract discrete factual assertions)
- [x] Per-claim verdict rubric: false / misleading / distorted / unsupported
- [x] Phase timeline UI mapped to detected topic shifts (not just duration buckets)
- [x] Export report as Markdown
- [ ] Export report as PDF
- [x] Analysis history search page
- [ ] Analysis comparison view

## Phase 3 — Agentic fact-check

- [x] dfc-r9p.11 — Multi-turn agent: Vercel AI SDK ToolLoopAgent + LangChain RAG + Cursor skill
- [ ] dfc-r9p.7 — Deeper source verification + gold-standard calibration
- [ ] Web search / citation retrieval pipeline
- [ ] Human review workflow for contested claims
- [ ] Confidence calibration against labeled dataset (Tucker Nowak episode as gold standard)

## Phase 4 — Production

- [ ] Background job queue for long videos
- [ ] Auth + user workspaces
- [ ] Rate limiting and caching
- [ ] Deploy: Docker Compose prod profile or Fly.io/Railway

## Commands

```bash
bd list --parent dfc-r9p
bd show dfc-r9p.4
bd close dfc-r9p.1 --reason "Scaffold complete"
```
