import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Comment = {
  id: number;
  movie_id: number;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
};

type Props = { movieId: number; userId: string };

export default function CommentSection({ movieId, userId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // 1️⃣ Fetch comments
  useEffect(() => {
    async function loadComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("movie_id", movieId)
        .order("created_at", { ascending: true });
      if (!error && data) setComments(data);
    }
    loadComments();
  }, [movieId]);

  // 2️⃣ Add a new comment
  async function addComment() {
    if (!newComment) return;
    const { data, error } = await supabase
      .from("comments")
      .insert([{ movie_id: movieId, user_id: userId, content: newComment }])
      .select();
    if (!error && data) {
      setComments([...comments, data[0]]);
      setNewComment("");
    }
  }

  // 3️⃣ Delete a comment
  async function deleteComment(id: number) {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) setComments(comments.filter((c) => c.id !== id));
  }

  // 4️⃣ Update a comment
  async function updateComment(id: number, content: string) {
    const { data, error } = await supabase
      .from("comments")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (!error && data) {
      setComments(
        comments.map((c) => (c.id === id ? { ...c, content: data[0].content } : c))
      );
    }
  }

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded text-white">
      <h4 className="font-semibold mb-2">Comments</h4>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="p-2 rounded w-full text-black"
        />
        <button onClick={addComment} className="bg-purple-600 px-3 rounded">
          Add
        </button>
      </div>

      {comments.map((c) => (
        <div key={c.id} className="border-b border-gray-600 py-1 flex justify-between">
          <span>{c.content}</span>
          {c.user_id === userId && (
            <div className="flex gap-1">
              <button
                className="text-xs text-yellow-400"
                onClick={() => {
                  const edited = prompt("Edit comment:", c.content);
                  if (edited) updateComment(c.id, edited);
                }}
              >
                Edit
              </button>
              <button
                className="text-xs text-red-400"
                onClick={() => deleteComment(c.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
