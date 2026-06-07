# Debate Fact Checker

**Paste a YouTube debate or monologue. Get a citeable breakdown of what's misleading — with sources.**

Ever watch a 90-minute rant and feel like you're drowning in claims you can't verify fast enough? That's the [Gish Gallop](https://en.wikipedia.org/wiki/Gish_gallop): flood the zone with assertions so nobody can fact-check them in real time. This tool does the opposite — it pulls the transcript, flags rhetoric tricks, and (in agent mode) actually goes and reads primary sources.

Built for people who argue in good faith but need receipts: journalists, researchers, debaters, and anyone tired of "studies show" with no study attached.

## Try it in 2 minutes

You need **Node 20+** and **Docker**. Then:

```bash
git clone https://github.com/tguless/debate-fact-checker.git
cd debate-fact-checker
chmod +x start.sh stop.sh

# 1) Configure API keys (required for /agent — skip only if you want quick scan)
cp web/.env.example web/.env
```

Open `web/.env` and paste **your** keys (Next.js reads this file):

```env
OPENAI_API_KEY="sk-..."          # https://platform.openai.com/api-keys
TAVILY_API_KEY="tvly-..."        # https://tavily.com
```

Then start the app:

```bash
# 2) Launch Postgres + Next.js
./start.sh
```

| What to open | Keys needed? |
|--------------|----------------|
| **http://localhost:3847** — quick rhetoric scan | No |
| **http://localhost:3847/agent** — source-verified fact-check | **Yes — OpenAI + Tavily** |

Paste any YouTube URL with captions. Quick scan gives you a manipulation score and flagged claims in under a minute. Agent mode searches the web, reads full articles, records verdicts live, and lets you **download a Markdown report**.

If `/agent` shows a setup warning, your keys are missing or still placeholders — edit `web/.env`, then `./stop.sh && ./start.sh`.

**Never commit `web/.env`.** Keys stay on your machine only. (A root `.env` also works — `start.sh` syncs it to `web/.env`.)

### What you'll get

| Output | Why it matters |
|--------|----------------|
| **Manipulation score** (0–100) | Quick signal for how hard the speaker is leaning on rhetoric over evidence |
| **Per-claim verdicts** | `FALSE`, `MISLEADING`, `DISTORTED`, `UNSUPPORTED`, `FLAGGED` — with reasoning |
| **Technique findings** | Gish Gallop, firehosing, stat distortion, strawman — scored and explained |
| **Timestamped excerpts** | Jump to the exact moment in the video |
| **Downloadable `.md` report** | Shareable, citeable, ready for Notion or a blog post |
| **Live agent turns** | See every tool call — no black box |

## Two modes — start free, go deep when ready

| Mode | Path | API keys | Best for |
|------|------|----------|----------|
| **Quick scan** | `/` | None | Fast rhetoric pass — great first look |
| **Agent fact-check** | `/agent` | **OpenAI + Tavily (both required)** | Real verification against news and primary sources |

The agent doesn't follow a fixed script. It reads a [Cursor skill](.cursor/skills/debate-fact-check/SKILL.md), fetches the transcript, searches the web, **reads full pages** (not just snippets), and records what it finds — streaming every step to the UI.

## Example workflow

1. Paste a monologue URL (any video with YouTube captions).
2. **Quick scan** → see which techniques dominate and which claims look suspicious.
3. Switch to **Agent mode** on the same or a new video → watch turns stream in.
4. Open the report → claims tab for verdicts, turns tab for the audit trail.
5. **Download the report** — you get `debate-fact-check-{videoId}.md` with everything bundled.

Good candidates: political monologues, podcast rants, debate clips — anything dense with statistics and accusations.

## Requirements

- **Node.js 20+**
- **Docker** (for Postgres)
- **npm**
- Quick scan: nothing else
- Agent mode: **your** `OPENAI_API_KEY` + **your** `TAVILY_API_KEY` (both required)

## Setup reference

Next.js loads **`web/.env`**. `start.sh` creates it from `web/.env.example` if missing, and copies a root `.env` over it when present. Default ports: app **3847**, Postgres **5487**.

```bash
./stop.sh   # tear down
```

### Environment variables

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `OPENAI_API_KEY` | **Yes** (for `/agent`) | Powers the fact-checking agent — [get one here](https://platform.openai.com/api-keys) |
| `TAVILY_API_KEY` | **Yes** (for `/agent`) | Web search + full-page source reads — [get one here](https://tavily.com) |
| `OPENAI_MODEL` | No | e.g. `gpt-4.1-mini` or `gpt-5-mini` |
| `AGENT_MAX_STEPS` | No | Step budget (default `50`) |
| `DFC_APP_PORT` / `PORT` | No | App port |
| `DFC_POSTGRES_PORT` | No | Postgres port |

Without both keys, agent mode is disabled (quick scan still works). `start.sh` prints a warning if either key is missing.

## How it works

| Layer | Framework |
|-------|-----------|
| Agent loop | [Vercel AI SDK](https://ai-sdk.dev) `ToolLoopAgent` |
| Transcript RAG | [LangChain](https://js.langchain.com) + `OpenAIEmbeddings` |
| Web search + read | Tavily Search + Tavily Extract |
| Skill | [Cursor Agent Skills](https://cursor.com/docs) format |

The agent orchestrates its own steps: `read_skill` → `fetch_transcript` → `search_transcript_rag` → `search_web` → `read_url` → `record_claim` → `finish_analysis`. No hardcoded pipeline.

Details: [ARCHITECTURE.md](./ARCHITECTURE.md)

## API

- `POST /api/analyze` — quick heuristic scan
- `POST /api/agent/analyze` — agent run (SSE)
- `GET /api/analyses/:id` — full report
- `GET /api/analyses/:id/live` — poll while agent runs
- `GET /api/analyses/:id/export` — Markdown download

## Project layout

```
debate-fact-checker/
├── .cursor/skills/debate-fact-check/   # Agent skill
├── start.sh / stop.sh
├── docker-compose.yml
└── web/                                # Next.js app
    └── src/lib/
        ├── agent/                      # ToolLoopAgent + tools
        ├── rag/                        # LangChain transcript RAG
        └── rhetoric/                   # Heuristic quick scan
```

## Roadmap

| Area | Status |
|------|--------|
| Scaffold, Postgres, transcript, heuristics, UI | Done |
| Agent fact-check + live turns + export | Done |
| Gold-standard calibration | In progress |

Tracked with [beads](https://github.com/steveyegge/beads) — `bd list --parent dfc-r9p`

## Limitations

- Needs YouTube captions on the video.
- Quick scan is pattern-based; agent mode quality depends on model, step budget, and source availability.
- Agent auto-finalizes if it hits the step limit — you still get a score and summary.

## Contribute

Issues and PRs welcome. If you run it on a video and get something interesting — especially a claim the agent got right or wrong — open an issue. That's how we calibrate.

---

*Separate the scandal from the sermon. Correct the statistic without minimizing the victim.*
