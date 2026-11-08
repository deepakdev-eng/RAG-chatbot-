import express from "express";
import multer from "multer";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { pipeline } from "@xenova/transformers";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

let vectorStore = null;
let embedder = null;

// Initialize embedding model once
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

// Custom embedding function
async function embedText(text) {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

// Upload PDF
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const loader = new PDFLoader(req.file.path);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitDocuments(docs);

    // Create embeddings locally
    const texts = chunks.map((c) => c.pageContent);
    const embeddings = [];

    for (const text of texts) {
      const emb = await embedText(text);
      embeddings.push(emb);
    }

    // Create vector store manually
    vectorStore = new MemoryVectorStore({
      async embedQuery(text) {
        return await embedText(text);
      },
      async embedDocuments(texts) {
        const results = [];
        for (const t of texts) {
          results.push(await embedText(t));
        }
        return results;
      },
    });

    // Add documents
    await vectorStore.addVectors(embeddings, chunks);

    res.json({
      message: "PDF processed successfully",
      chunks: chunks.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ error: "Question is required" });
    if (!vectorStore)
      return res.status(400).json({ error: "Please upload a PDF first" });

    const model = new ChatOpenAI({
      temperature: 0.3,
      modelName: "openai/gpt-oss-20b",
      openAIApiKey: process.env.GROQ_API_KEY,
      configuration: {
        baseURL: "https://api.groq.com/openai/v1",
      },
    });

    const retriever = vectorStore.asRetriever();
    const relevantDocs = await retriever.getRelevantDocuments(question);
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    const prompt = `You are a helpful assistant. Answer the user's question based only on the context provided.

Rules:
- Reply in simple, natural, conversational language.
- Do NOT use markdown (no **, no #, no tables, no bullet points with -).
- Write in normal paragraphs.
- Be clear and professional.
- If the information is not in the context, say you don't know.

Context:
${context}

Question: ${question}

Answer:`;

    const response = await model.invoke(prompt);

    // Clean any leftover markdown just in case
    let answer = response.content
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .trim();

    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
