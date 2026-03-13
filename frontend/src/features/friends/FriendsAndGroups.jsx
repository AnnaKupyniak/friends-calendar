import { useContext, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import Modal from "../../components/Modal/Modal";
import NewFriend from "./NewFriend";
import NewGroup from "./NewGroup";
import "./FriendsAndGroups.css";

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

  if (loading) {
    return <p>Завантаження...</p>;
  }

  const getFriendFromFriendship = (friendship) => {
    if (!user || !friendship.users) return null;
    return friendship.users.find(
      (u) => u._id?.toString() !== user._id?.toString(),
    );
  };

  return (
    <div className="friends-list">
      <div>
        <div className="friends-header d-flex justify-content-between align-items-center">
          <h2>Друзі</h2>
          <button
            className="action-button"
            onClick={() => {
              (setActiveItem({ type: "friend", id: friend._id?.toString() }),
                setIsFriendModalOpen(true));
            }}
          >
            Додати друга
          </button>
          <Modal
            isOpen={isFriendModalOpen}
            onClose={() => setIsFriendModalOpen(false)}
          >
            <NewFriend onClose={() => setIsFriendModalOpen(false)} />
          </Modal>
        </div>

        <ul className="list-unstyled mt-2">
          {friendships.length > 0 ? (
            friendships.map((friendship) => {
              const friend = getFriendFromFriendship(friendship);
              if (!friend) return null;

              const isActive =
                activeItem.type === "friend" && activeItem.id === friend._id;

              return (
                <li key={friendship._id} className="mb-1">
                  <button
                    className={`friend-button ${isActive ? "active-item" : ""}`}
                    onClick={() => {
                      setActiveItem({ type: "friend", id: friend._id });
                      onSelectFriend(friend);
                    }}
                  >
                    <img
                      src={
                        friend.avatar
                          ? `http://localhost:5000/uploads/${friend.avatar}`
                          : `http://localhost:5000/uploads/default-avatar.png`
                      }
                      alt={friend.username}
                      className="rounded-circle object-fit-cover"
                      width="35"
                      height="35"
                    />
                    <span>{friend.fullName || friend.username}</span>
                  </button>
                </li>
              );
            })
          ) : (
            <li>У вас немає друзів</li>
          )}
        </ul>
      </div>

      {/* Групи */}
      <div className="mt-4">
        <div className="friends-header d-flex justify-content-between align-items-center">
          <h2>Групи</h2>
          <button
            className="action-button"
            onClick={() => setIsGroupModalOpen(true)}
          >
            + Групу
          </button>
          <Modal
            isOpen={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
          >
            <NewGroup
              onClose={() => setIsGroupModalOpen(false)}
              onAddGroup={addGroup}
            />
          </Modal>
        </div>

        <ul className="list-unstyled mt-2">
          {groups.length > 0 ? (
            groups.map((group) => {
              const isActive =
                activeItem.type === "group" && activeItem.id === group._id;

              return (
                <li key={group._id} className="mb-1">
                  <button
                    className={`friend-button ${isActive ? "active-item" : ""}`}
                    onClick={() => {
                      setActiveItem({
                        type: "group",
                        id: group._id?.toString(),
                      });
                      onSelectGroup(group);
                    }}
                  >
                    <span>{group.name}</span>
                  </button>
                </li>
              );
            })
          ) : (
            <li>У вас немає груп</li>
          )}
        </ul>
      </div>
    </div>
  );
}
