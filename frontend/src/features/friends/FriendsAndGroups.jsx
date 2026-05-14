import { useContext, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import NewFriend from "./NewFriend";
import NewGroup from "./NewGroup";
import "./FriendsAndGroups.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function FriendsAndGroups() {
  const {
    friendships = [],
    friendRequests = [],
    groups = [],
    addGroup,
    acceptFriendRequest,
    declineFriendRequest,
    onSelectFriend,
    onSelectGroup,
    loading,
  } = useContext(FriendsContext);

  const { user } = useContext(AuthContext);

  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState({ type: null, id: null });

  if (loading) {
    return (
      <div className="friends-list">
        <div>
          <div className="friends-header">
            <h2 className="skeleton" style={{ width: "60px", height: "14px" }}>&nbsp;</h2>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="friend-button" style={{ pointerEvents: "none" }}>
              <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
              <div className="skeleton" style={{ width: "100px", height: "16px" }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getFriendFromFriendship = (friendship) => {
    if (!user || !friendship.users) return null;
    return friendship.users.find(
      (u) => u._id?.toString() !== user._id?.toString()
    );
  };

  return (
    <div className="friends-list">

      {/* Запити у друзі (відображаємо тільки якщо є) */}
      {friendRequests.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div className="friends-header">
            <h2 style={{ color: "var(--accent-strong)" }}>Запити ({friendRequests.length})</h2>
          </div>
          <ul className="list-unstyled">
            {friendRequests.map((req) => (
              <li key={req._id} style={{ marginBottom: "8px" }}>
                <div className="friend-button" style={{ cursor: "default", gap: "10px" }}>
                  <img
                    src={req.requester?.avatar
                      ? `${API_URL}/uploads/${req.requester.avatar}`
                      : `${API_URL}/uploads/default-avatar.png`}
                    alt={req.requester?.username}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {req.requester?.fullName || req.requester?.username}
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => acceptFriendRequest(req.requester._id)}
                        style={{ padding: '6px 12px' }}
                      >
                        Прийняти
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => declineFriendRequest(req.requester._id)}
                        style={{ padding: '6px 12px' }}
                      >
                        Відхилити
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
        </div>
      )}

      {/* Друзі */}
      <div>
        <div className="friends-header">
          <h2>Друзі</h2>
          <button 
            className="action-button"
            onClick={() => setIsFriendModalOpen(true)}
          >
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
          <button 
            className="action-button"
            onClick={() => setIsGroupModalOpen(true)}
          >
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
                    <img
                      src={
                        group.avatar
                          ? `${API_URL}/uploads/${group.avatar}`
                          : `${API_URL}/uploads/default-avatar.png`
                      }
                      alt={group.name}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: isActive ? "2px solid var(--accent-strong)" : "2px solid var(--border)",
                        flexShrink: 0
                      }}
                    />
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