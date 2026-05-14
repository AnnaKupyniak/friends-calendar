import "./Memories.css";
import CreateMemory from "./CreateMemory";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import { useState, useEffect, useRef, useContext, useMemo } from "react";
import dayjs from "dayjs";
import MemoryCard from "./MemoryCard";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { MemoriesContext } from "../../context/MemoriesContext.jsx";
import { MemoriesSearch } from "./MemoriesSearch.jsx";
import AddMember from "../../features/friends/AddMember.jsx";
import { useNavigate } from "react-router-dom";
import { MessageCircle, LayoutGrid, List, MoreVertical, Plus, ImageOff } from "lucide-react";

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
  const [viewMode, setViewMode] = useState("grid"); // "grid" або "list"

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
    const initForm = () => {
      if (isEditGroupModalOpen && selectedEntity?.data) {
        setEditGroupForm({ name: selectedEntity.data.name });
        setAvatarPreview(
          selectedEntity.data.avatar
            ? `http://localhost:5000/uploads/${selectedEntity.data.avatar}`
            : null,
        );
      }
    };
    initForm();
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

  const entityTypeMap = useMemo(() => ({ friend: "Friendship", group: "Group" }), []);

  const filteredMemories = useMemo(() => {
    if (!selectedEntity) return [];
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
  }, [memories, searchResults, isSearching, selectedEntity, category, selectedDate, entityTypeMap]);

  if (!selectedEntity) {
    return (
      <div className="memories-container">
        <p className="placeholder">Виберіть друга або групу</p>
      </div>
    );
  }

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
    <>
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
          <div className="header-title-text">
            <h1>
              {selectedEntity?.type === "friend" && getFriendName()}
              {selectedEntity?.type === "group" && selectedEntity.data.name}
            </h1>
          </div>
        </div>

        <div className="header-controls">
          {selectedEntity?.type === "friend" && (
            <button
              className="mem-icon-btn"
              onClick={() => navigate(`/chat/${selectedEntity.data.user?._id}`)}
              title="Відкрити чат"
            >
              <MessageCircle size={16} />
            </button>
          )}

          <button
            className="mem-icon-btn mem-view-btn"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            title={viewMode === "grid" ? "Список" : "Сітка"}
          >
            {viewMode === "grid" ? <List size={16} /> : <LayoutGrid size={16} />}
          </button>

          <div className="settings-menu-container" ref={menuRef}>
            <button
              className="mem-icon-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Меню"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="settings-dropdown">
                {selectedEntity?.type === "friend" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const friendId = selectedEntity.data.user?._id;
                      if (friendId) removeFriend(friendId);
                      setIsMenuOpen(false);
                    }}
                    className="dropdown-btn"
                  >
                    Видалити друга
                  </Button>
                )}

                {selectedEntity?.type === "group" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditGroupForm({ name: selectedEntity.data.name });
                        setIsEditGroupModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="dropdown-btn"
                    >
                      Редагувати групу
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsAddFriendModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="dropdown-btn"
                    >
                      Додати учасника
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        deleteGroup(selectedEntity.data._id);
                        setIsMenuOpen(false);
                      }}
                      className="dropdown-btn"
                    >
                      Видалити групу
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="memories-container">
        <div className="memories-toolbar">
          <div className="toolbar-search">
            <MemoriesSearch />
          </div>
          <button
            className="mem-add-btn"
            onClick={() => setModalIsOpen(true)}
          >
            <Plus size={15} />
            Додати спогад
          </button>
        </div>

        {filteredMemories.length > 0 ? (
          <div className={`memories-${viewMode}`}>
            {filteredMemories.map((memory) => (
              <MemoryCard key={memory._id} memory={memory} />
            ))}
          </div>
        ) : (
          <div className="no-memories">
            <ImageOff size={44} strokeWidth={1.2} className="no-memories-icon" />
            <p>Немає спогадів для відображення</p>
            <button
              className="no-memories-cta"
              onClick={() => setModalIsOpen(true)}
            >
              <Plus size={15} />
              Створити перший спогад
            </button>
          </div>
        )}

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
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsEditGroupModalOpen(false)}
                >
                  Скасувати
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                >
                  Зберегти
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
