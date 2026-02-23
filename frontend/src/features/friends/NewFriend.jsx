import { useState, useEffect, useContext } from "react";
import { FriendsContext } from "../../context/FriendsContext.jsx";

export default function NewFriend({ onClose }) {
  const { friendships, addFriend, findFriend, searchResults } =
    useContext(FriendsContext);

  const [query, setQuery] = useState("");

  useEffect(() => {
    findFriend(query);
  }, [query]);

  function handleSearch(e) {
    setQuery(e.target.value);
  }

  function handleAdd(user) {
    addFriend(user._id);
    onClose();
  }

  const filteredUsers = searchResults.filter(
    (u) => !friendships.some((f) => f.users.some((user) => user._id === u._id))
  );

  return (
    <div className="card p-3 shadow-sm" style={{ maxWidth: "400px" }}>
      <h2 className="mb-3">Додати друга</h2>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Пошук користувача..."
          value={query}
          onChange={handleSearch}
        />
      </div>

      <ul className="list-group mb-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li
              key={user._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {user.fullName || user.username}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleAdd(user)}
              >
                Додати
              </button>
            </li>
          ))
        ) : query ? (
          <li className="list-group-item text-muted">Нічого не знайдено</li>
        ) : null}
      </ul>

      <div className="d-flex justify-content-end">
        <button className="btn btn-secondary" onClick={onClose}>
          Скасувати
        </button>
      </div>
    </div>
  );
}