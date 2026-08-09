"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import styles from "./tasks.module.css";

type Status = "todo" | "doing" | "done";
type Filter = "all" | Status;

type Task = {
  id: number;
  title: string;
  description: string;
  status: Status;
  dueDate: string;
  priority: "高" | "中" | "低";
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "完成登录页面",
    description: "实现登录表单和基本响应式布局。",
    status: "doing",
    dueDate: "2026-08-09",
    priority: "高",
  },
  {
    id: 2,
    title: "设计项目列表",
    description: "整理项目卡片需要展示的信息。",
    status: "todo",
    dueDate: "2026-08-12",
    priority: "中",
  },
  {
    id: 3,
    title: "学习 Git 分支",
    description: "使用功能分支完成一次完整提交。",
    status: "done",
    dueDate: "2026-08-05",
    priority: "低",
  },
];

const statusLabels: Record<Status, string> = {
  todo: "待处理",
  doing: "进行中",
  done: "已完成",
};

const statusOptions: Status[] = ["todo", "doing", "done"];

function TaskForm({
  onAdd,
}: {
  onAdd: (title: string, description: string, status: Status, dueDate: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("todo");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onAdd(title, description, status, dueDate);
    setTitle("");
    setDescription("");
    setStatus("todo");
    setDueDate("");
  }

  return (
    <form className={styles.taskForm} onSubmit={handleSubmit}>
      <label>
        任务名称
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：整理产品需求"
        />
      </label>
      <label>
        任务说明
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="补充任务的交付标准"
        />
      </label>
      <label>
        状态
        <select value={status} onChange={(event) => setStatus(event.target.value as Status)}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        截止日期
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </label>
      <button className={styles.primaryButton} type="submit">
        添加任务
      </button>
    </form>
  );
}

function TaskItem({
  task,
  isConfirmingDelete,
  onToggle,
  onStatusChange,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  task: Task;
  isConfirmingDelete: boolean;
  onToggle: (id: number) => void;
  onStatusChange: (id: number, status: Status) => void;
  onRequestDelete: (id: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: number) => void;
}) {
  return (
    <li>
      <article className={styles.taskCard}>
        <header className={styles.taskHeader}>
          <div className={styles.taskTitle}>
            <input
              aria-label={`标记“${task.title}”`}
              checked={task.status === "done"}
              onChange={() => onToggle(task.id)}
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
              value={task.status}
              onChange={(event) => onStatusChange(task.id, event.target.value as Status)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {statusLabels[option]}
                </option>
              ))}
            </select>
          </label>
        </header>

        <footer className={styles.taskFooter}>
          <p>优先级：{task.priority}</p>
          <p>截止日期：{task.dueDate || "未设置"}</p>
          <button
            className={styles.textButton}
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
              <button className={styles.textButton} onClick={onCancelDelete} type="button">
                取消
              </button>
              <button
                className={styles.dangerButton}
                onClick={() => onConfirmDelete(task.id)}
                type="button"
              >
                确认删除
              </button>
            </div>
          </div>
        )}
      </article>
    </li>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<Filter>("all");
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const visibleTasks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = filter === "all" || task.status === filter;
      const matchesKeyword =
        normalizedKeyword === "" ||
        task.title.toLocaleLowerCase().includes(normalizedKeyword) ||
        task.description.toLocaleLowerCase().includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });
  }, [filter, keyword, tasks]);

  function addTask(title: string, description: string, status: Status, dueDate: string) {
    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate,
        priority: "中",
      },
    ]);
    setShowForm(false);
  }

  function toggleTask(id: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "done" ? "todo" : "done" }
          : task,
      ),
    );
  }

  function changeTaskStatus(id: number, status: Status) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, status } : task)),
    );
  }

  function requestDelete(id: number) {
    setPendingDeleteId(id);
  }

  function deleteTask(id: number) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    setPendingDeleteId(null);
  }

  return (
    <>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/">
          TaskHub
        </Link>
        <nav aria-label="主导航">
          <ul className={styles.navigation}>
            <li>
              <Link href="/projects">项目</Link>
            </li>
            <li>
              <Link href="/tasks">任务</Link>
            </li>
            <li>
              <Link href="/login">退出</Link>
            </li>
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

        {showForm && <TaskForm onAdd={addTask} />}

        <section aria-labelledby="filters-heading">
          <h2 id="filters-heading">筛选</h2>
          <div className={styles.toolbar}>
            <label>
              状态
              <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
                <option value="all">全部</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.search}>
              搜索
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索标题或说明"
              />
            </label>
          </div>
        </section>

        <section aria-labelledby="task-list-heading">
          <div className={styles.sectionHeading}>
            <h2 id="task-list-heading">任务列表</h2>
            <span>{visibleTasks.length} 项</span>
          </div>
          {visibleTasks.length > 0 ? (
            <ul className={styles.taskList}>
              {visibleTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isConfirmingDelete={pendingDeleteId === task.id}
                  onToggle={toggleTask}
                  onStatusChange={changeTaskStatus}
                  onRequestDelete={requestDelete}
                  onCancelDelete={() => setPendingDeleteId(null)}
                  onConfirmDelete={deleteTask}
                />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>没有符合筛选条件的任务。</p>
          )}
        </section>
      </main>
    </>
  );
}
