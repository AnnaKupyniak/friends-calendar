import { useState, useEffect, useContext } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: "0.88rem",
  outline: "none",
  transition: "var(--transition)",
};

export default function NewFriend({ onClose }) {
  const { friendships, addFriend, findFriend, searchResults } =
    useContext(FriendsContext);

  const [query, setQuery] = useState("");

  useEffect(() => {
    findFriend(query);
  }, [query]);

  function handleAdd(user) {
    addFriend(user._id);
    onClose();
  }

  const filteredUsers = searchResults.filter(
    (u) => !friendships.some((f) => f.users.some((fu) => fu._id === u._id))
  );

  return (
    <div style={{ width: "100%" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
        Додати друга
      </h2>

      <input
        type="text"
        placeholder="Пошук користувача..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={inputStyle}
        autoFocus
      />

      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li
              key={user._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <img
                src={user.avatar
                  ? `${API_URL}/uploads/${user.avatar}`
                  : `${API_URL}/uploads/default-avatar.png`}
                alt={user.username}
                style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {user.fullName || user.username}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  @{user.username}
                </div>
              </div>
              <button
                onClick={() => handleAdd(user)}
                style={{
                  border: "none",
                  background: "var(--accent-strong)",
                  color: "#fff",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "var(--transition)",
                  flexShrink: 0,
                }}
              >
                + Додати
              </button>
            </li>
          ))
        ) : query ? (
          <li style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>
            Нічого не знайдено
          </li>
        ) : null}
      </ul>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
        <button
          onClick={onClose}
          style={{
            border: "1.5px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 16px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "var(--transition)",
          }}
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}