import "./Memories.css";
import CreateMemory from "./CreateMemory";
import Modal from "../../components/Modal/Modal";
import { useState, useEffect, useRef, useContext, useMemo } from "react";
import dayjs from "dayjs";
import MemoryCard from "./MemoryCard";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";
import AddMember from "../../features/friends/AddMember.jsx";
import { useNavigate } from "react-router-dom";

export default function Memories({ category }) {
  const [isModalOpen, setModalIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { memories, selectedDate } = useContext(MemoriesContext);
  const { selectedEntity, removeFriend, deleteGroup } =
    useContext(FriendsContext);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedEntity) {
    return (
      <div className="memories-container">
        <p className="placeholder">Виберіть друга або групу</p>
      </div>
    );
  }

  const entityTypeMap = { friend: "Friendship", group: "Group" };

  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      if (memory.entityType !== entityTypeMap[selectedEntity.type])
        return false;
      if (memory.entity !== selectedEntity.data._id) return false;
      if (category && category.id !== 0) {
        if (memory.category !== category.name) return false;
      }
      if (selectedDate) {
        return dayjs(memory.date).format("YYYY-MM-DD") === selectedDate;
      }
      return true;
    });
  }, [memories, selectedEntity, category, selectedDate]);

  const getFriendName = () => {
    if (!selectedEntity?.data) return "";
    if (selectedEntity.type === "friend") {
      return (
        selectedEntity.data.user?.fullName ||
        selectedEntity.data.user?.username ||
        "Друг"
      );
    }
    return "";
  };

  return (
    <div className="memories-container">
      <div className="memories-header">
        <h1>
          {selectedEntity?.type === "friend" && getFriendName()}
          {selectedEntity?.type === "group" &&
            `Група: ${selectedEntity.data.name}`}
        </h1>

        <div className="header-controls">
          <button
            onClick={() => navigate(`/chat/${selectedEntity.data.user?._id}`)}
          >
            Чат
          </button>
          <button
            className="add-memory-btn"
            onClick={() => setModalIsOpen(true)}
          >
            + Додати спогад
          </button>

          <div className="settings-menu-container" ref={menuRef}>
            <button
              className="settings-dots-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              ⋮
            </button>

            {isMenuOpen && (
              <div className="settings-dropdown">
                {selectedEntity?.type === "friend" && (
                  <button
                    className="dropdown-item danger"
                    onClick={() => {
                      const friendId = selectedEntity.data.user?._id;
                      if (friendId) removeFriend(friendId);
                      setIsMenuOpen(false);
                    }}
                  >
                    Видалити друга
                  </button>
                )}

                {selectedEntity?.type === "group" && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsAddFriendModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Додати учасника
                    </button>
                    <button
                      className="dropdown-item danger"
                      onClick={() => {
                        deleteGroup(selectedEntity.data._id);
                        setIsMenuOpen(false);
                      }}
                    >
                      Видалити групу
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalIsOpen(false)}>
        <CreateMemory onClose={() => setModalIsOpen(false)} />
      </Modal>

      <Modal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      >
        <AddMember onClose={() => setIsAddFriendModalOpen(false)} />
      </Modal>

      {filteredMemories.length > 0 ? (
        <div className="memories-grid">
          {filteredMemories.map((memory) => (
            <MemoryCard key={memory._id} memory={memory} />
          ))}
        </div>
      ) : (
        <div className="no-memories">
          <p>Немає спогадів для відображення</p>
          <button
            className="create-first-memory"
            onClick={() => setModalIsOpen(true)}
          >
            Створити перший спогад
          </button>
        </div>
      )}
    </div>
  );
}
