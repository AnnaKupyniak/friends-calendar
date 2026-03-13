import Calendar from "../../components/Calendar/Calendar";
import Categories from "../../features/categories/Categories";
import FriendsAndGroups from "../../features/friends/FriendsAndGroups";
import Memories from "../../features/memories/Memories";
import { FriendsContext } from "../../context/FriendsContext.jsx";
import { useContext, useState } from "react";
import "./Home.css";

export default function Home() {
  const {
    selectedEntity,
    selectedCategory,
    setSelectedCategory,
    addCategoryToFriendship,
    addCategoryToGroup,
  } = useContext(FriendsContext);

  async function handleAddCategory(newCategory) {
    if (!selectedEntity) return;
    try {
      const categoryName = newCategory.name || newCategory;
      if (selectedEntity.type === "friend") {
        await addCategoryToFriendship(selectedEntity.data._id, categoryName);
      } else if (selectedEntity.type === "group") {
        await addCategoryToGroup(selectedEntity.data._id, categoryName);
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  }

 

  return (
    <div className="home-container">
      <div className="home-sidebar">
        <FriendsAndGroups />

        <Calendar />
      </div>

      <div className="home-main">
        {!selectedEntity && "Select a friend or group"}
        {selectedEntity && <Memories category={selectedCategory} />}
      </div>

      {selectedEntity && (
        <div className="home-right-panel">
          <Categories
            categories={[
              { id: 0, name: "Всі категорії" },
              ...(selectedEntity.data.categories?.map((cat, index) => ({
                id: index + 1,
                name: typeof cat === "string" ? cat : cat.name || cat,
              })) || []),
            ]}
            selectedCategory={selectedCategory}
            onAddCategory={handleAddCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}
    </div>
  );
}