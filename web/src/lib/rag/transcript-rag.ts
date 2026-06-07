/**
 * Transcript RAG using LangChain's standard retrieval stack:
 * Document → RecursiveCharacterTextSplitter → OpenAIEmbeddings → MemoryVectorStore
 *
 * @see https://docs.langchain.com/oss/javascript/langchain/rag
 */
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import type { TranscriptSegment } from "@/lib/youtube";

const stores = new Map<string, MemoryVectorStore>();

function embeddings() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function indexTranscriptForRag(
  analysisId: string,
  segments: TranscriptSegment[],
): Promise<{ chunkCount: number }> {
  const docs = segments.map(
    (segment) =>
      new Document({
        pageContent: segment.text,
        metadata: {
          timestamp: segment.timestamp,
          startMs: segment.startMs,
          index: segment.index,
        },
      }),
  );

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  });

  const chunks = await splitter.splitDocuments(docs);
  const store = await MemoryVectorStore.fromDocuments(chunks, embeddings());
  stores.set(analysisId, store);

  return { chunkCount: chunks.length };
}

export async function searchTranscriptRag(
  analysisId: string,
  query: string,
  k = 6,
): Promise<
  Array<{
    timestamp: string;
    text: string;
    score?: number;
  }>
> {
  const store = stores.get(analysisId);
  if (!store) {
    throw new Error("Transcript RAG index not built. Call fetch_transcript first.");
  }

  const results = await store.similaritySearchWithScore(query, k);

  return results.map(([doc, score]) => ({
    timestamp: String(doc.metadata.timestamp ?? "?"),
    text: doc.pageContent,
    score: Number(score.toFixed(4)),
  }));
}

export function clearTranscriptRag(analysisId: string) {
  stores.delete(analysisId);
}
