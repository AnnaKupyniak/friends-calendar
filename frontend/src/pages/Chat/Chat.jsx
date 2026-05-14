import { useContext, useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FriendsContext } from "../../context/FriendsContext";
import FriendsAndGroups from "../../features/friends/FriendsAndGroups";
import { MessageCircle, MailOpen, ArrowLeft } from "lucide-react";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL;

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { friendships = [] } = useContext(FriendsContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Знаходимо співрозмовника серед друзів
  const chatPartner = friendships
    .flatMap((f) => f.users)
    .find((u) => u._id === id);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const fetchMessages = useCallback(async () => {
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
  }, [id]);

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

  useEffect(() => {
    const loadMessages = async () => {
      await fetchMessages();
    };
    loadMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <FriendsAndGroups />
      </aside>

      {/* Chat */}
      <div className="chat-wrapper">
        <div className="chat-header">
          <button className="chat-back-btn" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft size={20} />
          </button>
          <div className="chat-header-avatar">
            {chatPartner?.avatar ? (
              <img
                src={`${API_URL}/uploads/${chatPartner.avatar}`}
                alt="avatar"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <MessageCircle size={20} />
            )}
          </div>
          <div className="chat-header-info">
            <h2>{chatPartner ? chatPartner.fullName || chatPartner.username : "Чат"}</h2>
            <span>онлайн</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <MailOpen size={40} strokeWidth={1.5} />
              </div>
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
    </div>
  );
}