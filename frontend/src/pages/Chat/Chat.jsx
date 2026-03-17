import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useState, useRef } from "react";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL;

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  async function fetchMessages() {
    try {
      const res = await fetch(`${API_URL}/api/messages?user2=${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage() {
    if (!text.trim()) return;
    try {
      await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id, text }),
      });
      setText("");
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="chat-wrapper">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-avatar">💬</div>
        <div className="chat-header-info">
          <h2>Чат</h2>
          <span>онлайн</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💌</div>
            <p>Поки що немає повідомлень. Напиши першим!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId.toString() === user._id.toString();
            return (
              <div
                key={msg._id}
                className={`chat-message ${isMine ? "mine" : "theirs"}`}
              >
                <div className="chat-bubble">{msg.text}</div>
                {msg.createdAt && (
                  <span className="chat-time">{formatTime(msg.createdAt)}</span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            className="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написати повідомлення..."
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
        </div>
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!text.trim()}
          aria-label="Надіслати"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}