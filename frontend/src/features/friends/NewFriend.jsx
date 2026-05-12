import { useState, useEffect, useContext } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { UserPlus } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function NewFriend({ onClose }) {
  const { friendships, friendRequests, addFriend, findFriend, searchResults } =
    useContext(FriendsContext);
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState("");

  useEffect(() => { findFriend(query); }, [query, findFriend]);

  function handleAdd(u) {
    addFriend(u._id);
    onClose();
  }

  const filteredUsers = searchResults.filter(
    (u) =>
      u._id !== user._id &&
      !friendships.some((f) => f.users.some((fu) => fu._id === u._id)) &&
      !friendRequests.some((r) => r.requester?._id === u._id)
  );

  return (
    <div>
      <div className="modal-header">
        <h2>Додати друга</h2>
        <p>Знайди користувача за іменем або нікнеймом</p>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Пошук</label>
        <input
          type="text"
          className="modal-input"
          placeholder="Ім'я або @нікнейм..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <li
              key={u._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <img
                src={u.avatar
                  ? `${API_URL}/uploads/${u.avatar}`
                  : `${API_URL}/uploads/default-avatar.png`}
                alt={u.username}
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {u.fullName || u.username}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  @{u.username}
                </div>
              </div>
              <button
                className="modal-btn modal-btn-primary"
                style={{ height: "32px", padding: "0 14px", fontSize: "0.8rem" }}
                onClick={() => handleAdd(u)}
              >
                <UserPlus size={14} />
                Додати
              </button>
            </li>
          ))
        ) : query ? (
          <li style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "16px 0", textAlign: "center" }}>
            Нічого не знайдено
          </li>
        ) : null}
      </ul>

      <div className="modal-footer">
        <button className="modal-btn modal-btn-secondary" onClick={onClose}>
          Скасувати
        </button>
      </div>
    </div>
  );
}