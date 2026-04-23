import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export const FriendsContext = createContext();
const API_URL = import.meta.env.VITE_API_URL;

export function FriendsProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState({
    id: 0,
    name: "Всі категорії",
  });
  const [friendships, setFriendships] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([fetchFriends(), fetchGroups()]).finally(() =>
        setLoading(false),
      );
    }
  }, [user]);

  async function fetchFriends() {
    try {
      const res = await axios.get(`${API_URL}/api/users/friends`, {
        withCredentials: true,
      });
      setFriendships(res.data.friendships || []);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function fetchGroups() {
    try {
      const res = await axios.get(`${API_URL}/api/groups`, { withCredentials: true });
      setGroups(res.data.groups || []);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function addFriend(friendId) {
    try {
      await axios.post(
        `${API_URL}/api/users/friends`,
        { friendId },
        { withCredentials: true },
      );
      fetchFriends();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function removeFriend(friendId) {
    try {
      await axios.delete(`${API_URL}/api/users/friends?friendId=${friendId}`, {
        withCredentials: true,
      });

      setSelectedEntity((prev) =>
        prev?.data?.user?._id === friendId ? null : prev,
      );
      fetchFriends();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function findFriend(query) {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(
        `${API_URL}/api/users/friends/find?query=${encodeURIComponent(query)}`,
        { withCredentials: true },
      );
      setSearchResults(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function addGroup(newGroup) {
    try {
      await axios.post(`${API_URL}/api/groups`, newGroup, { withCredentials: true });
      fetchGroups();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function deleteGroup(groupId) {
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}`, { withCredentials: true });
      setSelectedEntity((prev) => (prev?.data?._id === groupId ? null : prev));
      fetchGroups();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function updateGroup(groupId, updatedData) {
    try {
      await axios.put(`${API_URL}/api/groups/${groupId}`, updatedData, {
        withCredentials: true,
      });
      fetchGroups();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function addMembersToGroup(groupId, userIds) {
    try {
      const res = await axios.post(
        `${API_URL}/api/groups/${groupId}/members`,
        { userIds },
        { withCredentials: true },
      );

      await fetchGroups();
      const updatedGroup = res.data.group || res.data;

      setSelectedEntity((prev) => {
        if (prev?.type === "group" && prev.data._id === groupId) {
          return {
            ...prev,
            data: { ...prev.data, members: updatedGroup.members },
          };
        }
        return prev;
      });

      return updatedGroup;
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function removeMemberFromGroup(groupId, memberId) {
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}/members/${memberId}`, {
        withCredentials: true,
      });

      await fetchGroups();

      setSelectedEntity((prev) => {
        if (prev?.type === "group" && prev.data._id === groupId) {
          return {
            ...prev,
            data: {
              ...prev.data,
              members: prev.data.members.filter((m) => m._id !== memberId),
            },
          };
        }
        return prev;
      });
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function addCategoryToFriendship(friendshipId, category) {
    try {
      const res = await axios.post(
        `${API_URL}/api/users/friends/${friendshipId}/categories`,
        { category },
        { withCredentials: true },
      );

      setFriendships((prev) =>
        prev.map((f) =>
          f._id === friendshipId
            ? { ...f, categories: [...(f.categories || []), category] }
            : f,
        ),
      );

      if (
        selectedEntity?.type === "friend" &&
        selectedEntity.data._id === friendshipId
      ) {
        setSelectedEntity((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            categories: [...(prev.data.categories || []), category],
          },
        }));
      }

      return res.data;
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  async function addCategoryToGroup(groupId, category) {
    try {
      const res = await axios.post(
        `${API_URL}/api/groups/${groupId}/categories`,
        { category },
        { withCredentials: true },
      );

      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId
            ? { ...g, categories: [...(g.categories || []), category] }
            : g,
        ),
      );

      if (
        selectedEntity?.type === "group" &&
        selectedEntity.data._id === groupId
      ) {
        setSelectedEntity((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            categories: [...(prev.data.categories || []), category],
          },
        }));
      }

      return res.data;
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  }

  function onSelectFriend(friendUser) {
    const friendship = friendships.find((f) => {
      const userIds = f.users.map((u) => u._id?.toString() || u.toString());
      return (
        userIds.includes(user._id?.toString()) &&
        userIds.includes(friendUser._id?.toString())
      );
    });

    if (!friendship) {
      // Don't create entity without valid friendship
      console.error("Friendship not found for user:", friendUser._id);
      return;
    }

    const otherUser = friendship.users.find(
      (u) => u._id?.toString() !== user._id?.toString(),
    );

    setSelectedEntity({
      type: "friend",
      data: {
        _id: friendship._id,
        user: otherUser || friendUser,
        categories: friendship.categories || [],
      },
    });
  }

  function onSelectGroup(group) {
    setSelectedEntity({
      type: "group",
      data: {
        ...group,
        categories: group.categories || [],
      },
    });
    setSelectedCategory({ id: 0, name: "Всі категорії" });
  }

  function getFriendsList() {
    if (!user || !friendships.length) return [];

    return friendships
      .map((friendship) => {
        const otherUser = friendship.users?.find(
          (u) => u._id?.toString() !== user._id?.toString(),
        );
        return {
          friendshipId: friendship._id,
          user: otherUser,
          categories: friendship.categories || [],
          createdAt: friendship.createdAt,
        };
      })
      .filter((item) => item.user);
  }

  return (
    <FriendsContext.Provider
      value={{
        user,
        selectedEntity,
        setSelectedEntity,
        selectedCategory,
        setSelectedCategory,
        friendships,
        groups,
        searchResults,
        setSearchResults,
        loading,
        addFriend,
        removeFriend,
        findFriend,
        addGroup,
        deleteGroup,
        updateGroup,
        addMembersToGroup,
        removeMemberFromGroup,
        addCategoryToFriendship,
        addCategoryToGroup,
        onSelectFriend,
        onSelectGroup,
        getFriendsList,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}
