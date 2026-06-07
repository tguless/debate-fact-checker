# Architecture — Debate Fact Checker

This project uses **established frameworks**, not custom agent/RAG inventions.

## Stack map

| Concern | Framework | Role |
|---------|-----------|------|
| Multi-turn agent | [Vercel AI SDK](https://ai-sdk.dev) `ToolLoopAgent` | Autonomous tool-loop; agent decides step order via `stopWhen: stepCountIs(n)` |
| Tool definitions | Vercel AI SDK `tool()` + Zod `inputSchema` | Standard tool-calling surface |
| LLM provider | `@ai-sdk/openai` | OpenAI models via AI SDK provider |
| Transcript RAG | [LangChain JS](https://js.langchain.com) | `Document` → `RecursiveCharacterTextSplitter` → `OpenAIEmbeddings` → `MemoryVectorStore` |
| Agent skill | [Cursor Agent Skills](https://cursor.com/docs) | `.cursor/skills/debate-fact-check/SKILL.md` with YAML frontmatter |
| Web search | Tavily / Serper APIs (optional) + DuckDuckGo fallback | External search plugins |
| Persistence | Prisma + PostgreSQL | Analyses, turns, claims, findings |
| UI | Next.js + shadcn/ui | Turn timeline, reports |

## What we deliberately do NOT do

- **No custom agent loop** — removed hand-rolled OpenAI `fetch` + message array loop; replaced with `ToolLoopAgent`
- **No custom RAG** — transcript retrieval uses LangChain's documented RAG pipeline
- **No orchestrated pipeline** — no hardcoded fetch → analyze → search sequence; the agent reads the skill and chooses tools
- **No invented skill format** — skills follow Cursor's `SKILL.md` convention

## Agent flow

```
User submits URL at /agent
        │
        ▼
POST /api/agent/analyze (SSE)
        │
        ▼
ToolLoopAgent.stream()          ← Vercel AI SDK
        │
        ├─ read_skill             ← Cursor SKILL.md
        ├─ fetch_transcript       ← youtube-transcript-plus
        │     └─ indexTranscriptForRag()  ← LangChain
        ├─ search_transcript_rag  ← LangChain similaritySearch
        ├─ search_web             ← Tavily/Serper/DuckDuckGo (discovery)
        ├─ read_url               ← Tavily Extract (full-page source read)
        ├─ record_claim           ← Prisma
        └─ finish_analysis        ← Prisma
        │
        ▼
Each tool-call / tool-result / reasoning step → AgentTurn row + SSE event
        │
        ▼
Analysis report at /analyses/:id (turns tab + claims + findings)
```

## Key files

```
.cursor/skills/debate-fact-check/SKILL.md   # Cursor skill (agent orchestration guide)
web/src/lib/agent/
  run-agent.ts          # ToolLoopAgent entry
  ai-tools.ts           # Vercel AI SDK tool() definitions
  tool-executors.ts     # Tool execute implementations
  turn-persistence.ts   # DB turn logging
web/src/lib/rag/
  transcript-rag.ts     # LangChain RAG over transcript
```

## References

- Vercel AI SDK agents: https://ai-sdk.dev/docs/agents/overview
- LangChain RAG: https://docs.langchain.com/oss/javascript/langchain/rag
- Cursor skills: https://cursor.com/docs/context/skills
