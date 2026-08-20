"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { projectStatusLabels, type Project } from "@/app/data";
import { ProjectItem } from "./ProjectItem";
import styles from "./projects.module.css";

type ProjectFormData = {
  name: string;
  description: string;
  status: Project["status"];
};

type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;
type ApiError = { error?: { message?: string } };

const projectStatuses: Project["status"][] = ["active", "paused", "archived"];
const emptyForm: ProjectFormData = { name: "", description: "", status: "active" };

async function getErrorMessage(response: Response, fallback: string) {
  const body: ApiError = await response.json().catch(() => ({}));
  return body.error?.message ?? fallback;
}

function formFromProject(project: Project): ProjectFormData {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
  };
}

function validateProjectForm(form: ProjectFormData): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "请填写项目名称，方便之后识别这个项目。";
  } else if (form.name.trim().length < 2) {
    errors.name = "项目名称至少需要 2 个字符。";
  }

  if (!form.description.trim()) {
    errors.description = "请补充一句项目说明，让团队知道这个项目要做什么。";
  } else if (form.description.trim().length > 120) {
    errors.description = "项目说明最大 120 个字符，请再精简一点。";
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

  function updateField(name: keyof ProjectFormData, value: string) {
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProjectForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSave(form);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.projectForm} noValidate onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <div>
          <h2>{isEditing ? "编辑项目" : "新建项目"}</h2>
          <p>{isEditing ? "更新项目的基本信息和当前状态。" : "填写项目基本信息，创建后会出现在项目列表中。"}</p>
        </div>
        <button className={styles.textButton} onClick={onCancel} type="button">取消</button>
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
          {errors.name && <span className={styles.errorMessage} id="project-name-error">{errors.name}</span>}
        </label>

        <label className={styles.field} htmlFor="project-status">
          项目状态
          <select
            disabled={isSubmitting || !isEditing}
            id="project-status"
            name="status"
            onChange={(event) => updateField("status", event.target.value as Project["status"])}
            value={form.status}
          >
            {projectStatuses.map((status) => (
              <option key={status} value={status}>{projectStatusLabels[status]}</option>
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
          {errors.description && <span className={styles.errorMessage} id="project-description-error">{errors.description}</span>}
        </label>
      </div>

      <div className={styles.formActions}>
        <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
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
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  function getProjectsEndpoint() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("simulateError") === "1") return "/api/projects?fail=1";
    }
    return "/api/projects?limit=100";
  }

  async function loadProjects() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await fetch(getProjectsEndpoint());
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "项目数据加载失败"));
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
          throw new Error(await getErrorMessage(response, "项目数据加载失败"));
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
    setErrorMessage(null);
    const response = await fetch(editingProject ? `/api/projects/${editingProject.id}` : "/api/projects", {
      method: editingProject ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        ...(editingProject ? { status: form.status } : {}),
      }),
    });

    if (!response.ok) {
      const message = await getErrorMessage(response, editingProject ? "项目更新失败" : "项目创建失败");
      setErrorMessage(message);
      throw new Error(message);
    }

    const result: { data: Project } = await response.json();
    setProjects((currentProjects) => {
      if (editingProject) {
        return currentProjects.map((project) => project.id === editingProject.id ? result.data : project);
      }
      return [result.data, ...currentProjects];
    });
    setShowForm(false);
    setEditingProject(null);
  }

  async function deleteProject(project: Project) {
    setDeletingProjectId(project.id);
    setErrorMessage(null);
    try {
      let targetProject = project;
      if (project.status !== "archived") {
        if (project.taskCount > 0) {
          throw new Error("项目必须先归档，且删除前不能包含任务");
        }

        const archiveResponse = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "archived" }),
        });
        if (!archiveResponse.ok) {
          throw new Error(await getErrorMessage(archiveResponse, "项目归档失败"));
        }
        const archiveResult: { data: Project } = await archiveResponse.json();
        targetProject = archiveResult.data;
        setProjects((currentProjects) =>
          currentProjects.map((currentProject) =>
            currentProject.id === project.id ? targetProject : currentProject,
          ),
        );
      }

      const response = await fetch(`/api/projects/${targetProject.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "项目删除失败"));
      }
      setProjects((currentProjects) => currentProjects.filter((currentProject) => currentProject.id !== project.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "项目删除失败");
    } finally {
      setDeletingProjectId(null);
    }
  }

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
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>WORKSPACE / PROJECTS</p>
            <h1>项目列表</h1>
            <p>集中查看项目进度、任务数量和最近更新时间。</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryButton} onClick={openCreateForm} type="button">新建项目</button>
            <Link className={styles.projectLink} href="/tasks">查看全部任务</Link>
          </div>
        </header>

        {showForm && (
          <ProjectForm
            initialValue={editingProject ? formFromProject(editingProject) : emptyForm}
            isEditing={Boolean(editingProject)}
            key={editingProject?.id ?? "new"}
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
          ) : errorMessage && projects.length === 0 ? (
            <div aria-live="assertive" className={styles.statusState} role="alert">
              <p>{errorMessage}</p>
              <button className={styles.textButton} disabled={isLoading} onClick={() => void loadProjects()} type="button">重试</button>
            </div>
          ) : (
            <>
              {errorMessage && <p aria-live="assertive" className={styles.requestError} role="alert">{errorMessage}</p>}
              {projects.length > 0 ? (
                <ul className={styles.projectList}>
                  {projects.map((project) => (
                    <ProjectItem
                      isDeleting={deletingProjectId === project.id}
                      key={project.id}
                      onDelete={deleteProject}
                      onEdit={openEditForm}
                      project={project}
                    />
                  ))}
                </ul>
              ) : (
                <div aria-live="polite" className={styles.statusState}><p>还没有项目。</p></div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
