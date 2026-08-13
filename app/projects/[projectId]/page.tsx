import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import {
  getProjectById,
  getTasksByProjectId,
  projectStatusLabels,
  projects,
  taskStatusLabels,
} from "@/app/data";
import styles from "../projects.module.css";

export function generateStaticParams() {
  return projects.map((project) => ({ projectId: String(project.id) }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProjectById(Number(projectId));

  if (!project) {
    notFound();
  }

  const projectTasks = getTasksByProjectId(project.id);
  const progress =
    project.taskCount === 0
      ? 0
      : Math.round((project.completedTaskCount / project.taskCount) * 100);

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
        <Link className={styles.projectLink} href="/projects">
          返回项目列表
        </Link>

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
            <span className={`${styles.status} ${styles[project.status]}`}>
              {projectStatusLabels[project.status]}
            </span>
          </header>

          <div className={styles.detailStats}>
            <div>
              <span>负责人</span>
              <strong>{project.owner}</strong>
            </div>
            <div>
              <span>截止日期</span>
              <strong>{project.deadline}</strong>
            </div>
            <div>
              <span>任务进度</span>
              <strong>
                {project.completedTaskCount}/{project.taskCount}
              </strong>
            </div>
            <div>
              <span>最近更新</span>
              <strong>{project.updatedAt}</strong>
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
            <span>{projectTasks.length} 项</span>
          </div>

          {projectTasks.length > 0 ? (
            <ul className={styles.relatedList}>
              {projectTasks.map((task) => (
                <li key={task.id}>
                  <Link className={styles.relatedItem} href={`/tasks/${task.id}`}>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                    </div>
                    <span className={`${styles.status} ${styles[task.status]}`}>
                      {taskStatusLabels[task.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>这个项目还没有示例任务。</p>
          )}
        </section>
      </main>
    </>
  );
}
