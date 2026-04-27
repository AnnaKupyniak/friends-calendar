import "./Memories.css";
import CreateMemory from "./CreateMemory";
import Modal from "../../components/Modal/Modal";
import { useState, useEffect, useRef, useContext, useMemo } from "react";
import dayjs from "dayjs";
import MemoryCard from "./MemoryCard";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";
import { MemoriesSearch } from "../../components/Search/MemoriesSearch.jsx";
import AddMember from "../../features/friends/AddMember.jsx";
import { useNavigate } from "react-router-dom";

export default function Memories({ category }) {
  const [isModalOpen, setModalIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupForm, setEditGroupForm] = useState({ name: "" });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const { memories, searchResults, isSearching, selectedDate } = useContext(MemoriesContext);
  const { selectedEntity, removeFriend, deleteGroup, updateGroup } =
    useContext(FriendsContext);

  const handleEditGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", editGroupForm.name);
      if (selectedAvatar) {
        formData.append("avatar", selectedAvatar);
      }

      await updateGroup(selectedEntity.data._id, formData);
      setIsEditGroupModalOpen(false);
      setSelectedAvatar(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error("Error updating group:", err);
      alert("Помилка при оновленні групи");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (isEditGroupModalOpen && selectedEntity?.data) {
      setEditGroupForm({ name: selectedEntity.data.name });
      setAvatarPreview(
        selectedEntity.data.avatar
          ? `http://localhost:5000/uploads/${selectedEntity.data.avatar}`
          : null,
      );
    }
  }, [isEditGroupModalOpen, selectedEntity]);

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
    const baseMemories = isSearching ? searchResults : memories;
    return baseMemories.filter((memory) => {
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
  }, [memories, searchResults, isSearching, selectedEntity, category, selectedDate]);

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
        <div className="header-title-box">
          {selectedEntity?.type === "group" && (
            <div className="group-header-avatar">
              <img
                src={
                  selectedEntity.data.avatar
                    ? `http://localhost:5000/uploads/${selectedEntity.data.avatar}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEntity.data.name)}&background=random`
                }
                alt={selectedEntity.data.name}
              />
            </div>
          )}
          <h1>
            {selectedEntity?.type === "friend" && getFriendName()}
            {selectedEntity?.type === "group" && selectedEntity.data.name}
          </h1>
        </div>

        <div className="header-search-wrapper">
          <MemoriesSearch />
        </div>

        <div className="header-controls">
          <button
            className="chat-btn"
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
                        setEditGroupForm({ name: selectedEntity.data.name });
                        setIsEditGroupModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Редагувати групу
                    </button>
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

      <Modal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
      >
        <div className="edit-profile-modal-content">
          <h2>Редагувати групу</h2>
          <form onSubmit={handleEditGroupSubmit}>
            <div
              className="profile-avatar-section"
              style={{ marginBottom: "24px" }}
            >
              <div className="profile-avatar-container">
                <img
                  src={
                    avatarPreview ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(editGroupForm.name)}&background=random`
                  }
                  alt="Avatar"
                  className="profile-avatar"
                  style={{ width: "120px", height: "120px" }}
                />
                <label htmlFor="group-avatar-upload" className="avatar-edit-badge">
                  <i className="fas fa-camera"></i>
                </label>
                <input
                  type="file"
                  id="group-avatar-upload"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="groupName">Назва групи</label>
              <input
                type="text"
                id="groupName"
                className="modal-input"
                value={editGroupForm.name}
                onChange={(e) =>
                  setEditGroupForm({ ...editGroupForm, name: e.target.value })
                }
                required
              />
            </div>
            <div className="modal-buttons">
              <button
                type="button"
                onClick={() => setIsEditGroupModalOpen(false)}
                className="modal-btn modal-btn-secondary"
              >
                Скасувати
              </button>
              <button type="submit" className="modal-btn modal-btn-primary">
                Зберегти
              </button>
            </div>
          </form>
        </div>
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
