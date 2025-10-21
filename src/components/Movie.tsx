import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureTrailerExists } from "../lib/data";
import { Heart, Send } from "lucide-react";

type Comment = {
  id: string;
  user_id: string;
  trailer_id: string;
  content: string;
  created_at: string;
  likes: number;
  commenterUsername?: string | null;
};

type Props = {
  movie: any;
  userId: string;
};

export default function Movie({ movie, userId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState<{ [key: string]: boolean }>({});

  // Safe trailer identifier
  const trailerIdentifier = movie?.id?.toString() || "";

  // Fetch comments for this movie with usernames joined
  const fetchComments = async () => {
    if (!trailerIdentifier) return;

    console.log('📝 Fetching comments for trailer:', trailerIdentifier);

    // Fetch comments with joined profile data for usernames
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id, 
        user_id, 
        trailer_id, 
        content, 
        created_at, 
        likes,
        commenter:profiles(username, email)
      `)
      .eq("trailer_id", trailerIdentifier)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error.message);
      return;
    }

    console.log('📝 Raw comments data:', data);

    // Transform the data to include usernames and like counts
    const commentsWithUsernames = await Promise.all((data || []).map(async (comment: any) => {
      let username = null;
      
      // Handle the joined profile data
      if (comment.commenter) {
        if (Array.isArray(comment.commenter) && comment.commenter.length > 0) {
          username = comment.commenter[0]?.username || comment.commenter[0]?.email;
        } else if (comment.commenter.username || comment.commenter.email) {
          username = comment.commenter.username || comment.commenter.email;
        }
      }
      
      // Fallback to user ID if no username found
      if (!username) {
        username = comment.user_id;
      }

      // Get actual like count from comment_likes table
      const { data: likesData, error: likesError } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", comment.id);

      const actualLikeCount = likesError ? 0 : (likesData?.length || 0);

      return {
        ...comment,
        commenterUsername: username,
        likes: actualLikeCount
      };
    }));

    console.log('✅ Final comments with usernames:', commentsWithUsernames);
    setComments(commentsWithUsernames);

    // Load current user's likes for these comments
    if (userId && commentsWithUsernames.length > 0) {
      const commentIds = commentsWithUsernames.map(c => c.id);
      const { data: userLikes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", userId)
        .in("comment_id", commentIds);

      const likeMap: { [key: string]: boolean } = {};
      (userLikes || []).forEach((like: any) => {
        likeMap[like.comment_id] = true;
      });
      setLikes(likeMap);
    }
  };

  // Add a new comment
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      // Ensure the trailer exists in the trailers table before commenting
      const trailerData = {
        id: trailerIdentifier,
        title: movie?.title || "Movie",
        youtube_id: trailerIdentifier, // Use movie ID as youtube_id for now
        category: movie?.genre || movie?.category || "Movie",
        poster_url: movie?.poster_url || ""
      };
      
      console.log('🎬 (Component) Ensuring trailer exists for comments:', trailerData);
      
      const trailerEnsured = await ensureTrailerExists(trailerData);
      console.log('✅ (Component) Trailer ensured result:', trailerEnsured);
      
      if (!trailerEnsured) {
        console.error('❌ (Component) Failed to create trailer record');
        return;
      }

      const { data, error } = await supabase
        .from("comments")
        .insert([{ user_id: userId, trailer_id: trailerIdentifier, content: newComment }])
        .select("id, user_id, trailer_id, content, created_at, likes");

      if (error) {
        console.error("Error adding comment:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const newRow = data[0] as Comment;
        
        // Get the current user's username for the new comment
        const { data: currentUserProfile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", userId)
          .maybeSingle();
        
        const username = currentUserProfile?.username || currentUserProfile?.email || userId;
        
        setComments((prev) => [
          { ...newRow, commenterUsername: username },
          ...prev,
        ]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Like/unlike a comment with notifications
  const toggleLike = async (commentId: string) => {
    if (!userId) {
      alert("Please sign in to like comments");
      return;
    }

    try {
      // Check if user has already liked this comment
      const { data: existingLike } = await supabase
        .from("comment_likes")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingLike) {
        // Unlike: Remove the like
        const { error: deleteError } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Error removing like:", deleteError.message);
          return;
        }

        // Update UI
        setLikes({ ...likes, [commentId]: false });
        setComments((prev) =>
          prev.map((comment) => 
            comment.id === commentId 
              ? { ...comment, likes: Math.max(0, (comment.likes || 0) - 1) }
              : comment
          )
        );
      } else {
        // Like: Add the like (this will trigger notification via database trigger)
        const { error: insertError } = await supabase
          .from("comment_likes")
          .insert([{ comment_id: commentId, user_id: userId }]);

        if (insertError) {
          console.error("Error adding like:", insertError.message);
          return;
        }

        // Update UI
        setLikes({ ...likes, [commentId]: true });
        setComments((prev) =>
          prev.map((comment) => 
            comment.id === commentId 
              ? { ...comment, likes: (comment.likes || 0) + 1 }
              : comment
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Fetch comments when movie changes
  useEffect(() => {
    setComments([]); // clear old comments
    if (movie?.id) fetchComments();
  }, [movie?.id]);

  // Loading state
  if (!movie || !movie.id) {
    return (
      <div className="text-center text-neutral-400 py-10">Loading movie details...</div>
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
          <button onClick={addComment} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl text-sm flex items-center gap-1">
            <Send size={14} /> Send
          </button>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-neutral-400 text-sm">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-neutral-800 rounded-xl p-3 text-sm flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-medium">
                    {comment.commenterUsername ?? comment.user_id}
                  </span>
                  <span className="text-neutral-500 text-xs">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-neutral-200 mt-1">{comment.content}</p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => toggleLike(comment.id)}
                    className={`flex items-center gap-1 text-sm ${likes[comment.id] ? "text-red-500" : "text-neutral-400"}`}
                  >
                    <Heart size={14} fill={likes[comment.id] ? "red" : "none"} />
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
}
