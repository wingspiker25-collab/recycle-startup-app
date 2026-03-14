import React, { useState, useEffect, useRef } from "react";
import { api } from "../api/client";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderName: string;
  isMe: boolean;
}

export default function Chat({ pickupId }: { pickupId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function fetchMessages() {
    api<Message[]>(`/pickups/${pickupId}/messages`).then(({ data }) => {
      if (data) setMessages(data);
    });
  }

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 4000);
    return () => clearInterval(t);
  }, [pickupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    const { data, error } = await api<Message>(`/pickups/${pickupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: input.trim() }),
    });
    setLoading(false);
    if (data) {
      setMessages((prev) => [...prev, data]);
      setInput("");
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.messages}>
        {messages.map((m) => (
          <div key={m.id} style={m.isMe ? styles.msgRight : styles.msgLeft}>
            <div style={m.isMe ? styles.bubbleRight : styles.bubbleLeft}>
              {!m.isMe && <div style={styles.sender}>{m.senderName}</div>}
              {m.content}
              <div style={styles.time}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={styles.form}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.btn}>Send</button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { border: "1px solid #eee", borderRadius: 8, overflow: "hidden" },
  messages: { maxHeight: 200, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  bubbleLeft: { background: "#f0f0f0", padding: "8px 12px", borderRadius: 12, maxWidth: 280 },
  bubbleRight: { background: "#0a7c42", color: "white", padding: "8px 12px", borderRadius: 12, maxWidth: 280 },
  sender: { fontSize: 11, color: "#666", marginBottom: 2 },
  time: { fontSize: 10, opacity: 0.8, marginTop: 4 },
  form: { display: "flex", borderTop: "1px solid #eee" },
  input: { flex: 1, padding: 12, border: "none", fontSize: 14 },
  btn: { padding: "0 16px", background: "#0a7c42", color: "white", border: "none", cursor: "pointer" },
};
