import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file");
    setLoading(true);
    setStatus("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/rag/upload", formData);
      setStatus(res.data.message);
    } catch (err) {
      setStatus("Upload failed. Please try again.");
    }
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const userQuestion = question;
    setQuestion("");

    try {
      const res = await axios.post("http://localhost:5000/api/rag/ask", { question: userQuestion });
      const newAnswer = res.data.answer;

      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: userQuestion },
        { type: "bot", text: newAnswer },
      ]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Something went wrong";
      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: userQuestion },
        { type: "bot", text: "Error: " + errorMsg },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>RAG Chatbot</h1>
        <p style={styles.subtitle}>Upload a PDF and ask questions about it</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>1. Upload Document</h2>
        <div style={styles.uploadSection}>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.fileInput}
          />
          <button onClick={handleUpload} disabled={loading} style={styles.primaryBtn}>
            {loading ? "Processing..." : "Upload PDF"}
          </button>
        </div>
        {status && <p style={styles.status}>{status}</p>}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>2. Chat</h2>

        <div style={styles.chatBox}>
          {chatHistory.length === 0 ? (
            <p style={styles.placeholder}>Ask a question about your document...</p>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
                  backgroundColor: msg.type === "user" ? "#4f46e5" : "#f3f4f6",
                  color: msg.type === "user" ? "white" : "#111827",
                }}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        <div style={styles.inputSection}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            style={styles.textarea}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
          />
          <button onClick={handleAsk} disabled={loading} style={styles.primaryBtn}>
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    textAlign: "center",
    color: "white",
    marginBottom: "30px",
  },
  title: {
    fontSize: "42px",
    margin: "0",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: "18px",
    opacity: 0.9,
    marginTop: "8px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "30px",
    margin: "0 auto 30px",
    maxWidth: "800px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  },
  sectionTitle: {
    marginTop: "0",
    color: "#1f2937",
    fontSize: "22px",
  },
  uploadSection: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  fileInput: {
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  },
  primaryBtn: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
  status: {
    color: "#059669",
    marginTop: "12px",
    fontWeight: "500",
  },
  chatBox: {
    height: "400px",
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  placeholder: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: "150px",
  },
  message: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "16px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  inputSection: {
    display: "flex",
    gap: "12px",
  },
  textarea: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    resize: "none",
    fontSize: "15px",
  },
};

export default App;
