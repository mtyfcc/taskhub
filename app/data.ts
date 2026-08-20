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
  owner: string;
  deadline: string;
};

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Task = {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  assignee: string;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "进行中",
  paused: "已暂停",
  archived: "已归档",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "待处理",
  doing: "进行中",
  done: "已完成",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};
