import { useState, useEffect, useContext, useMemo } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";

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

    const results = friendsList.filter((f) => {
      const fullName = f.user?.fullName?.toLowerCase() || "";
      const username = f.user?.username?.toLowerCase() || "";

      return fullName.includes(value) || username.includes(value);
    });

    setAvailableFriends(results);
  }

  function addMember(id) {
    if (!selectedMembers.includes(id)) {
      setSelectedMembers((prev) => [...prev, id]);
    }
  }

  function removeMember(id) {
    setSelectedMembers((prev) => prev.filter((m) => m !== id));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!groupName.trim()) return;

    const newGroup = {
      name: groupName.trim(),
      members: selectedMembers,
      categories: [],
    };

    onAddGroup(newGroup);
    onClose();
  }

  return (
    <div className="card p-3 shadow-sm" style={{ maxWidth: "400px" }}>
      <h2 className="mb-3">Створити групу</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Назва групи</label>
          <input
            type="text"
            className="form-control"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Введіть назву..."
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Шукати друзів</label>
          <input
            type="text"
            className="form-control"
            value={query}
            onChange={handleSearch}
            placeholder="Шукати друга..."
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Доступні друзі</label>
          <ul className="list-group">
            {availableFriends.map((friend) => {
              const id = friend.user?._id;
              const name =
                friend.user?.fullName || friend.user?.username || "Unknown";

              return (
                <li
                  key={id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {name} ({friend.user?.username})
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => addMember(id)}
                  >
                    Додати
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-3">
          <label className="form-label">Вибрані учасники</label>
          <ul className="list-group">
            {selectedMembers.map((memberId) => {
              const member = friendsList.find(
                (f) => f.user?._id === memberId
              );

              if (!member) return null;

              const name = member.user.fullName || member.user.username;

              return (
                <li
                  key={memberId}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {name} ({member.user.username})
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeMember(memberId)}
                  >
                    ❌
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn"
            onClick={onClose}
          >
            Скасувати
          </button>
          <button type="submit" className="btn">
            Створити
          </button>
        </div>
      </form>
    </div>
  );
}