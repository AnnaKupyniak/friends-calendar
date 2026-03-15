import { useState, useEffect, useContext, useMemo } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text-primary)",
  fontSize: "0.88rem",
  outline: "none",
  transition: "var(--transition)",
};

const labelStyle = {
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: "6px",
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function NewGroup({ onClose, onAddGroup }) {
  const { getFriendsList } = useContext(FriendsContext);

  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [availableFriends, setAvailableFriends] = useState([]);

  const friendsList = useMemo(() => getFriendsList() || [], [getFriendsList]);

  useEffect(() => {
    setAvailableFriends(friendsList);
  }, [friendsList]);

  function handleSearch(e) {
    const value = e.target.value.toLowerCase().trim();
    setQuery(value);
    if (!value) {
      setAvailableFriends(friendsList);
      return;
    }
    setAvailableFriends(friendsList.filter((f) => {
      const fullName = f.user?.fullName?.toLowerCase() || "";
      const username = f.user?.username?.toLowerCase() || "";
      return fullName.includes(value) || username.includes(value);
    }));
  }

  function toggleMember(id) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!groupName.trim()) return;
    onAddGroup({ name: groupName.trim(), members: selectedMembers, categories: [] });
    onClose();
  }

  return (
    <div style={{ width: "400px", padding: "24px" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>
        Створити групу
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Назва */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Назва групи</label>
          <input
            type="text"
            style={inputStyle}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Введіть назву..."
            required
            autoFocus
          />
        </div>

        {/* Пошук */}
        <div style={{ marginBottom: "10px" }}>
          <label style={labelStyle}>Додати учасників</label>
          <input
            type="text"
            style={inputStyle}
            value={query}
            onChange={handleSearch}
            placeholder="Пошук друга..."
          />
        </div>

        {/* Список друзів */}
        <div style={{
          maxHeight: "200px",
          overflowY: "auto",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "16px",
        }}>
          {availableFriends.length === 0 ? (
            <div style={{ padding: "12px", fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
              Друзів не знайдено
            </div>
          ) : (
            availableFriends.map((f) => {
              const id = f.user?._id;
              const name = f.user?.fullName || f.user?.username || "Unknown";
              const isSelected = selectedMembers.includes(id);

              return (
                <div
                  key={id}
                  onClick={() => toggleMember(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    transition: "var(--transition)",
                    background: isSelected ? "linear-gradient(135deg, var(--accent-strong), #7c3aed)" : "transparent",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <img
                    src={f.user?.avatar
                      ? `${API_URL}/uploads/${f.user.avatar}`
                      : `${API_URL}/uploads/default-avatar.png`}
                    alt={f.user?.username}
                    style={{
                      width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover",
                      border: isSelected ? "2px solid rgba(255,255,255,0.4)" : "2px solid var(--border)",
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, color: isSelected ? "#fff" : "var(--text-primary)" }}>
                      {name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: isSelected ? "rgba(255,255,255,0.65)" : "var(--text-muted)" }}>
                      @{f.user?.username}
                    </div>
                  </div>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isSelected ? "#fff" : "var(--border)"}`,
                    background: isSelected ? "#fff" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", color: "var(--accent-strong)", fontWeight: 700
                  }}>
                    {isSelected ? "✓" : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Вибрані */}
        {selectedMembers.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Вибрано: {selectedMembers.length}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {selectedMembers.map((memberId) => {
                const member = friendsList.find((f) => f.user?._id === memberId);
                if (!member) return null;
                const name = member.user.fullName || member.user.username;
                return (
                  <span
                    key={memberId}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      background: "var(--border)", borderRadius: "99px",
                      padding: "3px 10px 3px 8px", fontSize: "0.78rem",
                      color: "var(--text-primary)", fontWeight: 500,
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleMember(memberId)}
                      style={{
                        border: "none", background: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: "0.75rem",
                        padding: 0, lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1.5px solid var(--border)", background: "none",
              color: "var(--text-muted)", borderRadius: "var(--radius-sm)",
              padding: "6px 16px", fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", transition: "var(--transition)",
            }}
          >
            Скасувати
          </button>
          <button
            type="submit"
            style={{
              border: "none", background: "var(--accent-strong)", color: "#fff",
              borderRadius: "var(--radius-sm)", padding: "6px 16px",
              fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
              transition: "var(--transition)",
            }}
          >
            Створити
          </button>
        </div>
      </form>
    </div>
  );
}