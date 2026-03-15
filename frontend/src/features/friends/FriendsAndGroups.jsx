import { useContext, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import Modal from "../../components/Modal/Modal";
import NewFriend from "./NewFriend";
import NewGroup from "./NewGroup";
import "./FriendsAndGroups.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function FriendsAndGroups() {
  const {
    friendships = [],
    groups = [],
    addGroup,
    onSelectFriend,
    onSelectGroup,
    loading,
  } = useContext(FriendsContext);

  const { user } = useContext(AuthContext);

  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState({ type: null, id: null });

  if (loading) return <p>Завантаження...</p>;

  const getFriendFromFriendship = (friendship) => {
    if (!user || !friendship.users) return null;
    return friendship.users.find(
      (u) => u._id?.toString() !== user._id?.toString()
    );
  };

  return (
    <div className="friends-list">

      {/* Друзі */}
      <div>
        <div className="friends-header">
          <h2>Друзі</h2>
          <button className="action-button" onClick={() => setIsFriendModalOpen(true)}>
            + Додати
          </button>
          <Modal isOpen={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)}>
            <NewFriend onClose={() => setIsFriendModalOpen(false)} />
          </Modal>
        </div>

        <ul className="list-unstyled">
          {friendships.length > 0 ? (
            friendships.map((friendship) => {
              const friend = getFriendFromFriendship(friendship);
              if (!friend) return null;
              const isActive = activeItem.type === "friend" && activeItem.id === friend._id;

              return (
                <li key={friendship._id}>
                  <button
                    className={`friend-button ${isActive ? "active-item" : ""}`}
                    onClick={() => {
                      setActiveItem({ type: "friend", id: friend._id });
                      onSelectFriend(friend);
                    }}
                  >
                    <img
                      src={friend.avatar
                        ? `${API_URL}/uploads/${friend.avatar}`
                        : `${API_URL}/uploads/default-avatar.png`}
                      alt={friend.username}
                    />
                    <span>{friend.fullName || friend.username}</span>
                  </button>
                </li>
              );
            })
          ) : (
            <li style={{ fontSize: "0.82rem", color: "var(--text-muted)", padding: "8px" }}>
              Друзів ще немає
            </li>
          )}
        </ul>
      </div>

      {/* Групи */}
      <div>
        <div className="friends-header">
          <h2>Групи</h2>
          <button className="action-button" onClick={() => setIsGroupModalOpen(true)}>
            + Створити
          </button>
          <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)}>
            <NewGroup onClose={() => setIsGroupModalOpen(false)} onAddGroup={addGroup} />
          </Modal>
        </div>

        <ul className="list-unstyled">
          {groups.length > 0 ? (
            groups.map((group) => {
              const isActive = activeItem.type === "group" && activeItem.id === group._id;

              return (
                <li key={group._id}>
                  <button
                    className={`friend-button ${isActive ? "active-item" : ""}`}
                    onClick={() => {
                      setActiveItem({ type: "group", id: group._id?.toString() });
                      onSelectGroup(group);
                    }}
                  >
                    {/* Іконка групи з ініціалами */}
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                      background: isActive
                        ? "rgba(255,255,255,0.25)"
                        : "linear-gradient(135deg, var(--accent-soft), var(--accent-strong))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 700,
                      color: isActive ? "#fff" : "#fff",
                      border: isActive ? "2px solid rgba(255,255,255,0.4)" : "2px solid transparent"
                    }}>
                      {group.name?.charAt(0).toUpperCase()}
                    </div>
                    <span>{group.name}</span>
                  </button>
                </li>
              );
            })
          ) : (
            <li style={{ fontSize: "0.82rem", color: "var(--text-muted)", padding: "8px" }}>
              Груп ще немає
            </li>
          )}
        </ul>
      </div>

    </div>
  );
}