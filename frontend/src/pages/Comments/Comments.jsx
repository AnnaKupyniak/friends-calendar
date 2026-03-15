import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MemoriesContext } from "../../context/MemoriesContext";
import MemoryCard from "../../features/memories/MemoryCard";
import "./Comments.css";

export default function Comments() {
  const { id: memoryId } = useParams();
  const { getComments, createComment, getMemoryById } = useContext(MemoriesContext);

  const [memoryComments, setMemoryComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const memory = getMemoryById(memoryId);

  useEffect(() => {
    fetchComments();
  }, [memoryId]);

  const fetchComments = async () => {
    try {
      const comments = await getComments(memoryId);
      setMemoryComments(comments);
    } catch (err) {
      console.log(err);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const newComment = await createComment(memoryId, { text: commentText });
      setMemoryComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      console.log(err);
    }
  };

  if (!memory) return <p>Спогад не знайдено</p>;

  return (
    <div className="comments-page">
      {/* Ліва колонка */}
      <div className="memory-column">
        <MemoryCard memory={memory} />
      </div>

      {/* Права колонка */}
      <div className="comments-column">
        <h1>Коментарі</h1>

        <div className="comment-form">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Напиши коментар..."
          />
          <button onClick={addComment}>Додати</button>
        </div>

        <div className="comments-list">
          {memoryComments.length > 0 ? (
            memoryComments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <strong>{comment.author}</strong>
                <p>{comment.text}</p>
              </div>
            ))
          ) : (
            <p>Коментарі відсутні</p>
          )}
        </div>
      </div>
    </div>
  );
}