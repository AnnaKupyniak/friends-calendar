import { useContext, useEffect, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function AddMember({ onClose }) {
  const {
    selectedEntity,
    getFriendsList,
    addMembersToGroup,
    removeMemberFromGroup,
  } = useContext(FriendsContext);

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (selectedEntity?.data?.members) {
      setMembers(selectedEntity.data.members);
    }
  }, [selectedEntity]);

  const friendsList = getFriendsList() || [];

  const availableFriends = friendsList.filter((f) => {
    const user = f.user;
    if (!user) return false;

    const search = query.toLowerCase().trim();

    const isAlreadyMember = members.some((m) => m._id === user._id);
    if (isAlreadyMember) return false;

    if (!search) return true;

    const fullName = user.fullName?.toLowerCase() || "";
    const username = user.username?.toLowerCase() || "";

    return fullName.includes(search) || username.includes(search);
  });

  async function handleAddMember(user) {
    setMembers((prev) => [...prev, user]);
    try {
      await addMembersToGroup(selectedEntity.data._id, [user._id]);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemoveMember(userId) {
    setMembers((prev) => prev.filter((m) => m._id !== userId));
    try {
      if (removeMemberFromGroup) {
        await removeMemberFromGroup(selectedEntity.data._id, userId);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="add-member-modal">
      <div className="modal-header">
        <h2 className="mycal-content-title">Учасники групи</h2>
        <p className="mycal-subtitle">{selectedEntity?.data?.name}</p>
      </div>

      <div className="modal-form-group" style={{ marginTop: "20px" }}>
        <label className="modal-label">Пошук друзів</label>
        <input
          type="text"
          className="modal-input"
          placeholder="Почніть вводити ім'я..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div
        className="members-list-container"
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          marginBottom: "20px",
        }}
      >
        {availableFriends.length > 0 && (
          <div className="members-section">
            <label className="modal-label">Можна додати</label>
            {availableFriends.map((f) => {
              const user = f.user;
              if (!user?._id) return null;

              return (
                <div key={user._id} className="member-item-row">
                  <div className="member-info">
                    <img
                      src={
                        user.avatar
                          ? `${API_URL}/uploads/${user.avatar}`
                          : `${API_URL}/uploads/default-avatar.png`
                      }
                      className="mycal-avatar"
                      style={{ width: "32px", height: "32px" }}
                      alt={user.username}
                    />
                    <span className="mycal-username">
                      {user.fullName || user.username}
                    </span>
                  </div>
                  <button
                    className="mycal-clear-btn"
                    onClick={() => handleAddMember(user)}
                  >
                    Додати
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="members-section" style={{ marginTop: "20px" }}>
          <label className="modal-label">Вже в групі</label>

          {members.length === 0 ? (
            <p
              className="mycal-subtitle"
              style={{ textAlign: "center", padding: "10px" }}
            >
              Учасників ще немає
            </p>
          ) : (
            members.map((member) => {
              if (!member?._id) return null;

              return (
                <div key={member._id} className="member-item-row">
                  <div className="member-info">
                    <img
                      src={
                        member.avatar
                          ? `${API_URL}/uploads/${member.avatar}`
                          : `${API_URL}/uploads/default-avatar.png`
                      }
                      className="mycal-avatar"
                      style={{ width: "32px", height: "32px" }}
                      alt={member.username}
                    />
                    <span className="mycal-username">
                      {member.fullName || member.username}
                    </span>
                  </div>
                  <button
                    className="modal-btn-secondary"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "8px",
                      border: "none",
                    }}
                    onClick={() => handleRemoveMember(member._id)}
                  >
                    Видалити
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="modal-footer">
        <button className="modal-btn modal-btn-primary" onClick={onClose}>
          Готово
        </button>
      </div>

      <style>{`
        .member-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }
        .member-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .members-section .modal-label {
          margin-bottom: 12px;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
