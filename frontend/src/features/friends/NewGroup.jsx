import { useState, useEffect, useContext, useRef } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { ImagePlus, Check } from "lucide-react";

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
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
  }, [avatarPreview]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!groupName.trim()) return;

    const formData = new FormData();
    formData.append("name", groupName.trim());
    formData.append("members", JSON.stringify(selectedMembers));
    if (avatar) formData.append("avatar", avatar);

    onAddGroup(formData);
    onClose();
  }

  return (
    <div className="new-group-modal">
      <div className="modal-header">
        <h2>Створити нову групу</h2>
        <p>Об'єднайте друзів для спільних моментів</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Avatar upload */}
        <div className="modal-avatar-upload">
          <div
            className="modal-avatar-circle"
            onClick={() => fileInputRef.current.click()}
            title="Вибрати аватар"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Аватар групи" />
            ) : (
              <>
                <ImagePlus size={22} strokeWidth={1.5} />
                <span>Аватар</span>
              </>
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

        <div className="members-scroll">
          {availableFriends.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", padding: "12px" }}>
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
                  className={`member-row${isSelected ? " selected" : ""}`}
                  onClick={() => toggleMember(id)}
                >
                  <img
                    src={f.user?.avatar
                      ? `${API_URL}/uploads/${f.user.avatar}`
                      : `${API_URL}/uploads/default-avatar.png`}
                    alt={f.user?.username}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="member-name">{f.user?.fullName || f.user?.username}</p>
                    <p className="member-username">@{f.user?.username}</p>
                  </div>
                  {isSelected && (
                    <Check size={16} className="member-check" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
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
