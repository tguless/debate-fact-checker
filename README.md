# Debate Fact Checker

Next.js + TypeScript + shadcn/ui app with Dockerized Postgres. Paste a YouTube URL and analyze misleading debate tactics:

- **Gish Gallop** — claim volume outpacing verification
- **Firehosing** — repetition substituting for evidence
- **Correlation → causation** — stats promoted to conspiracy
- **Statistical distortion** — ratios/percentages without context
- **Strawman** — opponent/media caricature

## Two analysis modes

| Mode | URL | What it does |
|------|-----|--------------|
| **Quick scan** | `/` | Fast heuristic pattern detection over the transcript (no LLM required) |
| **Agent fact-check** | `/agent` | Autonomous multi-turn agent: transcript RAG, web search, full-page reads, per-claim verdicts |

The agent mode uses OpenAI to verify claims against primary sources (via Tavily search + `read_url` extract), records `FALSE` / `MISLEADING` / `DISTORTED` / etc., and streams every turn live via SSE.

## Requirements

- **Node.js 20+** (Next.js 16 requires it)
- Docker Desktop / Docker Engine
- npm
- **Quick scan:** no API keys
- **Agent mode:** `OPENAI_API_KEY` (required), `TAVILY_API_KEY` (recommended for search + page extract)

## Quick start

```bash
chmod +x start.sh stop.sh
cp .env.example .env   # add your API keys
./start.sh
```

Open http://localhost:3847

Stop everything:

```bash
./stop.sh
```

`start.sh` copies root `.env` → `web/.env`, starts Postgres, and launches the Next.js dev server.

## Configuration

Copy `.env.example` to `.env` and fill in keys. Never commit `.env` — only `.env.example` is tracked.

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Agent LLM (required for `/agent`) |
| `OPENAI_MODEL` | Model ID (default in example: `gpt-4.1-mini`) |
| `TAVILY_API_KEY` | Web search + full-page extract via Tavily |
| `AGENT_MAX_STEPS` | Tool-loop step budget (default `50`) |
| `DFC_APP_PORT` / `PORT` | Next.js port (default **3847**) |
| `DFC_POSTGRES_PORT` | Postgres host port (default **5487**) |

## Project layout

```
debate-fact-checker/
├── .cursor/skills/debate-fact-check/   # Agent skill (orchestration + verdict rubric)
├── docker-compose.yml                  # Postgres 16
├── start.sh / stop.sh
└── web/                                # Next.js app
    ├── prisma/                         # database schema
    └── src/
        ├── app/                        # pages + API routes
        ├── components/                 # shadcn UI + live turn timeline
        └── lib/
            ├── agent/                  # Vercel AI SDK ToolLoopAgent + tools
            ├── rag/                    # LangChain transcript RAG
            ├── rhetoric/               # heuristic analyzer (quick scan)
            └── youtube.ts              # transcript fetch
```

## Agent fact-check (`/agent`)

Multi-turn autonomous analysis using standard frameworks:

| Layer | Framework |
|-------|-----------|
| Agent loop | [Vercel AI SDK](https://ai-sdk.dev) `ToolLoopAgent` |
| Transcript RAG | [LangChain](https://js.langchain.com) `MemoryVectorStore` + `OpenAIEmbeddings` |
| Web search + page read | Tavily Search + Tavily Extract (`read_url` tool) |
| Skill | [Cursor Agent Skills](https://cursor.com/docs) `.cursor/skills/debate-fact-check/SKILL.md` |

The agent reads its skill and **decides its own turn order** — no hardcoded pipeline. Tool calls and results are persisted and streamed live (SSE on `/agent`, polling on `/analyses/:id` while running).

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full stack map.

## API

- `POST /api/analyze` — quick heuristic scan (JSON)
- `POST /api/agent/analyze` — agent run (SSE stream of turns)
- `GET /api/analyses` — recent analyses
- `GET /api/analyses/:id` — full report
- `GET /api/analyses/:id/live` — poll status, turns, claims while agent is running
- `GET /api/analyses/:id/turns` — agent turn history
- `GET /api/analyses/:id/export` — Markdown export

## Beads planning

Long-horizon tasks tracked with [beads](https://github.com/steveyegge/beads):

```bash
bd list --parent dfc-r9p
bd show dfc-r9p
```

## Roadmap

| ID | Task | Status |
|----|------|--------|
| dfc-r9p.1–.6 | Scaffold, Postgres, transcript, heuristics, UI, scripts | Done |
| dfc-r9p.7 | Agent fact-check + gold-standard calibration | In progress |
| dfc-r9p.8–.11 | Verdict rubric, export, history, agentic flow | Done |

## Notes

- Transcript fetch requires YouTube captions to be available for the video.
- **Quick scan** is heuristic only. **Agent mode** is LLM fact-checking with web search and full-page source reads — quality depends on model, step budget, and source availability.
- If the agent hits the step limit, it auto-finalizes a summary and score from recorded claims.
- Default ports: app **3847**, Postgres **5487** — change in `.env` if they clash with other projects.
