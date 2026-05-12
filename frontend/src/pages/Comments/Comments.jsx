import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MemoriesContext } from "../../context/MemoriesContext";
import MemoryCard from "../../features/memories/MemoryCard";
import { Send } from "lucide-react";
import "./Comments.css";

export default function Comments() {
  const { id: memoryId } = useParams();
  const { getComments, createComment, getMemoryById } = useContext(MemoriesContext);

  const [memoryComments, setMemoryComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const memory = getMemoryById(memoryId);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const comments = await getComments(memoryId);
        setMemoryComments(comments);
      } catch (err) {
        console.log(err);
      }
    };
    fetchComments();
  }, [getComments, memoryId]);

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addComment();
  };

  if (!memory) return <p>Спогад не знайдено</p>;

  return (
    <div className="comments-page">
      {/* Ліва колонка — картка спогаду */}
      <div className="memory-column">
        <MemoryCard memory={memory} />
      </div>

      {/* Права колонка — коментарі */}
      <div className="comments-column">
        <h1>Коментарі</h1>

        <div className="comment-form">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напиши коментар..."
          />
          <button className="comment-submit-btn" onClick={addComment}>
            <Send size={14} />
            Додати
          </button>
        </div>

        <div className="comments-list">
          {memoryComments.length > 0 ? (
            memoryComments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <span className="comment-author">{comment.author}</span>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))
          ) : (
            <div className="comments-empty">
              Коментарів ще немає — будь першим!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}