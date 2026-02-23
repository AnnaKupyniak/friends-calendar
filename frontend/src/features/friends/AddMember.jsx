import { useContext, useMemo, useEffect, useState } from "react";
import { FriendsContext } from "../../context/FriendsContext";

export default function AddMember({ onClose }) {
  const {
    selectedEntity,
    getFriendsList,
    addMembersToGroup,
    removeMemberFromGroup,
  } = useContext(FriendsContext);

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState(selectedEntity?.data?.members || []);

  useEffect(() => {
    if (selectedEntity?.data?.members) {
      setMembers(selectedEntity.data.members);
    }
  }, [selectedEntity?.data?.members]);

  const friendsList = useMemo(() => getFriendsList() || [], [getFriendsList]);

  const availableFriends = useMemo(() => {
    const search = query.toLowerCase().trim();
    return friendsList.filter((f) => {
      const user = f.user;
      if (!user) return false;
      const isAlreadyMember = members.some((m) => m._id === user._id);
      if (isAlreadyMember) return false;

      const fullName = user.fullName?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";

      return fullName.includes(search) || username.includes(search);
    });
  }, [query, friendsList, members]);

  async function handleAddMember(user) {
    setMembers((prev) => [...prev, user]);
    await addMembersToGroup(selectedEntity.data._id, [user._id]);
  }

  async function handleRemoveMember(userId) {
    setMembers((prev) => prev.filter((m) => m._id !== userId));
    if (removeMemberFromGroup) {
      await removeMemberFromGroup(selectedEntity.data._id, userId);
    }
  }

  return (
    <div className="p-4" style={{
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      width: "400px",
      maxHeight: "80vh",
      overflowY: "auto"
    }}>
      <h2 className="mb-3" style={{ fontWeight: 600 }}>Додати учасника</h2>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Пошук серед друзів..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <ul className="list-group mb-3">
        {availableFriends.length > 0 ? (
          availableFriends.map((f) => (
            <li key={f.user._id} className="list-group-item d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <img
                  src={f.user.avatar || "/default-avatar.png"}
                  alt=""
                  className="rounded-circle"
                  style={{ width: "36px", height: "36px", objectFit: "cover" }}
                />
                <span>{f.user.fullName || f.user.username}</span>
              </div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleAddMember(f.user)}
              >
                Додати
              </button>
            </li>
          ))
        ) : (
          <li className="list-group-item text-muted">
            {query ? "Нікого не знайдено" : "Всі друзі вже додані"}
          </li>
        )}
      </ul>

      <hr />

      <h3 className="mb-2" style={{ fontWeight: 500 }}>Учасники {selectedEntity.data.name}</h3>
      <ul className="list-group mb-3">
        {members.map((member) => (
          <li key={member._id} className="list-group-item d-flex justify-content-between align-items-center">
            {member.fullName}
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleRemoveMember(member._id)}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>

      <button
        className="btn w-100"
        style={{
          background: "#0d6efd",
          color: "#fff",
          borderRadius: "8px",
          fontWeight: 500,
          padding: "8px 0"
        }}
        onClick={onClose}
      >
        Готово
      </button>
    </div>
  );
}