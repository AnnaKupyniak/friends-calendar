import { useState, useEffect, useContext, useRef } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";

const API_URL = import.meta.env.VITE_API_URL;

export default function NewGroup({ onClose, onAddGroup }) {
  const { getFriendsList } = useContext(FriendsContext);

  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const friendsList = getFriendsList() || [];

  const availableFriends = friendsList.filter((f) => {
    const value = query.toLowerCase().trim();
    if (!value) return true;

    const fullName = f.user?.fullName?.toLowerCase() || "";
    const username = f.user?.username?.toLowerCase() || "";

    return fullName.includes(value) || username.includes(value);
  });

  function toggleMember(id) {
    if (!id) return;

    setSelectedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((m) => m !== id)
        : [...prev, id]
    );
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!groupName.trim()) return;

    const formData = new FormData();
    formData.append("name", groupName.trim());
    formData.append("members", JSON.stringify(selectedMembers));

    if (avatar) {
      formData.append("avatar", avatar);
    }

    onAddGroup(formData);
    onClose();
  }

  return (
    <div className="new-group-modal">
      <div className="modal-header">
        <h2 className="mycal-content-title">Створити нову групу</h2>
        <p className="mycal-subtitle">
          Об'єднайте друзів для спільних моментів
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        {/* Avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "30px",
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              border: "2px dashed var(--primary)",
              position: "relative",
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                alt="Avatar Preview"
              />
            ) : (
              <div
                style={{ textAlign: "center", color: "var(--primary)" }}
              >
                <span style={{ fontSize: "24px", display: "block" }}>
                  📸
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700 }}>
                  АВАТАР
                </span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="modal-form-group">
          <label className="modal-label">Назва групи</label>
          <input
            type="text"
            className="modal-input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Наприклад: Найкращі друзі"
            required
            autoFocus
          />
        </div>

        <div className="modal-form-group">
          <label className="modal-label">Додати учасників</label>
          <input
            type="text"
            className="modal-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук друга..."
          />
        </div>

        <div
          className="members-scroll"
          style={{
            maxHeight: "180px",
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "8px",
          }}
        >
          {availableFriends.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-light)",
                fontSize: "0.8rem",
                padding: "10px",
              }}
            >
              Друзів не знайдено
            </p>
          ) : (
            availableFriends.map((f) => {
              const id = f.user?._id;
              if (!id) return null;

              const isSelected = selectedMembers.includes(id);

              return (
                <div
                  key={id}
                  onClick={() => toggleMember(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    transition: "all 0.2s",
                    background: isSelected
                      ? "var(--primary-light)"
                      : "transparent",
                    marginBottom: "4px",
                  }}
                >
                  <img
                    src={
                      f.user?.avatar
                        ? `${API_URL}/uploads/${f.user.avatar}`
                        : `${API_URL}/uploads/default-avatar.png`
                    }
                    alt={f.user?.username}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: isSelected
                        ? "2px solid var(--primary)"
                        : "2px solid transparent",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {f.user?.fullName || f.user?.username}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-light)",
                        margin: 0,
                      }}
                    >
                      @{f.user?.username}
                    </p>
                  </div>

                  {isSelected && (
                    <span style={{ color: "var(--primary)" }}>✅</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
          >
            Скасувати
          </button>
          <button type="submit" className="modal-btn modal-btn-primary">
            Створити групу
          </button>
        </div>
      </form>
    </div>
  );
}
