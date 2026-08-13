/* eslint-disable @typescript-eslint/no-require-imports -- This standalone script intentionally uses CommonJS. */
const fs = require('fs');
const path = require('path');

const sourceRoot = process.env.CODEX_EXPORT_ROOT || 'C:\\Users\\matianyu\\.codex\\sessions\\2026\\08';
const outputDir = process.env.CODEX_EXPORT_OUT || 'D:\\taskhub\\notes';

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  });
}

function clean(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function addMessage(list, value) {
  const message = clean(value);
  if (!message || message.includes('<environment_context>') || message.startsWith('# AGENTS.md instructions')) return;
  if (list[list.length - 1] !== message) list.push(message);
}

fs.mkdirSync(outputDir, { recursive: true });
const files = walk(sourceRoot)
  .filter((filePath) => /rollout-2026-08-(0[1-7])T.*\.jsonl$/.test(path.basename(filePath)))
  .sort();

const markdown = [
  '# Codex 本周对话导出',
  '',
  '导出范围：2026-08-01 至 2026-08-07',
  '来源：本机 Codex 会话存档（仅提取用户消息和助手文本）',
  '',
];

for (const filePath of files) {
  const users = [];
  const assistants = [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    if (!line) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    const payload = record.payload || {};
    if (payload.type === 'message' && payload.role === 'user') {
      addMessage(users, (payload.content || [])
        .filter((part) => part.type === 'input_text')
        .map((part) => part.text)
        .join('\n'));
    } else if (payload.type === 'message' && payload.role === 'assistant') {
      addMessage(assistants, (payload.content || [])
        .filter((part) => part.type === 'output_text')
        .map((part) => part.text)
        .join('\n'));
    } else if (record.type === 'event_msg' && payload.type === 'agent_message') {
      addMessage(assistants, payload.message);
    }
  }

  if (!users.length && !assistants.length) continue;
  const date = path.basename(filePath).match(/rollout-(\d{4}-\d{2}-\d{2})T/)[1];
  markdown.push(`## ${date} · ${path.basename(filePath)}`, '');
  const messageCount = Math.max(users.length, assistants.length);
  for (let index = 0; index < messageCount; index += 1) {
    if (users[index]) markdown.push('### 用户', '', users[index], '');
    if (assistants[index]) markdown.push('### 助手', '', assistants[index], '');
  }
}

fs.writeFileSync(path.join(outputDir, 'weekly-codex-chats.md'), markdown.join('\n'), 'utf8');

const summary = `# 本周学习与错误记录

## 时间范围

2026-08-01 至 2026-08-07。根据本机 Codex 会话存档整理。

## 学习主线

- **求职目标**：围绕 AI Agent 开发实习，制定 1 到 2 个月的学习计划，并加入 Git 协作实践。
- **第 3 天：JavaScript 与 TypeScript**：变量、函数、数组、对象、模块、类型系统，以及把这些知识放进任务管理项目。
- **第 4 天：异步与 HTTP**：Promise、async/await、try/catch，GET、POST、PATCH、DELETE 和 HTTP 状态码。
- **第 5 天：AI 任务拆分**：将任务列表拆成组件、数据和交互；先让 AI 阅读文件并给出计划；限制修改范围和依赖；用 \`git diff\` 检查结果。
- **第 6 天：Git 分支与 PR**：\`git switch -c\`、\`git diff\`、\`git push\`、Pull Request、review 和合并到 \`main\`。实际使用了 \`feat/task-filter\` 分支。
- **第 7 天：项目实践**：理解 \`commit\`，为 \`D:\\taskhub\` 增加任务字段，并完成提交和远程推送流程。

## 错误与问题记录

- **对话长时间停留在思考中**：曾遇到消耗 token 后十几分钟没有答案的情况。后续应优先检查是否仍有运行中的工具调用、网络请求或模型响应；必要时停止当前运行并重新提交较小的问题。
- **前端界面疑似被改动**：需要用 \`git status\`、\`git log --oneline\`、\`git diff\` 和分支对比确认修改来源，再决定恢复或保留。不要直接覆盖工作区。
- **编码显示问题**：本机 JSONL 在 PowerShell 输出时可能出现中文乱码，但文件本身可按 UTF-8 解析；导出时应使用结构化 JSON 解析，不要直接复制终端输出。
- **Git 概念混淆**：\`commit\` 是本地版本记录，\`push\` 才是上传到远程仓库；两者不是同一步。
- **任务字段开发风险**：新增字段需要同时检查数据模型、创建/编辑表单、列表展示、详情或筛选逻辑，并运行项目已有的验证命令。

## 本周形成的工作方法

1. 先读项目文件和约束，再让 AI 提方案。
2. 把需求拆成数据、组件、交互和验证四类小任务。
3. 每完成一小块就查看 \`git diff\`，避免一次积累大量不可追踪的修改。
4. 在功能分支开发，提交后 push，再通过 PR review。
5. 出现异常时先保留现场，用状态、日志和差异命令定位，不急于回滚。

## 下周建议

- 给任务字段补充边界测试：空值、非法格式、编辑后刷新、旧数据兼容。
- 完成 \`feat/task-filter\` 的 PR review，并记录 review 意见和修复 commit。
- 为项目补一个清晰的 README：启动命令、技术栈、功能截图、Git 工作流和已知问题。
- 继续学习 Agent 基础：工具调用、结构化输出、上下文管理、错误重试和最小可运行 demo。
`;

fs.writeFileSync(path.join(outputDir, 'weekly-learning-summary.md'), summary, 'utf8');
console.log(JSON.stringify({ files: files.length, outputDir }, null, 2));
