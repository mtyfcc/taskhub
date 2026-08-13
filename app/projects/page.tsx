"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  projectStatusLabels,
  type Project,
} from "@/app/data";
import { ProjectItem } from "./ProjectItem";
import styles from "./projects.module.css";

type ProjectFormData = {
  name: string;
  description: string;
  status: Project["status"];
  taskCount: string;
  completedTaskCount: string;
  accent: string;
};

type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;

const projectStatuses: Project["status"][] = ["active", "paused", "archived"];

const emptyForm: ProjectFormData = {
  name: "",
  description: "",
  status: "active",
  taskCount: "0",
  completedTaskCount: "0",
  accent: "#176b55",
};

function getCurrentTimeLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function formFromProject(project: Project): ProjectFormData {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    taskCount: String(project.taskCount),
    completedTaskCount: String(project.completedTaskCount),
    accent: project.accent,
  };
}

function validateProjectForm(form: ProjectFormData): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const taskCount = Number(form.taskCount);
  const completedTaskCount = Number(form.completedTaskCount);

  if (!form.name.trim()) {
    errors.name = "请填写项目名称，方便你之后识别这个项目。";
  } else if (form.name.trim().length < 2) {
    errors.name = "项目名称至少需要 2 个字符。";
  }

  if (!form.description.trim()) {
    errors.description = "请补充一句项目说明，让团队知道这个项目要做什么。";
  } else if (form.description.trim().length > 120) {
    errors.description = "项目说明最多 120 个字符，请再精简一点。";
  }

  if (!Number.isInteger(taskCount) || taskCount < 0) {
    errors.taskCount = "任务总数必须是 0 或更大的整数。";
  }

  if (!Number.isInteger(completedTaskCount) || completedTaskCount < 0) {
    errors.completedTaskCount = "已完成任务数必须是 0 或更大的整数。";
  } else if (Number.isInteger(taskCount) && completedTaskCount > taskCount) {
    errors.completedTaskCount = "已完成任务数不能大于任务总数。";
  }

  if (!form.accent) {
    errors.accent = "请选择一个项目标识颜色。";
  }

  return errors;
}

function ProjectForm({
  initialValue,
  isEditing,
  onCancel,
  onSave,
}: {
  initialValue: ProjectFormData;
  isEditing: boolean;
  onCancel: () => void;
  onSave: (form: ProjectFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<ProjectFormData>(initialValue);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  function updateField(name: keyof ProjectFormData, value: string) {
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLock.current) {
      return;
    }

    const nextErrors = validateProjectForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      await onSave(form);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.projectForm} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <div>
          <h2>{isEditing ? "编辑项目" : "新建项目"}</h2>
          <p>{isEditing ? "更新项目的基本信息和当前进度。" : "填写项目基本信息，创建后会出现在项目列表中。"}</p>
        </div>
        <button className={styles.textButton} onClick={onCancel} type="button">
          取消
        </button>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field} htmlFor="project-name">
          项目名称
          <input
            aria-describedby={errors.name ? "project-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            disabled={isSubmitting}
            id="project-name"
            name="name"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="例如：移动端体验优化"
            value={form.name}
          />
          {errors.name && (
            <span className={styles.errorMessage} id="project-name-error">
              {errors.name}
            </span>
          )}
        </label>

        <label className={styles.field} htmlFor="project-status">
          项目状态
          <select
            disabled={isSubmitting}
            id="project-status"
            name="status"
            onChange={(event) =>
              updateField("status", event.target.value as Project["status"])
            }
            value={form.status}
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${styles.fullWidth}`} htmlFor="project-description">
          项目说明
          <textarea
            aria-describedby={errors.description ? "project-description-error" : undefined}
            aria-invalid={Boolean(errors.description)}
            disabled={isSubmitting}
            id="project-description"
            name="description"
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="用一句话说明这个项目的目标"
            rows={3}
            value={form.description}
          />
          {errors.description && (
            <span className={styles.errorMessage} id="project-description-error">
              {errors.description}
            </span>
          )}
        </label>

        <label className={styles.field} htmlFor="project-task-count">
          任务总数
          <input
            aria-describedby={errors.taskCount ? "project-task-count-error" : undefined}
            aria-invalid={Boolean(errors.taskCount)}
            disabled={isSubmitting}
            id="project-task-count"
            min="0"
            name="taskCount"
            onChange={(event) => updateField("taskCount", event.target.value)}
            type="number"
            value={form.taskCount}
          />
          {errors.taskCount && (
            <span className={styles.errorMessage} id="project-task-count-error">
              {errors.taskCount}
            </span>
          )}
        </label>

        <label className={styles.field} htmlFor="project-completed-count">
          已完成任务数
          <input
            aria-describedby={
              errors.completedTaskCount ? "project-completed-count-error" : undefined
            }
            aria-invalid={Boolean(errors.completedTaskCount)}
            disabled={isSubmitting}
            id="project-completed-count"
            min="0"
            name="completedTaskCount"
            onChange={(event) =>
              updateField("completedTaskCount", event.target.value)
            }
            type="number"
            value={form.completedTaskCount}
          />
          {errors.completedTaskCount && (
            <span className={styles.errorMessage} id="project-completed-count-error">
              {errors.completedTaskCount}
            </span>
          )}
        </label>

        <label className={styles.field} htmlFor="project-accent">
          标识颜色
          <input
            aria-describedby={errors.accent ? "project-accent-error" : undefined}
            aria-invalid={Boolean(errors.accent)}
            disabled={isSubmitting}
            id="project-accent"
            name="accent"
            onChange={(event) => updateField("accent", event.target.value)}
            type="color"
            value={form.accent}
          />
          {errors.accent && (
            <span className={styles.errorMessage} id="project-accent-error">
              {errors.accent}
            </span>
          )}
        </label>
      </div>

      <div className={styles.formActions}>
        <button
          className={styles.primaryButton}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "提交中..." : isEditing ? "保存修改" : "创建项目"}
        </button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  function getProjectsEndpoint() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("simulateError") === "1") {
        return "/api/projects?fail=1";
      }
    }

    return "/api/projects";
  }

  async function loadProjects() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch(getProjectsEndpoint());
      if (!response.ok) {
        throw new Error("项目数据加载失败");
      }

      const result: { data: Project[] } = await response.json();
      setProjects(result.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "项目数据加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      try {
        const response = await fetch(getProjectsEndpoint());
        if (!response.ok) {
          throw new Error("项目数据加载失败");
        }

        const result: { data: Project[] } = await response.json();
        if (!cancelled) {
          setProjects(result.data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "项目数据加载失败");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreateForm() {
    setEditingProject(null);
    setShowForm(true);
  }

  function openEditForm(project: Project) {
    setEditingProject(project);
    setShowForm(true);
  }

  async function saveProject(form: ProjectFormData) {
    const projectValues = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      taskCount: Number(form.taskCount),
      completedTaskCount: Number(form.completedTaskCount),
      accent: form.accent,
      updatedAt: getCurrentTimeLabel(),
      owner: editingProject?.owner ?? "我",
      deadline: editingProject?.deadline ?? "未设置",
    };

    setProjects((currentProjects) => {
      if (editingProject) {
        return currentProjects.map((project) =>
          project.id === editingProject.id ? { ...project, ...projectValues } : project,
        );
      }

      return [
        {
          id: Date.now(),
          ...projectValues,
        },
        ...currentProjects,
      ];
    });

    setShowForm(false);
    setEditingProject(null);
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
            <p className={styles.eyebrow}>WORKSPACE / PROJECTS</p>
            <h1>项目列表</h1>
            <p>集中查看项目进度、任务数量和最近更新时间。</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryButton} onClick={openCreateForm} type="button">
              新建项目
            </button>
            <Link className={styles.projectLink} href="/tasks">
              查看全部任务
            </Link>
          </div>
        </header>

        {showForm && (
          <ProjectForm
            key={editingProject?.id ?? "new"}
            initialValue={editingProject ? formFromProject(editingProject) : emptyForm}
            isEditing={Boolean(editingProject)}
            onCancel={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
            onSave={saveProject}
          />
        )}

        <section aria-labelledby="project-list-heading">
          <div className={styles.sectionHeading}>
            <h2 id="project-list-heading">我的项目</h2>
            <span>{projects.length} 个项目</span>
          </div>

          {isLoading ? (
            <div aria-live="polite" className={styles.statusState}>
              <span aria-hidden="true" className={styles.statusSpinner} />
              <p>正在加载项目数据...</p>
            </div>
          ) : errorMessage ? (
            <div aria-live="assertive" className={styles.statusState} role="alert">
              <p>{errorMessage}</p>
              <button
                className={styles.textButton}
                disabled={isLoading}
                onClick={() => void loadProjects()}
                type="button"
              >
                重试
              </button>
            </div>
          ) : projects.length > 0 ? (
            <ul className={styles.projectList}>
              {projects.map((project) => (
                <ProjectItem key={project.id} project={project} onEdit={openEditForm} />
              ))}
            </ul>
          ) : (
            <div aria-live="polite" className={styles.statusState}>
              <p>还没有项目。</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
