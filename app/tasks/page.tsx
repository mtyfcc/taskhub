    "use client";

    import Link from "next/link";
    import { FormEvent, useState } from "react";
    import styles from "./tasks.module.css";

    const tasks = [
    {
        id: 1,
        title: "完成登录页面",
        description: "实现登录表单和基本响应式布局。",
        status: "进行中",
        statusValue: "doing",
        priority: "高",
    },
    {
        id: 2,
        title: "设计项目列表",
        description: "整理项目卡片需要展示的信息。",
        status: "待处理",
        statusValue: "todo",
        priority: "中",
    },
    {
        id: 3,
        title: "学习 Git 分支",
        description: "使用功能分支完成一次完整提交。",
        status: "已完成",
        statusValue: "done",
        priority: "低",
    },
    ];

    export default function TasksPage() {
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [filters, setFilters] = useState({ status: "all", keyword: "" });

    const filteredTasks = tasks.filter((task) => {
        const matchesStatus =
        filters.status === "all" || task.statusValue === filters.status;
        const normalizedKeyword = filters.keyword.toLocaleLowerCase();
        const matchesKeyword =
        normalizedKeyword === "" ||
        task.title.toLocaleLowerCase().includes(normalizedKeyword) ||
        task.description.toLocaleLowerCase().includes(normalizedKeyword);

        return matchesStatus && matchesKeyword;
    });

    function handleFilter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFilters({ status: selectedStatus, keyword: keyword.trim() });
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
                <h1>我的任务</h1>
                <p>查看当前项目中的任务及完成状态。</p>
            </div>

            <button className={styles.primaryButton} type="button">
                新建任务
            </button>
            </header>

            <section aria-labelledby="filters-heading">
            <h2 id="filters-heading">筛选</h2>

            <form className={styles.toolbar} onSubmit={handleFilter}>
                <label>
                状态
                <select
                    name="status"
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                >
                    <option value="all">全部</option>
                    <option value="todo">待处理</option>
                    <option value="doing">进行中</option>
                    <option value="done">已完成</option>
                </select>
                </label>

                <label className={styles.search}>
                搜索
                <input
                    name="keyword"
                    type="search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                </label>

                <button className={styles.primaryButton} type="submit">
                筛选
                </button>
            </form>
            </section>

            <section aria-labelledby="task-list-heading">
            <h2 id="task-list-heading">任务列表</h2>

            {filteredTasks.length > 0 ? (
                <ul className={styles.taskList}>
                {filteredTasks.map((task) => (
                    <li key={task.id}>
                    <article className={styles.taskCard}>
                        <header className={styles.taskHeader}>
                        <div>
                            <h3>{task.title}</h3>
                            <p>{task.description}</p>
                        </div>
                        <span>{task.status}</span>
                        </header>

                        <footer className={styles.taskFooter}>
                        <p>优先级：{task.priority}</p>
                        <div className={styles.actions}>
                            <button type="button">编辑</button>
                            <button type="button">删除</button>
                        </div>
                        </footer>
                    </article>
                    </li>
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
