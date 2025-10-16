import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import { Heart, Send } from "lucide-react";

type Comment = {
  id: string;
  user_id: string;
  trailer_id: string;
  content: string;
  created_at: string;
  likes: number;
  profiles: {
    username: string;
  };
};

type Props = {
  movie: any;
  userId: string;
};

export default function Movie({ movie, userId }: Props) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState<{ [key: string]: boolean }>({});

  // ✅ Safe trailer identifier
  const trailerIdentifier = movie?.id?.toString() || "";

  // Fetch comments for this movie
  const fetchComments = async () => {
    if (!trailerIdentifier) return;

    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        user_id,
        trailer_id,
        content,
        created_at,
        likes,
        profiles!comments_user_id_profiles(username)
      `)
      .eq("trailer_id", trailerIdentifier)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error.message);
      return;
    }

    const normalized = (data || []).map((c: any) => ({
      ...c,
      profiles: c.profiles?.[0] || { username: "Unknown" },
    }));

    setComments(normalized);
  };

  // Add a new comment
  const addComment = async () => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([
        { user_id: userId, trailer_id: trailerIdentifier, content: newComment },
      ])
      .select(`
        id,
        user_id,
        trailer_id,
        content,
        created_at,
        likes,
        profiles!comments_user_id_profiles(username)
      `);

    if (error) {
      console.error("Error adding comment:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const newCommentData = {
        ...data[0],
        profiles: data[0].profiles?.[0] || { username: "Unknown" },
      };
      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
    }
  };

  // Like/unlike a comment
  const toggleLike = async (commentId: string) => {
    const isLiked = likes[commentId];
    setLikes({ ...likes, [commentId]: !isLiked });

    const { data, error } = await supabase
      .from("comments")
      .select("likes")
      .eq("id", commentId)
      .single();

    if (error) {
      console.error("Error fetching current likes:", error.message);
      return;
    }

    const newLikesCount = isLiked ? data.likes - 1 : data.likes + 1;

    const { error: updateError } = await supabase
      .from("comments")
      .update({ likes: newLikesCount })
      .eq("id", commentId);

    if (updateError) {
      console.error("Error updating likes:", updateError.message);
    } else {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, likes: newLikesCount } : comment
        )
      );
    }
  };

  // Fetch comments when movie changes
  useEffect(() => {
    setComments([]); // clear old comments
    if (movie?.id) fetchComments();
  }, [movie?.id]);

  // ✅ Loading state
  if (!movie || !movie.id) {
    return (
      <div className="text-center text-neutral-400 py-10">
        Loading movie details...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-neutral-900 text-white rounded-2xl shadow-md p-4 mb-6">
      {/* Movie Title */}
      <h2 className="text-xl font-semibold mb-2">{movie.title}</h2>

      {/* Comments Section */}
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Comments</h3>

        {/* Input box */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-neutral-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={addComment}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl text-sm flex items-center gap-1"
          >
            <Send size={14} /> Send
          </button>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-neutral-400 text-sm">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-neutral-800 rounded-xl p-3 text-sm flex flex-col"
              >
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-medium">
                    {comment.profiles?.username || "Unknown User"}
                  </span>
                  <span className="text-neutral-500 text-xs">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-neutral-200 mt-1">{comment.content}</p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className={`flex items-center gap-1 text-sm ${
                      likes[comment.id] ? "text-red-500" : "text-neutral-400"
                    }`}
                  >
                    <Heart
                      size={14}
                      fill={likes[comment.id] ? "red" : "none"}
                    />
                    {comment.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}false
