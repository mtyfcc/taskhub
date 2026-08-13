import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById, getTaskById, taskStatusLabels, tasks } from "@/app/data";
import styles from "../tasks.module.css";

export function generateStaticParams() {
  return tasks.map((task) => ({ taskId: String(task.id) }));
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = getTaskById(Number(taskId));

  if (!task) {
    notFound();
  }

  const project = getProjectById(task.projectId);

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
        <Link className={styles.detailLink} href="/tasks">
          返回任务列表
        </Link>

        <article className={styles.detailPanel}>
          <header className={styles.detailHeader}>
            <div>
              <p className={styles.eyebrow}>TASK / DETAIL</p>
              <h1>{task.title}</h1>
              <p>{task.description || "暂无说明"}</p>
            </div>
            <span className={`${styles.status} ${styles[task.status]}`}>
              {taskStatusLabels[task.status]}
            </span>
          </header>

          <dl className={styles.detailGrid}>
            <div>
              <dt>所属项目</dt>
              <dd>
                {project ? (
                  <Link className={styles.detailLink} href={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                ) : (
                  "未关联项目"
                )}
              </dd>
            </div>
            <div>
              <dt>负责人</dt>
              <dd>{task.assignee}</dd>
            </div>
            <div>
              <dt>优先级</dt>
              <dd>{task.priority}</dd>
            </div>
            <div>
              <dt>截止日期</dt>
              <dd>{task.dueDate || "未设置"}</dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>{taskStatusLabels[task.status]}</dd>
            </div>
          </dl>
        </article>
      </main>
    </>
  );
}
