import { useContext, useState, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FriendsContext } from "../../context/FriendsContext";
import { MemoriesContext } from "../../context/MemoriesContext";
import MemoryCard from "../../features/memories/MemoryCard";
import Button from "../../components/Button/Button";
import { Bar, Doughnut } from "react-chartjs-2";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/uk";
import Modal from "../../components/Modal/Modal";
import axios from "../../api/axiosConfig";
import "./Profile.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

dayjs.extend(isoWeek);
dayjs.locale("uk");

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile() {
  const { user, logout, setUser } = useContext(AuthContext);
  const { friendships, groups = [], updateGroup } = useContext(FriendsContext);
  const { memories } = useContext(MemoriesContext);

  const [selectedFriendshipId, setSelectedFriendshipId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [offset, setOffset] = useState(0);
  const [period, setPeriod] = useState("6m");
  const [sidebarTab, setSidebarTab] = useState("friends");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: user?.fullName || '', username: user?.username || '' });
  const [editGroupForm, setEditGroupForm] = useState({ name: '' });

  const selectedFriendship = friendships.find(
    (f) => f._id === selectedFriendshipId,
  );
  const selectedFriend = selectedFriendship
    ? selectedFriendship.users.find((u) => u && u._id !== user?._id)
    : null;
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) || null;

  const entityMemories = useMemo(() => {
    if (selectedFriendshipId) {
      return memories.filter(
        (m) =>
          m.entityType === "Friendship" &&
          m.entity.toString() === selectedFriendshipId,
      );
    }
    if (selectedGroupId) {
      return memories.filter(
        (m) =>
          m.entityType === "Group" && m.entity.toString() === selectedGroupId,
      );
    }
    return [];
  }, [selectedFriendshipId, selectedGroupId, memories]);

  const { chartData, periodLabel, totalInPeriod, averageValue } =
    useMemo(() => {
      const now = dayjs();
      if (period === "week") {
        const start = now.add(offset, "week").startOf("isoWeek");
        const labels = [];
        const counts = {};
        for (let i = 0; i < 7; i++) {
          const d = start.add(i, "day");
          const key = d.format("YYYY-MM-DD");
          labels.push({ key, label: d.format("dd") });
          counts[key] = 0;
        }
        const end = start.add(6, "day");
        entityMemories.forEach((m) => {
          const key = dayjs(m.date).format("YYYY-MM-DD");
          if (counts[key] !== undefined) counts[key]++;
        });
        const values = labels.map((l) => counts[l.key]);
        const total = values.reduce((a, b) => a + b, 0);
        const avg = (total / 7).toFixed(1);
        return {
          periodLabel: `${start.format("D MMM")} – ${end.format("D MMM")}`,
          totalInPeriod: total,
          averageValue: avg,
          chartData: {
            labels: labels.map((l) => l.label),
            datasets: [
              { data: values, backgroundColor: "#F5811F", borderRadius: 8 },
            ],
          },
        };
      }

      const startMonth = now
        .add(offset * 6, "month")
        .subtract(5, "month")
        .startOf("month");
      const labels = [];
      const counts = {};
      for (let i = 0; i < 6; i++) {
        const m = startMonth.add(i, "month");
        const key = m.format("YYYY-MM");
        labels.push({ key, label: m.format("MMM") });
        counts[key] = 0;
      }
      const endMonth = startMonth.add(5, "month");
      entityMemories.forEach((m) => {
        const key = dayjs(m.date).format("YYYY-MM");
        if (counts[key] !== undefined) counts[key]++;
      });
      const values = labels.map((l) => counts[l.key]);
      const total = values.reduce((a, b) => a + b, 0);
      const avg = (total / 6).toFixed(1);
      return {
        periodLabel: `${startMonth.format("MMM YYYY")} – ${endMonth.format("MMM YYYY")}`,
        totalInPeriod: total,
        averageValue: avg,
        chartData: {
          labels: labels.map((l) => l.label),
          datasets: [
            { data: values, backgroundColor: "#F5811F", borderRadius: 10 },
          ],
        },
      };
    }, [entityMemories, offset, period]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  const placesData = useMemo(() => {
    const placeCounts = {};
    entityMemories.forEach((m) => {
      const place = m.place || "Невідомо";
      placeCounts[place] = (placeCounts[place] || 0) + 1;
    });

    const places = Object.keys(placeCounts);
    const counts = Object.values(placeCounts);

    const colors = [
      "#F5811F",
      "#592E83",
      "#8E44AD",
      "#CAA8F5",
      "#FFA94D",
      "#F1E9FA",
      "#7B3FB5",
      "#E6B5FF",
    ];

    return {
      labels: places,
      datasets: [
        {
          data: counts,
          backgroundColor: colors.slice(0, places.length),
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },
      ],
    };
  }, [entityMemories]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 11, weight: "bold" },
          color: "#6E5A85",
          padding: 12,
          usePointStyle: true,
        },
      },
    },
  };

  const selectedEntityName = selectedFriend
    ? selectedFriend.fullName || selectedFriend.username
    : selectedGroup
      ? selectedGroup.name
      : null;

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/users/profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Помилка при оновленні профілю');
    }
  };

  const handleEditGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateGroup(selectedGroupId, editGroupForm);
      setIsEditingGroup(false);
    } catch (err) {
      console.error('Error updating group:', err);
      alert('Помилка при оновленні групи');
    }
  };
  if (!user) return <div className="loading">Завантаження...</div>;

  return (
    <div className="profile-page">
      {/* --- Profile Hero Section --- */}
      <div className="profile-hero">
        <div className="hero-content">
          <div className="avatar-container">
            <img
              src={
                user.avatar
                  ? `${API_URL}/uploads/${user.avatar}`
                  : `${API_URL}/uploads/default-avatar.png`
              }
              className="profile-avatar-new"
              alt="avatar"
            />
            <div className="status-badge"></div>
          </div>

          <div className="hero-info-wrapper">
            <div className="user-text-main">
              <h1 className="user-display-name">
                {user.fullName || user.username}
              </h1>
              <p className="user-sub-details">
                @{user.username}
              </p>
            </div>
            <div className="hero-buttons">
              <Button 
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
              >
                Редагувати профіль
              </Button>
              <Button 
                variant="secondary"
                size="md"
                onClick={logout}
              >
                Вийти
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={sidebarTab === "friends" ? "active" : ""}
              onClick={() => setSidebarTab("friends")}
            >
              Друзі
            </button>
            <button
              className={sidebarTab === "groups" ? "active" : ""}
              onClick={() => setSidebarTab("groups")}
            >
              Групи
            </button>
          </div>

          <div className="friend-list">
            {sidebarTab === "friends" &&
              friendships.map((f) => {
                const friend = f.users.find((u) => u._id !== user._id) || {}; 
                const isActive = selectedFriendshipId === f._id;

                return (
                  <button
                    key={f._id}
                    className={`friend-item ${isActive ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedFriendshipId(f._id);
                      setSelectedGroupId(null);
                      setOffset(0);
                    }}
                  >
                    <img
                      src={
                        friend.avatar
                          ? `${API_URL}/uploads/${friend.avatar}`
                          : `${API_URL}/uploads/default-avatar.png`
                      }
                      alt={friend.username}
                    />
                    <span>{friend.fullName || friend.username || "Друг"}</span>
                  </button>
                );
              })}

            {sidebarTab === "groups" &&
              groups.map((g) => {
                const isActive = selectedGroupId === g._id;
                return (
                  <button
                    key={g._id}
                    className={`friend-item ${isActive ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedGroupId(g._id);
                      setSelectedFriendshipId(null);
                      setOffset(0);
                    }}
                  >
                    <img
                      src={
                        g.avatar
                          ? `${API_URL}/uploads/${g.avatar}`
                          : `${API_URL}/uploads/default-avatar.png`
                      }
                      alt={g.name}
                    />
                    <span>{g.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="stats">
          {selectedEntityName ? (
            <>
              <div className="stats-header">
                <h2>Статистика: {selectedEntityName}</h2>
                <div className="header-actions">
                  <div className="period-switch">
                    <button
                      className={period === "week" ? "active" : ""}
                      onClick={() => {
                        setPeriod("week");
                        setOffset(0);
                      }}
                    >
                      Тиждень
                    </button>
                    <button
                      className={period === "6m" ? "active" : ""}
                      onClick={() => {
                        setPeriod("6m");
                        setOffset(0);
                      }}
                    >
                      6 місяців
                    </button>
                  </div>
                </div>
              </div>

              <div className="chart-nav">
                <button onClick={() => setOffset(offset - 1)}>‹</button>
                <span>{periodLabel}</span>
                <button onClick={() => setOffset(offset + 1)}>›</button>
              </div>

              <div className="chart-container">
                <div className="chart">
                  <Bar data={chartData} options={chartOptions} />
                </div>

                <div className="places-section">
                  <div className="places-header">
                    <h3>Найчастіші локації</h3>
                    <span className="places-count">{placesData.labels.length}</span>
                  </div>
                  <div className="places-chart">
                    <Doughnut data={placesData} options={doughnutOptions} />
                  </div>
                </div>
              </div>

              <div className="stats-cards">
                <div className="stat-card stat-card-avg">
                  <span className="stat-label">Середнє за день</span>
                  <span className="stat-value">{averageValue}</span>
                </div>
                <div className="stat-card stat-card-total">
                  <span className="stat-label">Всього за період</span>
                  <span className="stat-value">{totalInPeriod}</span>
                </div>
              </div>

              <div className="memories-section">
                <h3 className="memories-title">Останні спогади</h3>
                <div className="memories">
                  {entityMemories.slice(-4).map((m) => (
                    <MemoryCard key={m._id} memory={m} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty">
              Оберіть друга або групу для перегляду статистики
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
        <div className="edit-profile-modal-content">
          <h2>Редагувати профіль</h2>
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Повне ім'я</label>
              <input
                type="text"
                id="fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Ім'я користувача</label>
              <input
                type="text"
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="modal-buttons">
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">
                Скасувати
              </button>
              <button type="submit" className="save-btn">
                Зберегти
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isEditingGroup} onClose={() => setIsEditingGroup(false)}>
        <div className="edit-profile-modal-content">
          <h2>Редагувати групу</h2>
          <form onSubmit={handleEditGroupSubmit}>
            <div className="form-group">
              <label htmlFor="groupName">Назва групи</label>
              <input
                type="text"
                id="groupName"
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                required
              />
            </div>
            <div className="modal-buttons">
              <button type="button" onClick={() => setIsEditingGroup(false)} className="cancel-btn">
                Скасувати
              </button>
              <button type="submit" className="save-btn">
                Зберегти
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}