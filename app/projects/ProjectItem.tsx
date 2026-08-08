import Link from "next/link";
import styles from "./projects.module.css";

export type ProjectStatus = "active" | "paused" | "archived";

export type Project = {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  taskCount: number;
  completedTaskCount: number;
  updatedAt: string;
  accent: string;
};

const statusLabels: Record<ProjectStatus, string> = {
  active: "进行中",
  paused: "已暂停",
  archived: "已归档",
};

export function ProjectItem({ project }: { project: Project }) {
  const progress =
    project.taskCount === 0
      ? 0
      : Math.round((project.completedTaskCount / project.taskCount) * 100);

  return (
    <li>
      <article
        className={styles.projectCard}
        style={{ "--project-accent": project.accent } as React.CSSProperties}
      >
        <header>
          <div>
            <h3>{project.name}</h3>
            <p className={styles.projectDescription}>{project.description}</p>
          </div>
          <span className={`${styles.status} ${styles[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </header>

        <div className={styles.projectMeta}>
          <span>{project.taskCount} 个任务</span>
          <span>已完成 {project.completedTaskCount} 个</span>
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

        <footer className={styles.projectFooter}>
          <p>最近更新：{project.updatedAt}</p>
          <Link className={styles.projectLink} href="/tasks">
            查看任务
          </Link>
        </footer>
      </article>
    </li>
  );
}
