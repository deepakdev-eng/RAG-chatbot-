# RAG Chatbot (MERN + LangChain)

A simple Retrieval-Augmented Generation chatbot. Upload a PDF and ask questions about it.

## Setup

### Backend
```bash
cd server
npm install
# Edit .env and add your OPENAI_API_KEY
npm start
```

### Frontend
```bash
cd client
npm install
npm start
```

Open http://localhost:3000

## Notes
- Uses in-memory vector store (resets on server restart)
- Works with OpenAI (or Groq with minor changes)
- For production, replace MemoryVectorStore with MongoDB Atlas Vector Search
