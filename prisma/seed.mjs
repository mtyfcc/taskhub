import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const projects = [
  {
    id: 1,
    name: "TaskHub 产品迭代",
    description: "完善任务管理、项目协作和团队工作流。",
    status: "active",
    accent: "#176b55",
    owner: "产品团队",
    deadline: new Date("2026-08-30T00:00:00.000Z"),
    tasks: [
      {
        id: 1,
        title: "完成登录页面",
        description: "实现登录表单和基础响应式布局。",
        status: "doing",
        dueDate: new Date("2026-08-09T00:00:00.000Z"),
        priority: "high",
        assignee: "frontend",
      },
      {
        id: 2,
        title: "设计项目列表",
        description: "整理项目卡片需要展示的信息。",
        status: "todo",
        dueDate: new Date("2026-08-12T00:00:00.000Z"),
        priority: "medium",
        assignee: "product",
      },
      {
        id: 3,
        title: "学习 Git 分支",
        description: "使用功能分支完成一次完整提交。",
        status: "done",
        dueDate: new Date("2026-08-05T00:00:00.000Z"),
        priority: "low",
        assignee: "study-group",
      },
    ],
  },
  {
    id: 2,
    name: "营销官网重构",
    description: "重新梳理页面结构、品牌内容和移动端体验。",
    status: "active",
    accent: "#0d5aa7",
    owner: "增长团队",
    deadline: new Date("2026-09-12T00:00:00.000Z"),
    tasks: [
      {
        id: 4,
        title: "梳理首页信息架构",
        description: "明确首屏、客户案例和价格模块的展示顺序。",
        status: "doing",
        dueDate: new Date("2026-08-18T00:00:00.000Z"),
        priority: "urgent",
        assignee: "growth",
      },
      {
        id: 5,
        title: "检查移动端导航",
        description: "保证窄屏下菜单、按钮和文案不会重叠。",
        status: "todo",
        dueDate: new Date("2026-08-21T00:00:00.000Z"),
        priority: "medium",
        assignee: "design",
      },
    ],
  },
  {
    id: 3,
    name: "用户研究计划",
    description: "收集用户反馈，整理访谈记录并输出研究结论。",
    status: "paused",
    accent: "#b56b00",
    owner: "研究团队",
    deadline: new Date("2026-09-05T00:00:00.000Z"),
    tasks: [
      {
        id: 6,
        title: "整理访谈问题",
        description: "把近期用户反馈归类成可执行的访谈提纲。",
        status: "todo",
        dueDate: new Date("2026-08-25T00:00:00.000Z"),
        priority: "medium",
        assignee: "research",
      },
    ],
  },
  {
    id: 4,
    name: "旧版数据迁移",
    description: "将历史项目和任务数据迁移到新的工作区。",
    status: "archived",
    accent: "#52606d",
    owner: "平台团队",
    deadline: new Date("2026-07-31T00:00:00.000Z"),
    tasks: [
      {
        id: 7,
        title: "校验历史任务数量",
        description: "抽样核对迁移后的任务总量和完成状态。",
        status: "done",
        dueDate: new Date("2026-07-25T00:00:00.000Z"),
        priority: "high",
        assignee: "platform",
      },
    ],
  },
];

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  for (const project of projects) {
    const { tasks, ...projectData } = project;
    await prisma.project.create({
      data: {
        ...projectData,
        tasks: { create: tasks },
      },
    });
  }
}

main()
  .then(async () => {
    const [projectCount, taskCount] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
    ]);

    console.log(`Seeded ${projectCount} projects and ${taskCount} tasks.`);
  })
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
