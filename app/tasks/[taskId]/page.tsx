import Link from "next/link";
import { notFound } from "next/navigation";
import {
  taskPriorityLabels,
  taskStatusLabels,
  type TaskPriority,
  type TaskStatus,
} from "@/app/data";
import { prisma } from "@/lib/prisma";
import styles from "../tasks.module.css";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const id = Number(taskId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!task) {
    notFound();
  }

  const status = task.status as TaskStatus;
  const priority = task.priority as TaskPriority;

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
        <Link className={styles.detailLink} href="/tasks">返回任务列表</Link>

        <article className={styles.detailPanel}>
          <header className={styles.detailHeader}>
            <div>
              <p className={styles.eyebrow}>TASK / DETAIL</p>
              <h1>{task.title}</h1>
              <p>{task.description || "暂无说明"}</p>
            </div>
            <span className={`${styles.status} ${styles[status]}`}>
              {taskStatusLabels[status]}
            </span>
          </header>

          <dl className={styles.detailGrid}>
            <div>
              <dt>所属项目</dt>
              <dd>
                <Link className={styles.detailLink} href={`/projects/${task.project.id}`}>
                  {task.project.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt>负责人</dt>
              <dd>{task.assignee}</dd>
            </div>
            <div>
              <dt>优先级</dt>
              <dd>{taskPriorityLabels[priority]}</dd>
            </div>
            <div>
              <dt>截止日期</dt>
              <dd>{task.dueDate.toISOString().slice(0, 10)}</dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>{taskStatusLabels[status]}</dd>
            </div>
          </dl>
        </article>
      </main>
    </>
  );
}
