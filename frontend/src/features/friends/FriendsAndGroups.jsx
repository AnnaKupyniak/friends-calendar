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
    loading
  } = useContext(FriendsContext);
  
  const { user } = useContext(AuthContext); 

  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  if (loading) {
    return <p>Завантаження...</p>;
  }

  const getFriendFromFriendship = (friendship) => {
    if (!user || !friendship.users) return null;
    return friendship.users.find(u => u._id?.toString() !== user._id?.toString());
  };

  return (
    <div className="friends-list">
      <div>
        <div className="friends-header">
          <h2>Друзі</h2>
          <button onClick={() => setIsFriendModalOpen(true)}>Add friend</button>
          <Modal
            isOpen={isFriendModalOpen}
            onClose={() => setIsFriendModalOpen(false)}
          >
            <NewFriend onClose={() => setIsFriendModalOpen(false)} />
          </Modal>
        </div>
        <ul>
          {friendships.length > 0 ? (
            friendships.map((friendship) => {
              const friend = getFriendFromFriendship(friendship);
              if (!friend) return null;
              
              return (
                <li key={friendship._id}>
                  <button onClick={() => onSelectFriend(friend)}>
                    {friend.fullName || friend.username}
                  </button>
                </li>
              );
            })
          ) : (
            <li>У вас немає друзів</li>
          )}
        </ul>
      </div>

      {/* Секція груп */}
      <div>
        <div className="friends-header">
          <h2>Групи</h2>
          <button onClick={() => setIsGroupModalOpen(true)}>Create group</button>
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
        <ul>
          {groups.length > 0 ? (
            groups.map((group) => (
              <li key={group._id}>
                <button onClick={() => onSelectGroup(group)}>
                  {group.name}
                </button>
              </li>
            ))
          ) : (
            <li>У вас немає груп</li>
          )}
        </ul>
      </div>
    </div>
  );
}