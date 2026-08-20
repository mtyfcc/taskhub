"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  taskPriorityLabels,
  taskStatusLabels,
  type Project,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/app/data";
import styles from "./tasks.module.css";

type Status = TaskStatus;
type Filter = "all" | Status;
type PriorityFilter = "all" | TaskPriority;

type ApiError = { error?: { message?: string } };

const statusOptions: Status[] = ["todo", "doing", "done"];
const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];

async function getErrorMessage(response: Response, fallback: string) {
  const body: ApiError = await response.json().catch(() => ({}));
  return body.error?.message ?? fallback;
}

function TaskForm({
  projects,
  onAdd,
}: {
  projects: Project[];
  onAdd: (values: {
    projectId: number;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
  }) => Promise<void>;
}) {
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !projectId) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        projectId: Number(projectId),
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.taskForm} onSubmit={handleSubmit}>
      <label>
        所属项目
        <select
          disabled={isSubmitting || projects.length === 0}
          onChange={(event) => setProjectId(event.target.value)}
          required
          value={projectId || String(projects[0]?.id ?? "")}
        >
          {projects.length === 0 ? (
            <option value="">没有可添加任务的进行中项目</option>
          ) : (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label>
        任务名称
        <input
          disabled={isSubmitting}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：整理产品需求"
          required
          value={title}
        />
      </label>
      <label>
        任务说明
        <input
          disabled={isSubmitting}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="补充任务的交付标准"
          value={description}
        />
      </label>
      <label>
        优先级
        <select
          disabled={isSubmitting}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          value={priority}
        >
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {taskPriorityLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        截止日期
        <input
          disabled={isSubmitting}
          onChange={(event) => setDueDate(event.target.value)}
          type="date"
          value={dueDate}
        />
      </label>
      <button
        className={styles.primaryButton}
        disabled={isSubmitting || projects.length === 0}
        type="submit"
      >
        {isSubmitting ? "创建中..." : "添加任务"}
      </button>
    </form>
  );
}

function TaskItem({
  task,
  isConfirmingDelete,
  isMutating,
  onStatusChange,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  task: Task;
  isConfirmingDelete: boolean;
  isMutating: boolean;
  onStatusChange: (id: number, status: Status) => Promise<void>;
  onRequestDelete: (id: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: number) => Promise<void>;
}) {
  const toggleStatus = task.status === "done" ? "todo" : "done";

  return (
    <li>
      <article className={styles.taskCard}>
        <header className={styles.taskHeader}>
          <div className={styles.taskTitle}>
            <input
              aria-label={`标记“${task.title}”`}
              checked={task.status === "done"}
              disabled={isMutating}
              onChange={() => void onStatusChange(task.id, toggleStatus)}
              type="checkbox"
            />
            <div>
              <h3 className={task.status === "done" ? styles.completed : undefined}>
                {task.title}
              </h3>
              <p>{task.description || "暂无说明"}</p>
            </div>
          </div>
          <label className={`${styles.status} ${styles[task.status]}`}>
            <span className={styles.srOnly}>任务状态</span>
            <select
              aria-label={`设置“${task.title}”的状态`}
              disabled={isMutating}
              onChange={(event) => void onStatusChange(task.id, event.target.value as Status)}
              value={task.status}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {taskStatusLabels[option]}
                </option>
              ))}
            </select>
          </label>
        </header>

        <footer className={styles.taskFooter}>
          <p>优先级：{taskPriorityLabels[task.priority]}</p>
          <p>截止日期：{task.dueDate}</p>
          <Link className={styles.detailLink} href={`/tasks/${task.id}`}>
            查看详情
          </Link>
          <button
            className={styles.textButton}
            disabled={isMutating}
            onClick={() => onRequestDelete(task.id)}
            type="button"
          >
            删除
          </button>
        </footer>

        {isConfirmingDelete && (
          <div className={styles.deleteConfirmation} role="alert">
            <span>确定要删除“{task.title}”吗？</span>
            <div className={styles.confirmationActions}>
              <button
                className={styles.textButton}
                disabled={isMutating}
                onClick={onCancelDelete}
                type="button"
              >
                取消
              </button>
              <button
                className={styles.dangerButton}
                disabled={isMutating}
                onClick={() => void onConfirmDelete(task.id)}
                type="button"
              >
                {isMutating ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        )}
      </article>
    </li>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [mutatingTaskId, setMutatingTaskId] = useState<number | null>(null);

  function getTasksEndpoint() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("simulateError") === "1") return "/api/tasks?fail=1";
    }
    return "/api/tasks?limit=100";
  }

  async function loadTasks() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [tasksResponse, projectsResponse] = await Promise.all([
        fetch(getTasksEndpoint()),
        fetch("/api/projects?status=active&limit=100"),
      ]);
      if (!tasksResponse.ok) {
        throw new Error(await getErrorMessage(tasksResponse, "任务数据加载失败"));
      }
      if (!projectsResponse.ok) {
        throw new Error(await getErrorMessage(projectsResponse, "项目数据加载失败"));
      }

      const tasksResult: { data: Task[] } = await tasksResponse.json();
      const projectsResult: { data: Project[] } = await projectsResponse.json();
      setTasks(tasksResult.data);
      setProjects(projectsResult.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "任务数据加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      try {
        const [tasksResponse, projectsResponse] = await Promise.all([
          fetch(getTasksEndpoint()),
          fetch("/api/projects?status=active&limit=100"),
        ]);
        if (!tasksResponse.ok) {
          throw new Error(await getErrorMessage(tasksResponse, "任务数据加载失败"));
        }
        if (!projectsResponse.ok) {
          throw new Error(await getErrorMessage(projectsResponse, "项目数据加载失败"));
        }

        const tasksResult: { data: Task[] } = await tasksResponse.json();
        const projectsResult: { data: Project[] } = await projectsResponse.json();
        if (!cancelled) {
          setTasks(tasksResult.data);
          setProjects(projectsResult.data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "任务数据加载失败");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTasks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = filter === "all" || task.status === filter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesKeyword =
        normalizedKeyword === "" ||
        task.title.toLocaleLowerCase().includes(normalizedKeyword) ||
        task.description.toLocaleLowerCase().includes(normalizedKeyword);
      return matchesStatus && matchesPriority && matchesKeyword;
    });
  }, [filter, keyword, priorityFilter, tasks]);

  async function addTask(values: {
    projectId: number;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
  }) {
    setErrorMessage(null);
    const response = await fetch(`/api/projects/${values.projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        description: values.description,
        priority: values.priority,
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
      }),
    });
    if (!response.ok) {
      const message = await getErrorMessage(response, "任务创建失败");
      setErrorMessage(message);
      throw new Error(message);
    }

    const result: { data: Task } = await response.json();
    setTasks((currentTasks) => [result.data, ...currentTasks]);
    setShowForm(false);
  }

  async function changeTaskStatus(id: number, status: Status) {
    setMutatingTaskId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "任务更新失败"));
      }

      const result: { data: Task } = await response.json();
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === id ? result.data : task)),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "任务更新失败");
    } finally {
      setMutatingTaskId(null);
    }
  }

  async function deleteTask(id: number) {
    setMutatingTaskId(id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "任务删除失败"));
      }
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
      setPendingDeleteId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "任务删除失败");
    } finally {
      setMutatingTaskId(null);
    }
  }

  return (
    <>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/">TaskHub</Link>
        <nav aria-label="主导航">
          <ul className={styles.navigation}>
            <li><Link href="/projects">项目</Link></li>
            <li><Link href="/tasks">任务</Link></li>
            <li><Link href="/login">退出</Link></li>
          </ul>
        </nav>
      </header>

      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>PROJECT / TASKS</p>
            <h1>我的任务</h1>
            <p>查看当前项目中的任务与完成状态。</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setShowForm((isOpen) => !isOpen)}
            type="button"
          >
            {showForm ? "收起表单" : "新建任务"}
          </button>
        </header>

        {showForm && <TaskForm onAdd={addTask} projects={projects} />}

        <section aria-labelledby="filters-heading">
          <h2 id="filters-heading">筛选</h2>
          <div className={styles.toolbar}>
            <label>
              状态
              <select onChange={(event) => setFilter(event.target.value as Filter)} value={filter}>
                <option value="all">全部</option>
                {statusOptions.map((option) => <option key={option} value={option}>{taskStatusLabels[option]}</option>)}
              </select>
            </label>
            <label>
              优先级
              <select onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)} value={priorityFilter}>
                <option value="all">全部</option>
                {priorityOptions.map((option) => <option key={option} value={option}>{taskPriorityLabels[option]}</option>)}
              </select>
            </label>
            <label className={styles.search}>
              搜索
              <input
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索标题或说明"
                type="search"
                value={keyword}
              />
            </label>
          </div>
        </section>

        <section aria-labelledby="task-list-heading">
          <div className={styles.sectionHeading}>
            <h2 id="task-list-heading">任务列表</h2>
            <span>{visibleTasks.length} 项</span>
          </div>
          {isLoading ? (
            <div aria-live="polite" className={styles.statusState}>
              <span aria-hidden="true" className={styles.statusSpinner} />
              <p>正在加载任务数据...</p>
            </div>
          ) : errorMessage && tasks.length === 0 ? (
            <div aria-live="assertive" className={styles.statusState} role="alert">
              <p>{errorMessage}</p>
              <button className={styles.textButton} onClick={() => void loadTasks()} type="button">重试</button>
            </div>
          ) : (
            <>
              {errorMessage && <p aria-live="assertive" className={styles.requestError} role="alert">{errorMessage}</p>}
              {visibleTasks.length > 0 ? (
                <ul className={styles.taskList}>
                  {visibleTasks.map((task) => (
                    <TaskItem
                      isConfirmingDelete={pendingDeleteId === task.id}
                      isMutating={mutatingTaskId === task.id}
                      key={task.id}
                      onCancelDelete={() => setPendingDeleteId(null)}
                      onConfirmDelete={deleteTask}
                      onRequestDelete={setPendingDeleteId}
                      onStatusChange={changeTaskStatus}
                      task={task}
                    />
                  ))}
                </ul>
              ) : (
                <div aria-live="polite" className={styles.statusState}><p>没有符合筛选条件的任务。</p></div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
