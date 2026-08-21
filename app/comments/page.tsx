"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Comment, Task } from "@/app/data";
import styles from "./comments.module.css";

type ApiError = { error?: { message?: string } };
type CommentFormValues = { taskId: number; author: string; body: string };
type PaginatedResult<T> = {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

async function getErrorMessage(response: Response, fallback: string) {
  const body: ApiError = await response.json().catch(() => ({}));
  return body.error?.message ?? fallback;
}

async function fetchAllPages<T>(path: string, resourceName: string) {
  const limit = 100;
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetch(`${path}?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, `Unable to load ${resourceName}`));
    }

    const result: PaginatedResult<T> = await response.json();
    items.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return items;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function findTaskName(tasks: Task[], taskId: number) {
  return tasks.find((task) => task.id === taskId)?.title ?? `Task #${taskId}`;
}

function CommentForm({
  tasks,
  onAdd,
}: {
  tasks: Task[];
  onAdd: (values: CommentFormValues) => Promise<void>;
}) {
  const [taskId, setTaskId] = useState("");
  const [author, setAuthor] = useState("current-user");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedTaskId = taskId || String(tasks[0]?.id ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTaskId || !author.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        taskId: Number(selectedTaskId),
        author: author.trim(),
        body: body.trim(),
      });
      setBody("");
      setAuthor("current-user");
    } catch {
      // The parent displays the request error and keeps the entered values intact.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.commentForm} onSubmit={handleSubmit}>
      <label>
        Task
        <select
          disabled={isSubmitting || tasks.length === 0}
          onChange={(event) => setTaskId(event.target.value)}
          required
          value={selectedTaskId}
        >
          {tasks.length === 0 ? (
            <option value="">No task available</option>
          ) : (
            tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))
          )}
        </select>
      </label>
      <label>
        Author
        <input
          disabled={isSubmitting}
          onChange={(event) => setAuthor(event.target.value)}
          required
          value={author}
        />
      </label>
      <label>
        Comment
        <textarea
          disabled={isSubmitting}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a quick note, question, or update"
          required
          value={body}
        />
      </label>
      <button
        className={styles.primaryButton}
        disabled={isSubmitting || tasks.length === 0}
        type="submit"
      >
        {isSubmitting ? "Creating..." : "Add comment"}
      </button>
    </form>
  );
}

function CommentItem({
  comment,
  taskName,
  isMutating,
  onUpdate,
  onDelete,
}: {
  comment: Comment;
  taskName: string;
  isMutating: boolean;
  onUpdate: (id: number, values: { author: string; body: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [author, setAuthor] = useState(comment.author);
  const [body, setBody] = useState(comment.body);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!author.trim() || !body.trim()) return;

    try {
      await onUpdate(comment.id, { author: author.trim(), body: body.trim() });
      setIsEditing(false);
    } catch {
      // Parent state already surfaces the error message.
    }
  }

  function cancelEdit() {
    setAuthor(comment.author);
    setBody(comment.body);
    setIsEditing(false);
  }

  return (
    <li>
      <article className={styles.commentCard}>
        <header className={styles.commentHeader}>
          <div>
            <h3>{comment.author}</h3>
            <div className={styles.metaRow}>
              <span className={styles.pill}>{taskName}</span>
              <span className={styles.pill}>#{comment.id}</span>
            </div>
          </div>
        </header>

        {isEditing ? (
          <form className={styles.inlineEditor} onSubmit={handleUpdate}>
            <label>
              Author
              <input
                disabled={isMutating}
                onChange={(event) => setAuthor(event.target.value)}
                required
                value={author}
              />
            </label>
            <label>
              Comment
              <textarea
                disabled={isMutating}
                onChange={(event) => setBody(event.target.value)}
                required
                value={body}
              />
            </label>
            <div className={styles.editorActions}>
              <button className={styles.primaryButton} disabled={isMutating} type="submit">
                {isMutating ? "Saving..." : "Save"}
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isMutating}
                onClick={cancelEdit}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className={styles.body}>{comment.body}</p>
        )}

        <footer className={styles.commentFooter}>
          <p>Updated {formatDateTime(comment.updatedAt)}</p>
          <div className={styles.commentActions}>
            <button
              className={styles.secondaryButton}
              disabled={isMutating}
              onClick={() => {
                setAuthor(comment.author);
                setBody(comment.body);
                setIsEditing(true);
              }}
              type="button"
            >
              Edit
            </button>
            <button
              className={styles.dangerButton}
              disabled={isMutating}
              onClick={() => void onDelete(comment.id)}
              type="button"
            >
              {isMutating ? "Deleting..." : "Delete"}
            </button>
          </div>
        </footer>
      </article>
    </li>
  );
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutatingCommentId, setMutatingCommentId] = useState<number | null>(null);

  async function loadComments() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [commentsResult, tasksResult] = await Promise.all([
        fetchAllPages<Comment>("/api/comments", "comments"),
        fetchAllPages<Task>("/api/tasks", "tasks"),
      ]);
      setComments(commentsResult);
      setTasks(tasksResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load comments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComments();
  }, []);

  const visibleComments = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    return comments.filter((comment) => {
      const matchesTask = selectedTaskId === "all" || comment.taskId === Number(selectedTaskId);
      const matchesKeyword =
        normalizedKeyword === "" ||
        comment.body.toLocaleLowerCase().includes(normalizedKeyword) ||
        comment.author.toLocaleLowerCase().includes(normalizedKeyword) ||
        findTaskName(tasks, comment.taskId).toLocaleLowerCase().includes(normalizedKeyword);
      return matchesTask && matchesKeyword;
    });
  }, [comments, keyword, selectedTaskId, tasks]);

  async function addComment(values: CommentFormValues) {
    setErrorMessage(null);
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const message = await getErrorMessage(response, "Unable to create comment");
      setErrorMessage(message);
      throw new Error(message);
    }

    const result: { data: Comment } = await response.json();
    setComments((currentComments) => [result.data, ...currentComments]);
  }

  async function updateComment(id: number, values: { author: string; body: string }) {
    setMutatingCommentId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to update comment"));
      }

      const result: { data: Comment } = await response.json();
      setComments((currentComments) =>
        currentComments.map((comment) => (comment.id === id ? result.data : comment)),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update comment");
      throw error;
    } finally {
      setMutatingCommentId(null);
    }
  }

  async function deleteComment(id: number) {
    setMutatingCommentId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to delete comment"));
      }
      setComments((currentComments) => currentComments.filter((comment) => comment.id !== id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete comment");
    } finally {
      setMutatingCommentId(null);
    }
  }

  return (
    <>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/">TaskHub</Link>
        <nav aria-label="Main navigation">
          <ul className={styles.navigation}>
            <li><Link href="/projects">Projects</Link></li>
            <li><Link href="/tasks">Tasks</Link></li>
            <li><Link href="/comments">Comments</Link></li>
            <li><Link href="/login">Logout</Link></li>
          </ul>
        </nav>
      </header>

      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>TASK / COMMENTS</p>
            <h1>Comments</h1>
            <p>Collect notes, questions, and status updates against existing tasks.</p>
          </div>
        </header>

        <CommentForm onAdd={addComment} tasks={tasks} />

        <section aria-labelledby="filters-heading">
          <h2 id="filters-heading">Filters</h2>
          <div className={styles.toolbar}>
            <label>
              Task
              <select
                onChange={(event) => setSelectedTaskId(event.target.value)}
                value={selectedTaskId}
              >
                <option value="all">All tasks</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.search}>
              Search
              <input
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search author, task, or body"
                type="search"
                value={keyword}
              />
            </label>
          </div>
        </section>

        <section aria-labelledby="comment-list-heading">
          <div className={styles.sectionHeading}>
            <h2 id="comment-list-heading">Comment list</h2>
            <span>{visibleComments.length} items</span>
          </div>
          {isLoading ? (
            <div aria-live="polite" className={styles.statusState}>
              <span aria-hidden="true" className={styles.statusSpinner} />
              <p>Loading comments...</p>
            </div>
          ) : errorMessage && comments.length === 0 ? (
            <div aria-live="assertive" className={styles.statusState} role="alert">
              <p>{errorMessage}</p>
              <button className={styles.textButton} onClick={() => void loadComments()} type="button">
                Retry
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <p aria-live="assertive" className={styles.requestError} role="alert">
                  {errorMessage}
                </p>
              )}
              {visibleComments.length > 0 ? (
                <ul className={styles.commentList}>
                  {visibleComments.map((comment) => (
                    <CommentItem
                      comment={comment}
                      isMutating={mutatingCommentId === comment.id}
                      key={comment.id}
                      onDelete={deleteComment}
                      onUpdate={updateComment}
                      taskName={findTaskName(tasks, comment.taskId)}
                    />
                  ))}
                </ul>
              ) : (
                <div aria-live="polite" className={styles.statusState}>
                  <p>No comments match the current filters.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
