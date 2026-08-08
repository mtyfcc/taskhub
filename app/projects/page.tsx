import Link from "next/link";
import { Project, ProjectItem } from "./ProjectItem";
import styles from "./projects.module.css";

const projects: Project[] = [
  {
    id: 1,
    name: "TaskHub 产品迭代",
    description: "完善任务管理、项目协作和团队工作流。",
    status: "active",
    taskCount: 12,
    completedTaskCount: 7,
    updatedAt: "今天 09:30",
    accent: "#176b55",
  },
  {
    id: 2,
    name: "营销官网重构",
    description: "重新梳理页面结构、品牌内容和移动端体验。",
    status: "active",
    taskCount: 8,
    completedTaskCount: 3,
    updatedAt: "昨天 16:20",
    accent: "#0d5aa7",
  },
  {
    id: 3,
    name: "用户研究计划",
    description: "收集用户反馈，整理访谈记录并输出研究结论。",
    status: "paused",
    taskCount: 6,
    completedTaskCount: 2,
    updatedAt: "2026-08-05",
    accent: "#b56b00",
  },
  {
    id: 4,
    name: "旧版数据迁移",
    description: "将历史项目和任务数据迁移到新的工作区。",
    status: "archived",
    taskCount: 10,
    completedTaskCount: 10,
    updatedAt: "2026-07-28",
    accent: "#52606d",
  },
];

export default function ProjectsPage() {
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
            <p className={styles.eyebrow}>WORKSPACE / PROJECTS</p>
            <h1>项目列表</h1>
            <p>集中查看项目进度、任务数量和最近更新时间。</p>
          </div>
          <Link className={styles.projectLink} href="/tasks">
            查看全部任务
          </Link>
        </header>

        <section aria-labelledby="project-list-heading">
          <div className={styles.sectionHeading}>
            <h2 id="project-list-heading">我的项目</h2>
            <span>{projects.length} 个项目</span>
          </div>

          {projects.length > 0 ? (
            <ul className={styles.projectList}>
              {projects.map((project) => (
                <ProjectItem key={project.id} project={project} />
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>还没有项目。</p>
          )}
        </section>
      </main>
    </>
  );
}
