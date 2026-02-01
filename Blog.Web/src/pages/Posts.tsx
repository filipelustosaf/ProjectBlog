import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../auth/AuthContext";
import * as postsApi from "../api/posts";
import { getErrorMessage } from "../utils/erros";

export default function Posts() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider not found.");

  const [items, setItems] = useState<postsApi.PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const myId = ctx.user?.id;
  const isAdmin = ctx.isAdmin;

  const canEdit = useMemo(
    () => (post: postsApi.PostDto) => isAdmin || post.authorId === myId,
    [isAdmin, myId]
  );

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await postsApi.getPosts();
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load posts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      await postsApi.createPost({ title, content });
      setTitle("");
      setContent("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create post."));
    }
  };

  const startEdit = (post: postsApi.PostDto) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async (id: number) => {
    setError(null);

    if (!editTitle.trim() || !editContent.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      await postsApi.updatePost(id, { title: editTitle, content: editContent });
      cancelEdit();
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update post."));
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setError(null);

    try {
      await postsApi.deletePost(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete post."));
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Posts</h2>

      {error && (
        <div className="alert alertError" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Create post */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="cardHeader">
          <h3>Create a new post</h3>
        </div>

        <div className="cardBody">
          <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Write your content here..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button className="btn btnPrimary" type="submit">
              Publish
            </button>
          </form>
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div>Loading posts...</div>
      ) : items.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {items.map((p) => {
            const editable = canEdit(p);
            const isEditing = editingId === p.id;

            return (
              <div key={p.id} className="card">
                <div className="cardBody">
                  {isEditing ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <textarea
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />

                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          className="btn btnPrimary"
                          onClick={() => saveEdit(p.id)}
                          type="button"
                        >
                          Save
                        </button>
                        <button className="btn" onClick={cancelEdit} type="button">
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <h3 style={{ margin: 0 }}>{p.title}</h3>
                        <small className="muted">
                          {new Date(p.createdAt).toLocaleString()}
                        </small>
                      </div>

                      <p style={{ whiteSpace: "pre-wrap" }}>{p.content}</p>

                      <small className="muted">
                        Author: {p.authorEmail ?? "Unknown"}
                      </small>

                      {/* Only show actions if the user can edit/delete */}
                      {editable && (
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                          <button
                            className="btn"
                            onClick={() => startEdit(p)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="btn btnDanger"
                            onClick={() => onDelete(p.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
