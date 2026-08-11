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

export type Task = {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  priority: "高" | "中" | "低";
  assignee: string;
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

export const projects: Project[] = [
  {
    id: 1,
    name: "TaskHub 产品迭代",
    description: "完善任务管理、项目协作和团队工作流。",
    status: "active",
    taskCount: 12,
    completedTaskCount: 7,
    updatedAt: "今天 09:30",
    accent: "#176b55",
    owner: "产品团队",
    deadline: "2026-08-30",
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
    owner: "增长团队",
    deadline: "2026-09-12",
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
    owner: "研究团队",
    deadline: "2026-09-05",
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
    owner: "平台团队",
    deadline: "2026-07-31",
  },
];

export const tasks: Task[] = [
  {
    id: 1,
    projectId: 1,
    title: "完成登录页面",
    description: "实现登录表单和基本响应式布局。",
    status: "doing",
    dueDate: "2026-08-09",
    priority: "高",
    assignee: "前端同学",
  },
  {
    id: 2,
    projectId: 1,
    title: "设计项目列表",
    description: "整理项目卡片需要展示的信息。",
    status: "todo",
    dueDate: "2026-08-12",
    priority: "中",
    assignee: "产品同学",
  },
  {
    id: 3,
    projectId: 1,
    title: "学习 Git 分支",
    description: "使用功能分支完成一次完整提交。",
    status: "done",
    dueDate: "2026-08-05",
    priority: "低",
    assignee: "学习小组",
  },
  {
    id: 4,
    projectId: 2,
    title: "梳理首页信息架构",
    description: "明确首屏、客户案例和价格模块的展示顺序。",
    status: "doing",
    dueDate: "2026-08-18",
    priority: "高",
    assignee: "增长团队",
  },
  {
    id: 5,
    projectId: 2,
    title: "检查移动端导航",
    description: "保证窄屏下菜单、按钮和文案不会重叠。",
    status: "todo",
    dueDate: "2026-08-21",
    priority: "中",
    assignee: "设计团队",
  },
  {
    id: 6,
    projectId: 3,
    title: "整理访谈问题",
    description: "把近期用户反馈归类成可执行的访谈提纲。",
    status: "todo",
    dueDate: "2026-08-25",
    priority: "中",
    assignee: "研究团队",
  },
  {
    id: 7,
    projectId: 4,
    title: "校验历史任务数量",
    description: "抽样核对迁移后的任务总量和完成状态。",
    status: "done",
    dueDate: "2026-07-25",
    priority: "高",
    assignee: "平台团队",
  },
];

export function getProjectById(projectId: number) {
  return projects.find((project) => project.id === projectId);
}

export function getTaskById(taskId: number) {
  return tasks.find((task) => task.id === taskId);
}

export function getTasksByProjectId(projectId: number) {
  return tasks.filter((task) => task.projectId === projectId);
}
