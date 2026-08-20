import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import {
  projectStatusLabels,
  taskStatusLabels,
  type ProjectStatus,
  type TaskStatus,
} from "@/app/data";
import { prisma } from "@/lib/prisma";
import styles from "../projects.module.css";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const id = Number(projectId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { updatedAt: "desc" } } },
  });

  if (!project) {
    notFound();
  }

  const status = project.status as ProjectStatus;
  const completedTaskCount = project.tasks.filter((task) => task.status === "done").length;
  const progress =
    project.tasks.length === 0
      ? 0
      : Math.round((completedTaskCount / project.tasks.length) * 100);

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
        <Link className={styles.projectLink} href="/projects">返回项目列表</Link>

        <article
          className={styles.detailPanel}
          style={{ "--project-accent": project.accent } as CSSProperties}
        >
          <header className={styles.detailHeader}>
            <div>
              <p className={styles.eyebrow}>PROJECT / DETAIL</p>
              <h1>{project.name}</h1>
              <p>{project.description}</p>
            </div>
            <span className={`${styles.status} ${styles[status]}`}>
              {projectStatusLabels[status]}
            </span>
          </header>

          <div className={styles.detailStats}>
            <div>
              <span>负责人</span>
              <strong>{project.owner}</strong>
            </div>
            <div>
              <span>截止日期</span>
              <strong>{project.deadline.toISOString().slice(0, 10)}</strong>
            </div>
            <div>
              <span>任务进度</span>
              <strong>{completedTaskCount}/{project.tasks.length}</strong>
            </div>
            <div>
              <span>最近更新</span>
              <strong>{project.updatedAt.toISOString()}</strong>
            </div>
          </div>

          <div className={styles.progressBlock}>
            <div className={styles.progressLabel}>
              <span>完成进度</span>
              <span>{progress}%</span>
            </div>
            <div
              aria-label={`${project.name} 已完成 ${progress}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
              className={styles.progressTrack}
              role="progressbar"
            >
              <div className={styles.progressValue} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </article>

        <section aria-labelledby="project-tasks-heading">
          <div className={styles.sectionHeading}>
            <h2 id="project-tasks-heading">项目任务</h2>
            <span>{project.tasks.length} 项</span>
          </div>

          {project.tasks.length > 0 ? (
            <ul className={styles.relatedList}>
              {project.tasks.map((task) => {
                const taskStatus = task.status as TaskStatus;
                return (
                  <li key={task.id}>
                    <Link className={styles.relatedItem} href={`/tasks/${task.id}`}>
                      <div>
                        <strong>{task.title}</strong>
                        <p>{task.description}</p>
                      </div>
                      <span className={`${styles.status} ${styles[taskStatus]}`}>
                        {taskStatusLabels[taskStatus]}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyState}>这个项目还没有任务。</p>
          )}
        </section>
      </main>
    </>
  );
}
