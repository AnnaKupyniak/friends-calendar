import { useContext, useState, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FriendsContext } from "../../context/FriendsContext";
import { MemoriesContext } from "../../context/MemoriesContext";
import MemoryCard from "../../features/memories/MemoryCard";
import { Bar } from "react-chartjs-2";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
dayjs.extend(isoWeek);

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const { friendships, groups = [] } = useContext(FriendsContext);
  const { memories } = useContext(MemoriesContext);

  const [selectedFriendshipId, setSelectedFriendshipId] = useState(null);
  const [period, setPeriod] = useState("month");
  const [offset, setOffset] = useState(0);
  const [sidebarTab, setSidebarTab] = useState("friends"); // "friends" | "groups"

  if (!user) return <p>Завантаження...</p>;

  const selectedFriendship = friendships.find(f => f._id === selectedFriendshipId);
  const selectedFriend = selectedFriendship
    ? selectedFriendship.users.find(u => u._id !== user._id)
    : null;

  // Фільтруємо спогади для обраного друга
  const friendMemories = useMemo(() => {
    if (!selectedFriendshipId) return [];
    return memories.filter(
      m =>
        m.entityType === "Friendship" &&
        m.entity.toString() === selectedFriendshipId
    );
  }, [selectedFriendshipId, memories]);

  // Генеруємо мітки для графіка залежно від періоду та офсету
  const { chartData, periodLabel } = useMemo(() => {
    const now = dayjs();
    let labels = [];
    let counts = {};
    let periodLabel = "";

    if (period === "week") {
      // Початок тижня з урахуванням офсету
      const startOfWeek = now.add(offset, "week").startOf("isoWeek");
      periodLabel = `${startOfWeek.format("DD.MM")} – ${startOfWeek.add(6, "day").format("DD.MM.YYYY")}`;
      for (let i = 0; i < 7; i++) {
        const day = startOfWeek.add(i, "day").format("YYYY-MM-DD");
        labels.push(day);
        counts[day] = 0;
      }
      friendMemories.forEach(m => {
        const day = dayjs(m.date).format("YYYY-MM-DD");
        if (counts[day] !== undefined) counts[day]++;
      });
    } else {
      // Останні 6 місяців зі зміщенням
      const baseMonth = now.add(offset * 6, "month");
      for (let i = 5; i >= 0; i--) {
        const month = baseMonth.subtract(i, "month").format("YYYY-MM");
        labels.push(month);
        counts[month] = 0;
      }
      periodLabel = `${dayjs(labels[0] + "-01").format("MMM")} – ${dayjs(labels[5] + "-01").format("MMM YYYY")}`;
      friendMemories.forEach(m => {
        const month = dayjs(m.date).format("YYYY-MM");
        if (counts[month] !== undefined) counts[month]++;
      });
    }

    const displayLabels = labels.map(l =>
      period === "week"
        ? dayjs(l).format("dd DD.MM")
        : dayjs(l + "-01").format("MMM")
    );

    return {
      periodLabel,
      chartData: {
        labels: displayLabels,
        datasets: [
          {
            label: "Спогади",
            data: labels.map(l => counts[l]),
            backgroundColor: (ctx) => {
              const canvas = ctx.chart.ctx;
              const gradient = canvas.createLinearGradient(0, 0, 0, 260);
              gradient.addColorStop(0, "#F5811F");
              gradient.addColorStop(1, "rgba(245, 129, 31, 0.4)");
              return gradient;
            },
            borderRadius: 10,
            borderSkipped: false,
            barPercentage: 0.75,
            categoryPercentage: 0.6,
          }
        ]
      }
    };
  }, [friendMemories, period, offset]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#2D1B3D",
        titleColor: "#CAA8F5",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => items[0].label,
          label: (item) => `${item.raw} спогад${item.raw === 1 ? "" : item.raw >= 2 && item.raw <= 4 ? "и" : "ів"}`,
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#6E5A85", font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(233, 221, 248, 0.5)", drawBorder: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          stepSize: 1,
          color: "#6E5A85",
          font: { size: 11 },
          padding: 8
        }
      }
    }
  };

  // Статистика для поточного обраного періоду
  const totalMemories = friendMemories.length;
  const now = dayjs();

  const currentPeriodStart = period === "week"
    ? now.add(offset, "week").startOf("isoWeek")
    : now.add(offset * 6, "month").subtract(5, "month").startOf("month");
  const currentPeriodEnd = period === "week"
    ? currentPeriodStart.endOf("isoWeek")
    : now.add(offset * 6, "month").endOf("month");

  const prevPeriodStart = period === "week"
    ? currentPeriodStart.subtract(1, "week")
    : currentPeriodStart.subtract(6, "month");
  const prevPeriodEnd = period === "week"
    ? currentPeriodEnd.subtract(1, "week")
    : currentPeriodEnd.subtract(6, "month");

  const currentCount = friendMemories.filter(m => {
    const d = dayjs(m.date);
    return d.isAfter(currentPeriodStart.subtract(1, "ms")) && d.isBefore(currentPeriodEnd.add(1, "ms"));
  }).length;

  const prevCount = friendMemories.filter(m => {
    const d = dayjs(m.date);
    return d.isAfter(prevPeriodStart.subtract(1, "ms")) && d.isBefore(prevPeriodEnd.add(1, "ms"));
  }).length;

  const growth = prevCount > 0
    ? Math.round(((currentCount - prevCount) / prevCount) * 100)
    : null;

  return (
    <div className="container mt-4">

      {/* Профіль */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        marginBottom: "24px"
      }}>
        {/* Банер */}
        <div style={{
          height: "100px",
          background: "linear-gradient(135deg, var(--accent-strong) 0%, #a855f7 50%, var(--accent) 100%)",
          position: "relative"
        }} />

        {/* Аватарка + інфо */}
        <div style={{ padding: "0 24px 20px", position: "relative" }}>
          {/* Аватарка поверх банера */}
          <img
            src={user.avatar
              ? `${API_URL}/uploads/${user.avatar}`
              : `${API_URL}/uploads/default-avatar.png`}
            alt="Profile"
            style={{
              width: "80px", height: "80px",
              borderRadius: "50%", objectFit: "cover",
              border: "3px solid var(--surface)",
              marginTop: "-40px",
              display: "block",
              boxShadow: "var(--shadow-md)"
            }}
          />

          {/* Ім'я та юзернейм */}
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {user.fullName || user.username}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                @{user.username} · {user.email}
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                border: "1px solid var(--danger)",
                background: "none",
                color: "var(--danger)",
                borderRadius: "var(--radius-sm)",
                padding: "5px 14px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "var(--transition)"
              }}
            >
              Вийти
            </button>
          </div>

          {/* Статистика */}
          <div style={{
            display: "flex",
            gap: "24px",
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: "1px solid var(--border)"
          }}>
            {[
              { value: friendships.length, label: "Друзів" },
              { value: memories.length, label: "Спогадів" },
            ].map(({ value, label }) => (
              <div key={label}>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-strong)" }}>
                  {value}
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginLeft: "5px" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row">

        {/* Sidebar: Друзі / Групи */}
        <div className="col-md-3">
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden"
          }}>
            {/* Вкладки */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
            }}>
              {[["friends", "Друзі", friendships.length], ["groups", "Групи", groups.length]].map(([tab, label, count]) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "none",
                    padding: "12px 8px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: sidebarTab === tab ? "var(--accent-strong)" : "var(--text-muted)",
                    borderBottom: sidebarTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                    transition: "var(--transition)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px"
                  }}
                >
                  {label}
                  <span style={{
                    background: sidebarTab === tab ? "var(--accent)" : "var(--border)",
                    color: sidebarTab === tab ? "#fff" : "var(--text-muted)",
                    borderRadius: "99px",
                    fontSize: "0.7rem",
                    padding: "1px 6px",
                    fontWeight: 700,
                    lineHeight: "1.4"
                  }}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Список */}
            <div style={{ padding: "8px" }}>
              {sidebarTab === "friends" ? (
                friendships.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", padding: "12px", textAlign: "center" }}>
                    Друзів ще немає
                  </p>
                ) : (
                  friendships.map(f => {
                    const friend = f.users.find(u => u._id !== user._id);
                    const isSelected = selectedFriendshipId === f._id;
                    const fMemCount = memories.filter(
                      m => m.entityType === "Friendship" && m.entity.toString() === f._id
                    ).length;
                    return (
                      <button
                        key={f._id}
                        onClick={() => setSelectedFriendshipId(f._id)}
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: "var(--radius-sm)",
                          padding: "8px 10px",
                          marginBottom: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                          transition: "var(--transition)",
                          background: isSelected ? "linear-gradient(135deg, var(--accent-strong), #7c3aed)" : "transparent",
                          textAlign: "left",
                        }}
                      >
                        <img
                          src={friend.avatar
                            ? `${API_URL}/uploads/${friend.avatar}`
                            : `${API_URL}/uploads/default-avatar.png`}
                          alt={friend.username}
                          style={{
                            width: "34px", height: "34px",
                            borderRadius: "50%", objectFit: "cover",
                            flexShrink: 0,
                            border: isSelected ? "2px solid rgba(255,255,255,0.4)" : "2px solid var(--border)"
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: "0.83rem", fontWeight: 600,
                            color: isSelected ? "#fff" : "var(--text-primary)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                          }}>
                            {friend.fullName || friend.username}
                          </div>
                          <div style={{
                            fontSize: "0.72rem",
                            color: isSelected ? "rgba(255,255,255,0.65)" : "var(--text-muted)"
                          }}>
                            {fMemCount} спогадів
                          </div>
                        </div>
                      </button>
                    );
                  })
                )
              ) : (
                groups.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", padding: "12px", textAlign: "center" }}>
                    Груп ще немає
                  </p>
                ) : (
                  groups.map(g => (
                    <div
                      key={g._id}
                      style={{
                        borderRadius: "var(--radius-sm)",
                        padding: "8px 10px",
                        marginBottom: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "transparent",
                      }}
                    >
                      {/* Іконка групи — ініціали */}
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-soft), var(--accent-strong))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0
                      }}>
                        {g.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: "0.83rem", fontWeight: 600,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                          {g.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {g.members?.length || 0} учасників
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="col-md-9">
          {selectedFriend ? (
            <>
              {/* Заголовок + контроли */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 style={{ color: "var(--text-primary)", margin: 0 }}>
                  Статистика з {selectedFriend.fullName || selectedFriend.username}
                </h5>

                <div className="d-flex align-items-center gap-2">
                  {/* Перемикач тиждень/місяць */}
                  <div style={{
                    display: "flex",
                    background: "var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "3px",
                    gap: "2px"
                  }}>
                    {["week", "month"].map(p => (
                      <button
                        key={p}
                        onClick={() => { setPeriod(p); setOffset(0); }}
                        style={{
                          border: "none",
                          borderRadius: "8px",
                          padding: "4px 14px",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "var(--transition)",
                          background: period === p ? "var(--surface)" : "transparent",
                          color: period === p ? "var(--accent-strong)" : "var(--text-muted)",
                          boxShadow: period === p ? "var(--shadow-sm)" : "none",
                        }}
                      >
                        {p === "week" ? "Тиждень" : "Місяць"}
                      </button>
                    ))}
                  </div>

                  {/* Навігація ‹ period › */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 10px",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    <button
                      onClick={() => setOffset(o => o - 1)}
                      style={{
                        border: "none", background: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1,
                        padding: "0 2px"
                      }}
                    >
                      ‹
                    </button>
                    <span style={{
                      minWidth: "110px", textAlign: "center",
                      fontSize: "0.85rem", fontWeight: 600,
                      color: "var(--text-primary)", textTransform: "capitalize"
                    }}>
                      {periodLabel}
                    </span>
                    <button
                      onClick={() => setOffset(o => o + 1)}
                      disabled={offset >= 0}
                      style={{
                        border: "none", background: "none",
                        cursor: offset >= 0 ? "default" : "pointer",
                        color: offset >= 0 ? "var(--border)" : "var(--text-muted)",
                        fontSize: "1.1rem", lineHeight: 1,
                        padding: "0 2px"
                      }}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>

              {/* Картки статистики */}
              <div className="row g-3 mb-3">
                {[
                  {
                    label: "Всього спогадів",
                    value: totalMemories,
                    accent: "var(--accent-strong)",
                    sub: null,
                  },
                  {
                    label: period === "week" ? "Цей тиждень" : "Цей місяць",
                    value: currentCount,
                    accent: "var(--accent)",
                    sub: null,
                  },
                  {
                    label: "Порівняно з попереднім",
                    value: growth === null ? "—" : `${growth > 0 ? "+" : ""}${growth}%`,
                    accent: growth === null
                      ? "var(--border)"
                      : growth >= 0 ? "#22c55e" : "var(--danger)",
                    sub: growth !== null ? `було ${prevCount}` : null,
                    valueColor: growth === null
                      ? "var(--text-muted)"
                      : growth >= 0 ? "#22c55e" : "var(--danger)",
                  }
                ].map(({ label, value, accent, sub, valueColor }) => (
                  <div className="col-4" key={label}>
                    <div style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderTop: `3px solid ${accent}`,
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      boxShadow: "var(--shadow-sm)"
                    }}>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                        {label}
                      </div>
                      <div style={{
                        fontSize: "1.8rem", fontWeight: 700,
                        color: valueColor || "var(--text-primary)",
                        lineHeight: 1
                      }}>
                        {value}
                      </div>
                      {sub && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {sub}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Графік */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "16px"
              }}>
                {chartData.datasets[0].data.every(v => v === 0) ? (
                  <div style={{
                    height: "160px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}>
                    <div style={{ fontSize: "2rem" }}>🌱</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Спогадів за цей період ще немає
                    </div>
                  </div>
                ) : (
                  <Bar key={`${selectedFriendshipId}-${period}-${offset}`} data={chartData} options={chartOptions} />
                )}
              </div>

              {/* Спогади */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                boxShadow: "var(--shadow-sm)"
              }}>
                <h6 style={{ color: "var(--text-primary)", marginBottom: "12px" }}>Спогади</h6>
                {friendMemories.length > 0 ? (
                  friendMemories
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(m => <MemoryCard key={m._id} memory={m} />)
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>Спогадів ще немає</p>
                )}
              </div>
            </>
          ) : (
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "60px 20px",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{ fontSize: "2.5rem" }}>👈</div>
              <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
                Оберіть друга, щоб побачити статистику
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}