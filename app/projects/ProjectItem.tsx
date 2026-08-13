import Link from "next/link";
import type { CSSProperties } from "react";
import { projectStatusLabels, type Project } from "@/app/data";
import styles from "./projects.module.css";

export function ProjectItem({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (project: Project) => void;
}) {
  const progress =
    project.taskCount === 0
      ? 0
      : Math.round((project.completedTaskCount / project.taskCount) * 100);

  return (
    <li>
      <article
        className={styles.projectCard}
        style={{ "--project-accent": project.accent } as CSSProperties}
      >
        <header>
          <div>
            <h3>{project.name}</h3>
            <p className={styles.projectDescription}>{project.description}</p>
          </div>
          <span className={`${styles.status} ${styles[project.status]}`}>
            {projectStatusLabels[project.status]}
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
          <div className={styles.projectActions}>
            <button
              className={styles.textButton}
              onClick={() => onEdit(project)}
              type="button"
            >
              编辑
            </button>
            <Link className={styles.projectLink} href={`/projects/${project.id}`}>
              查看详情
            </Link>
          </div>
        </footer>
      </article>
    </li>
  );
}
