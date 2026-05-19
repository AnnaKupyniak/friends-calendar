import React, { useContext, useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { AuthContext } from "../../context/AuthContext";
import { FriendsContext } from "../../context/FriendsContext";
import FriendsAndGroups from "../../features/friends/FriendsAndGroups";
import { MessageCircle, MailOpen, ArrowLeft, Image as ImageIcon, Trash2, Edit2, X } from "lucide-react";
import axios from "axios";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  if (isSameDay(d, now)) return "Сьогодні";
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Вчора";

  return d.toLocaleDateString([], { day: 'numeric', month: 'long' });
}

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { friendships = [], groups = [] } = useContext(FriendsContext);
  
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  // Знаходимо співрозмовника або групу
  const chatPartner = friendships
    .flatMap((f) => f.users)
    .find((u) => u._id === id);
    
  const chatGroup = groups.find((g) => g._id === id);
  const isGroup = !!chatGroup;

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const fetchMessages = useCallback(async () => {
    try {
      const url = isGroup 
        ? `${API_URL}/api/messages?groupId=${id}`
        : `${API_URL}/api/messages?user2=${id}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      const data = await res.json();
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  }, [id, isGroup]);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Socket connection + join chat room
  useEffect(() => {
    if (!user?._id) return;

    const joinChatRoom = () => {
      socket.current.emit("join-chat", {
        userId: user._id,
        chatPartnerId: isGroup ? undefined : id,
        groupId: isGroup ? id : undefined,
      });
      
      console.log("[Chat] join-chat emitted:", { 
        userId: user._id, 
        isGroup,
        chatPartnerId: isGroup ? undefined : id,
        groupId: isGroup ? id : undefined,
        socketId: socket.current.id,
        connected: socket.current.connected
      });
    };

    if (!socket.current) {
      console.log("[Chat] Створюємо новий Socket.IO до backend напрямо");
      console.log("[Chat] URL:", SOCKET_URL);
      
      // Підключаємось через конфігурований URL або поточний origin (через Vite proxy)
      socket.current = io(SOCKET_URL, {
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        withCredentials: true,
        transports: ['polling', 'websocket']
      });

      console.log("[Chat] Socket об'єкт створений, слухаємо события...");

      socket.current.on("connect", () => {
        console.log("[Socket] ✓ Підключено:", socket.current.id);
        joinChatRoom();
      });

      socket.current.on("connect_error", (err) => {
        console.error("[Socket] ✗ Помилка підключення (connect_error):", err.message || err);
        console.error("[Socket] Деталі помилки:", err);
      });

      socket.current.on("error", (err) => {
        console.error("[Socket] ✗ Socket Error:", err);
      });

      socket.current.on("disconnect", () => {
        console.warn("[Socket] Розійдався");
      });

      // Логуємо ВСЕ события для діагностики
      socket.current.onAny((eventName, ...args) => {
        if (eventName !== 'ping') {
          console.log("[Socket Event]", eventName, args);
        }
      });
    } else if (socket.current.connected) {
      // Socket already connected
      console.log("[Chat] Socket вже підключений:", socket.current.id);
      joinChatRoom();
    } else {
      // Socket exists but not connected, wait for connect event
      console.log("[Chat] Чекаємо на підключення...");
      socket.current.connect();
    }

    fetchMessages();

    // Listeners
    socket.current.on("room-users", (data) => {
      setOnlineUsers(new Set(data.users));
    });

    socket.current.on("user-online", (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
    });

    socket.current.on("user-offline", (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socket.current.on("user-typing", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.userId);
        return newSet;
      });
    });

    socket.current.on("user-stop-typing", (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socket.current.on("new-message", (message) => {
      console.log("[new-message] Отримано повідомлення від серверу:", message);
      const senderIdStr = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
      let isForCurrentChat = false;
      if (isGroup) {
        isForCurrentChat = message.groupId === id;
      } else {
        isForCurrentChat = !message.groupId && (senderIdStr === id || message.receiverId === id);
      }

      console.log("[new-message] Перевірка належності до чату:", {
        isGroup,
        msgGroupId: message.groupId,
        currentId: id,
        senderId: senderIdStr,
        receiverId: message.receiverId,
        myId: user._id,
        isForCurrentChat
      });

      if (isForCurrentChat) {
        console.log("[new-message] ✓ Додаємо повідомлення до списку");
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      } else {
        console.log("[new-message] ✗ Повідомлення не для цього чату");
      }
    });

    socket.current.on("message-deleted", (data) => {
      setMessages((prev) => prev.filter(m => m._id !== data.messageId));
    });

    socket.current.on("message-edited", (data) => {
      setMessages((prev) => prev.map(m => m._id === data.messageId ? { ...m, text: data.text, isEdited: true } : m));
    });

    // Cleanup
    return () => {
      if (socket.current) {
        socket.current.emit("leave-chat", {
          userId: user._id,
          chatPartnerId: isGroup ? undefined : id,
          groupId: isGroup ? id : undefined,
        });
        socket.current.off("new-message");
        socket.current.off("user-online");
        socket.current.off("user-offline");
        socket.current.off("room-users");
        socket.current.off("user-typing");
        socket.current.off("user-stop-typing");
        socket.current.off("message-deleted");
        socket.current.off("message-edited");
      }
      setOnlineUsers(new Set());
      setTypingUsers(new Set());
      cancelEdit();
      removeImage();
    };
  }, [user?._id, id, isGroup, fetchMessages]);

  useEffect(() => {
    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
      if (!allowedTypes.includes(file.type)) {
        alert("Можна завантажувати тільки зображення (jpeg, png, gif, webp, avif)!");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Файл занадто великий. Максимальний розмір: 5 МБ.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };


  async function sendMessage() {
    console.log("[sendMessage] Початок", { text: !!text, imageFile: !!imageFile, editingMessageId });
    
    if (!text.trim() && !imageFile) {
      console.log("[sendMessage] Повідомлення пусте, скасовуємо");
      return;
    }    
    // Якщо ми редагуємо повідомлення
    if (editingMessageId) {
      try {
        await axios.put(`${API_URL}/api/messages/${editingMessageId}`, { text }, { withCredentials: true });
        
        const safeUserId = String(user._id);
        const safePartnerId = isGroup ? '' : String(id);
        const roomId = isGroup ? String(id) : [safeUserId, safePartnerId].sort().join('-');
        
        socket.current.emit("edit-message", { messageId: editingMessageId, roomId, text });
        setMessages((prev) => prev.map(m => m._id === editingMessageId ? { ...m, text, isEdited: true } : m));
        cancelEdit();
      } catch (err) {
        console.error("[sendMessage] Помилка редагування:", err);
      }
      return;
    }

    setIsUploading(true);
    let uploadedImageUrl = undefined;

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        const res = await axios.post(`${API_URL}/api/messages/upload`, formData, { withCredentials: true });
        uploadedImageUrl = res.data.imageUrl;
        console.log("[sendMessage] Зображення завантажено:", uploadedImageUrl);
      } catch (err) {
        console.error("[sendMessage] Помилка завантаження зображення:", err);
        setIsUploading(false);
        return;
      }
    }

    // Stop typing immediately when sending
    if (isTyping) {
      setIsTyping(false);
      clearTimeout(typingTimeout.current);
      socket.current.emit("stop-typing", {
        userId: user._id,
        chatPartnerId: isGroup ? undefined : id,
        groupId: isGroup ? id : undefined,
      });
    }

    const messageData = {
      senderId: user._id,
      receiverId: isGroup ? undefined : id,
      groupId: isGroup ? id : undefined,
      text,
      imageUrl: uploadedImageUrl,
      senderInfo: { _id: user._id, fullName: user.fullName, username: user.username, avatar: user.avatar }
    };

    console.log("[sendMessage] Розсилаємо повідомлення:", messageData);
    socket.current.emit("send-message", messageData);
    
    setText("");
    removeImage();
    setIsUploading(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Ви дійсно хочете видалити це повідомлення?")) return;
    try {
      await axios.delete(`${API_URL}/api/messages/${msgId}`, { withCredentials: true });
      
      const safeUserId = String(user._id);
      const safePartnerId = isGroup ? '' : String(id);
      const roomId = isGroup ? String(id) : [safeUserId, safePartnerId].sort().join('-');
      
      socket.current.emit("delete-message", { messageId: msgId, roomId });
      setMessages((prev) => prev.filter(m => m._id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const startEditing = (msg) => {
    setEditingMessageId(msg._id);
    setText(msg.text || "");
    removeImage();
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  };


  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";

    // Typing logic
    if (!isTyping) {
      setIsTyping(true);
      socket.current.emit("typing", {
        userId: user._id,
        chatPartnerId: isGroup ? undefined : id,
        groupId: isGroup ? id : undefined,
      });
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.current.emit("stop-typing", {
        userId: user._id,
        chatPartnerId: isGroup ? undefined : id,
        groupId: isGroup ? id : undefined,
      });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "Escape" && editingMessageId) {
      cancelEdit();
    }
  };

  const isPartnerOnline = !isGroup && chatPartner && onlineUsers.has(chatPartner._id);
  const onlineCount = isGroup ? onlineUsers.size + 1 : 0; // +1 for self
  
  let typingText = "";
  if (typingUsers.size > 0) {
    if (isGroup) {
      if (typingUsers.size === 1) {
        typingText = "Хтось друкує...";
      } else {
        typingText = "Кілька людей друкують...";
      }
    } else {
      typingText = "друкує...";
    }
  }

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <FriendsAndGroups />
      </aside>

      {/* Chat */}
      <div className="chat-wrapper">
        <div className="chat-header">
          <button
            className="chat-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="chat-header-avatar">
            {isGroup ? (
              chatGroup?.avatar ? (
                <img
                  src={`${API_URL}/uploads/${chatGroup.avatar}`}
                  alt="group-avatar"
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <MessageCircle size={20} />
              )
            ) : chatPartner?.avatar ? (
              <img
                src={`${API_URL}/uploads/${chatPartner.avatar}`}
                alt="avatar"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <MessageCircle size={20} />
            )}
            {!isGroup && isPartnerOnline && <div className="chat-online-badge"></div>}
          </div>
          <div className="chat-header-info">
            <h2>
              {isGroup
                ? chatGroup?.name
                : chatPartner
                ? chatPartner.fullName || chatPartner.username
                : "Чат"}
            </h2>
            <span className={isPartnerOnline ? "online" : ""}>
              {typingText ? (
                <span className="typing-indicator-text">{typingText}</span>
              ) : isGroup ? (
                `${chatGroup?.members?.length || 0} учасників (${onlineCount} в мережі)`
              ) : isPartnerOnline ? (
                "в мережі"
              ) : (
                "не в мережі"
              )}
            </span>
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
            messages.map((msg, index) => {
              const currentMsgDate = new Date(msg.createdAt);
              const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
              const showDateLabel = !prevMsgDate || !isSameDay(currentMsgDate, prevMsgDate);

              const senderIdStr = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
              const isMine = senderIdStr?.toString() === user._id.toString();

              return (
                <React.Fragment key={msg._id}>
                  {showDateLabel && msg.createdAt && (
                    <div className="chat-date-separator">
                      <span>{formatDateLabel(msg.createdAt)}</span>
                    </div>
                  )}
                  <div className={`chat-message ${isMine ? "mine" : "theirs"}`}>
                    <div className="chat-bubble">
                      {isGroup && !isMine && typeof msg.senderId === "object" && (
                        <div className="chat-sender-name">
                          {msg.senderId.fullName || msg.senderId.username}
                        </div>
                      )}
                      
                      {msg.imageUrl && (
                        <div className="chat-image-container">
                          <img src={`${API_URL}/uploads/${msg.imageUrl}`} alt="вкладення" className="chat-image" />
                        </div>
                      )}
                      
                      {msg.text && <div className="chat-text">{msg.text}</div>}
                      
                      {isMine && (
                         <div className="chat-message-actions">
                           <button onClick={() => startEditing(msg)} title="Редагувати" disabled={!!msg.imageUrl && !msg.text}>
                             <Edit2 size={12} />
                           </button>
                           <button onClick={() => handleDeleteMessage(msg._id)} title="Видалити" className="delete-action">
                             <Trash2 size={12} />
                           </button>
                         </div>
                      )}
                    </div>
                    <div className="chat-time-container">
                      <span className="chat-time">
                        {msg.createdAt && formatTime(msg.createdAt)}
                        {msg.isEdited && <span className="chat-edited-mark"> (змінено)</span>}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {imagePreview && (
            <div className="chat-image-preview">
              <img src={imagePreview} alt="preview" />
              <button className="chat-image-preview-close" onClick={removeImage}>
                <X size={16} />
              </button>
            </div>
          )}
          
          {editingMessageId && (
            <div className="chat-editing-indicator">
              <span>Редагування повідомлення...</span>
              <button onClick={cancelEdit}><X size={14} /></button>
            </div>
          )}
          
          <div className="chat-input-wrapper">
            <button 
              className="chat-attach-btn" 
              onClick={() => fileInputRef.current?.click()}
              disabled={!!editingMessageId || isUploading}
              title="Прикріпити зображення"
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              style={{ display: "none" }} 
            />
            
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={editingMessageId ? "Редагувати повідомлення..." : "Написати повідомлення..."}
              rows={1}
            />
          </div>
          <button
            className={`chat-send-btn ${editingMessageId ? 'editing' : ''}`}
            onClick={sendMessage}
            disabled={(!text.trim() && !imageFile) || isUploading}
            aria-label={editingMessageId ? "Зберегти" : "Надіслати"}
          >
            {editingMessageId ? (
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <polyline points="20 6 9 17 4 12"></polyline>
               </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
