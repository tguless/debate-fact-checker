# Debate Fact Checker

Next.js + TypeScript + shadcn/ui app with Dockerized Postgres. Paste a YouTube URL, fetch the transcript, and analyze misleading debate tactics:

- **Gish Gallop** — claim volume outpacing verification
- **Firehosing** — repetition substituting for evidence
- **Correlation → causation** — stats promoted to conspiracy
- **Statistical distortion** — ratios/percentages without context
- **Strawman** — opponent/media caricature

Inspired by the [Henry Nowak rebuttal research](../social_media_rebuttal/) in this repo.

## Requirements

- **Node.js 20+** (Next.js 16 requires it)
- Docker Desktop / Docker Engine
- npm

## Quick start

```bash
chmod +x start.sh stop.sh
./start.sh
```

Open http://localhost:3847 (default ports — configurable in `web/.env`)

Stop everything:

```bash
./stop.sh
```

## Project layout

```
debate-fact-checker/
├── .beads/              # beads issue tracker (long-horizon plan)
├── BEADS_PLAN.md        # human-readable roadmap
├── docker-compose.yml   # Postgres 16
├── start.sh / stop.sh
└── web/                 # Next.js app
    ├── prisma/          # database schema
    └── src/
        ├── app/         # pages + API routes
        ├── components/  # shadcn UI
        └── lib/
            ├── rhetoric/   # heuristic analyzer
            └── youtube.ts  # transcript fetch
```

## Agent fact-check (`/agent`)

Multi-turn autonomous analysis using **standard frameworks** (not a custom agent loop):

| Layer | Framework |
|-------|-----------|
| Agent loop | [Vercel AI SDK](https://ai-sdk.dev) `ToolLoopAgent` |
| Transcript RAG | [LangChain](https://js.langchain.com) `MemoryVectorStore` + `OpenAIEmbeddings` |
| Skill | [Cursor Agent Skills](https://cursor.com/docs) `.cursor/skills/debate-fact-check/SKILL.md` |

The agent reads its skill and **decides its own turn order** — no hardcoded pipeline. Every tool call and result is persisted and streamed live.

Requires `OPENAI_API_KEY`. Optional: `TAVILY_API_KEY` or `SERPER_API_KEY` for web search.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full stack map.

## API

- `POST /api/analyze` — quick heuristic scan (SSE-less JSON response)
- `POST /api/agent/analyze` — agent run (SSE stream of turns)
- `GET /api/analyses` — recent analyses
- `GET /api/analyses/:id` — full report
- `GET /api/analyses/:id/turns` — agent turn history

## Beads planning

This is a long-horizon project tracked with [beads](https://github.com/steveyegge/beads):

```bash
bd list --parent dfc-r9p    # epic children
bd show dfc-r9p             # epic details
```

## Roadmap (beads)

| ID | Task | Priority |
|----|------|----------|
| dfc-r9p | Epic: Debate Fact Checker App | P0 |
| dfc-r9p.1 | Next.js + shadcn scaffold | P1 |
| dfc-r9p.2 | Docker Postgres + Prisma | P1 |
| dfc-r9p.3 | YouTube transcript API | P1 |
| dfc-r9p.4 | Rhetoric analysis engine | P1 |
| dfc-r9p.5 | Analysis UI | P1 |
| dfc-r9p.6 | start.sh / stop.sh | P2 |
| dfc-r9p.7 | LLM per-claim fact-check (future) | P3 |

## Notes

- Transcript fetch depends on YouTube captions being available for the video.
- Current analysis is **heuristic pattern detection**, not LLM fact-checking against primary sources.
- Default ports: app **3847**, Postgres **5487** — set `DFC_APP_PORT`, `DFC_POSTGRES_PORT`, and `PORT` in `web/.env` if they clash with other projects.
