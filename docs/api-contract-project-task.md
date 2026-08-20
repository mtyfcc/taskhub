# Project、Task API 契约

> 版本：v1
> 状态：第一版设计稿
> 更新时间：2026-08-15
> 范围：Project、Task REST API
> 说明：本文档只定义 API 契约，不包含具体实现代码。

## 1. 基础约定

### 1.1 API 前缀

```text
/api/v1
```

### 1.2 请求与响应格式

请求和响应统一使用 JSON：

```http
Content-Type: application/json
```

需要身份认证的接口统一携带：

```http
Authorization: Bearer <access_token>
```

### 1.3 成功响应格式

单个资源：

```json
{
  "data": {}
}
```

资源列表：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 1.4 错误响应格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "name": "Name is required"
    }
  }
}
```

`fields` 只在具体字段校验失败时返回。

## 2. Project 数据结构

```json
{
  "id": "p_1001",
  "name": "Website Redesign",
  "description": "Redesign the company website",
  "status": "active",
  "ownerId": "u_1001",
  "createdAt": "2026-08-15T10:00:00Z",
  "updatedAt": "2026-08-15T10:00:00Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Project 唯一 ID |
| `name` | string | 项目名称 |
| `description` | string/null | 项目描述 |
| `status` | string | `active`、`paused` 或 `archived` |
| `ownerId` | string | 项目所有者 ID |
| `createdAt` | datetime | 创建时间，ISO 8601 |
| `updatedAt` | datetime | 最后修改时间，ISO 8601 |

## 3. Project 接口

### 3.1 获取 Project 列表

```http
GET /api/v1/projects
```

#### Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码，默认 `1` |
| `limit` | integer | 否 | 每页数量，默认 `20`，最大 `100` |
| `status` | string | 否 | `active`、`paused` 或 `archived` |
| `q` | string | 否 | 按项目名称搜索 |
| `ownerId` | string | 否 | 按负责人筛选 |

#### 成功响应

状态码：`200 OK`

```json
{
  "data": [
    {
      "id": "p_1001",
      "name": "Website Redesign",
      "description": "Redesign the company website",
      "status": "active",
      "ownerId": "u_1001",
      "createdAt": "2026-08-15T10:00:00Z",
      "updatedAt": "2026-08-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 错误情况

- `400 Bad Request`：分页或筛选参数格式错误。
- `401 Unauthorized`：用户未登录或 Token 无效。

### 3.2 创建 Project

```http
POST /api/v1/projects
```

#### 请求体

```json
{
  "name": "Website Redesign",
  "description": "Redesign the company website"
}
```

#### 请求字段

| 字段 | 类型 | 必填 | 约束 |
| --- | --- | --- | --- |
| `name` | string | 是 | 1 到 100 个字符 |
| `description` | string | 否 | 最多 2000 个字符 |

`status`、`ownerId`、`createdAt`、`updatedAt` 由服务端生成或管理。

Project 名称在同一工作区内必须唯一。比较名称时去除首尾空格并忽略大小写，
已归档 Project 的名称也参与唯一性检查。

#### 成功响应

状态码：`201 Created`

```json
{
  "data": {
    "id": "p_1001",
    "name": "Website Redesign",
    "description": "Redesign the company website",
    "status": "active",
    "ownerId": "u_1001",
    "createdAt": "2026-08-15T10:00:00Z",
    "updatedAt": "2026-08-15T10:00:00Z"
  }
}
```

#### 错误情况

- `400 Bad Request`：请求体不是合法 JSON。
- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有创建 Project 的权限。
- `422 Unprocessable Content`：`name` 为空、超长或字段格式错误。
- `409 Conflict`：Project 名称已经存在。

```json
{
  "error": {
    "code": "PROJECT_NAME_EXISTS",
    "message": "A project with this name already exists"
  }
}
```

### 3.3 获取单个 Project

```http
GET /api/v1/projects/{projectId}
```

#### 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `projectId` | string | Project ID |

#### 成功响应

状态码：`200 OK`

```json
{
  "data": {
    "id": "p_1001",
    "name": "Website Redesign",
    "description": "Redesign the company website",
    "status": "active",
    "ownerId": "u_1001",
    "createdAt": "2026-08-15T10:00:00Z",
    "updatedAt": "2026-08-15T10:00:00Z"
  }
}
```

#### 错误情况

- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有查看该 Project 的权限。
- `404 Not Found`：Project 不存在。

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found"
  }
}
```

### 3.4 修改 Project

```http
PATCH /api/v1/projects/{projectId}
```

`PATCH` 表示部分更新，客户端只需要提交要修改的字段。

#### 请求体

```json
{
  "name": "New Website Redesign",
  "description": "Updated project description"
}
```

也可以只修改一个字段：

```json
{
  "status": "archived"
}
```

#### 可修改字段

```text
name
description
status
```

#### 成功响应

状态码：`200 OK`

```json
{
  "data": {
    "id": "p_1001",
    "name": "New Website Redesign",
    "description": "Updated project description",
    "status": "active",
    "ownerId": "u_1001",
    "createdAt": "2026-08-15T10:00:00Z",
    "updatedAt": "2026-08-15T11:00:00Z"
  }
}
```

#### 错误情况

- `400 Bad Request`：提交了不支持的字段，或请求格式错误。
- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有修改权限。
- `404 Not Found`：Project 不存在。
- `422 Unprocessable Content`：字段值不合法。
- `409 Conflict`：当前业务状态不允许修改。

### 3.5 删除 Project

```http
DELETE /api/v1/projects/{projectId}
```

第一版约定：只有已归档且没有任何 Task 的 Project 才能被永久删除。
包含 Task 的 Project 不允许级联删除。

#### 成功响应

状态码：`204 No Content`

响应体为空。

#### 错误情况

- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有删除权限。
- `404 Not Found`：Project 不存在。
- `409 Conflict`：Project 未归档，或 Project 下仍然存在 Task。

```json
{
  "error": {
    "code": "PROJECT_MUST_BE_ARCHIVED",
    "message": "A project must be archived before deletion"
  }
}
```

如果 Project 已归档但仍然包含 Task，返回：

```json
{
  "error": {
    "code": "PROJECT_HAS_TASKS",
    "message": "Cannot delete a project that contains tasks"
  }
}
```

## 4. Task 数据结构

```json
{
  "id": "t_2001",
  "projectId": "p_1001",
  "title": "Design homepage",
  "description": "Create the homepage design",
  "status": "todo",
  "priority": "high",
  "assigneeId": "u_1002",
  "dueDate": "2026-08-30",
  "createdAt": "2026-08-15T10:30:00Z",
  "updatedAt": "2026-08-15T10:30:00Z"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | Task 唯一 ID |
| `projectId` | string | 所属 Project ID |
| `title` | string | 任务标题 |
| `description` | string/null | 任务描述 |
| `status` | string | `todo`、`doing` 或 `done` |
| `priority` | string | `low`、`medium`、`high` 或 `urgent` |
| `assigneeId` | string/null | 被分配的用户 ID |
| `dueDate` | date/null | 截止日期，格式为 `YYYY-MM-DD` |
| `createdAt` | datetime | 创建时间，ISO 8601 |
| `updatedAt` | datetime | 最后修改时间，ISO 8601 |

## 5. Task 接口

### 5.1 获取某个 Project 下的 Task 列表

```http
GET /api/v1/projects/{projectId}/tasks
```

#### Query 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码，默认 `1` |
| `limit` | integer | 否 | 每页数量，默认 `20`，最大 `100` |
| `status` | string | 否 | `todo`、`doing` 或 `done` |
| `priority` | string | 否 | `low`、`medium`、`high` 或 `urgent` |
| `assigneeId` | string | 否 | 按负责人筛选 |
| `q` | string | 否 | 按任务标题搜索 |

#### 成功响应

状态码：`200 OK`

```json
{
  "data": [
    {
      "id": "t_2001",
      "projectId": "p_1001",
      "title": "Design homepage",
      "description": "Create the homepage design",
      "status": "todo",
      "priority": "high",
      "assigneeId": "u_1002",
      "dueDate": "2026-08-30",
      "createdAt": "2026-08-15T10:30:00Z",
      "updatedAt": "2026-08-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 错误情况

- `400 Bad Request`：Query 参数不合法。
- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有查看该 Project 的权限。
- `404 Not Found`：Project 不存在。

### 5.2 创建 Task

```http
POST /api/v1/projects/{projectId}/tasks
```

#### 请求体

```json
{
  "title": "Design homepage",
  "description": "Create the homepage design",
  "priority": "high",
  "assigneeId": "u_1002",
  "dueDate": "2026-08-30"
}
```

#### 请求字段

| 字段 | 类型 | 必填 | 约束 |
| --- | --- | --- | --- |
| `title` | string | 是 | 1 到 200 个字符 |
| `description` | string | 否 | 最多 5000 个字符 |
| `priority` | string | 否 | 默认 `medium` |
| `assigneeId` | string | 否 | 必须是有效用户 |
| `dueDate` | date | 否 | 格式为 `YYYY-MM-DD` |

以下字段由服务端生成或管理：

```text
id
projectId
status
createdAt
updatedAt
```

新建 Task 的默认状态为 `todo`。

创建 Task 时必须携带：

```http
Idempotency-Key: <unique-key>
```

同一个 `Idempotency-Key` 重试相同请求时，服务端必须返回第一次创建的
同一个 Task，不能重复创建。相同 Key 如果对应不同请求体，返回
`409 Conflict`。

#### 成功响应

状态码：`201 Created`

```json
{
  "data": {
    "id": "t_2001",
    "projectId": "p_1001",
    "title": "Design homepage",
    "description": "Create the homepage design",
    "status": "todo",
    "priority": "high",
    "assigneeId": "u_1002",
    "dueDate": "2026-08-30",
    "createdAt": "2026-08-15T10:30:00Z",
    "updatedAt": "2026-08-15T10:30:00Z"
  }
}
```

#### 错误情况

- `400 Bad Request`：请求体不是合法 JSON。
- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有创建 Task 的权限。
- `404 Not Found`：Project 不存在，或 `assigneeId` 对应的用户不存在。
- `409 Conflict`：Project 已暂停或已归档，不允许创建新 Task。
- `422 Unprocessable Content`：标题为空、优先级非法或日期格式错误。

### 5.3 获取单个 Task

```http
GET /api/v1/tasks/{taskId}
```

#### 成功响应

状态码：`200 OK`

```json
{
  "data": {
    "id": "t_2001",
    "projectId": "p_1001",
    "title": "Design homepage",
    "description": "Create the homepage design",
    "status": "todo",
    "priority": "high",
    "assigneeId": "u_1002",
    "dueDate": "2026-08-30",
    "createdAt": "2026-08-15T10:30:00Z",
    "updatedAt": "2026-08-15T10:30:00Z"
  }
}
```

#### 错误情况

- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有查看该 Task 的权限。
- `404 Not Found`：Task 不存在。

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found"
  }
}
```

### 5.4 修改 Task

```http
PATCH /api/v1/tasks/{taskId}
```

`PATCH` 表示部分更新，客户端只需要提交要修改的字段。

#### 请求体

```json
{
  "title": "Design responsive homepage",
  "status": "doing",
  "priority": "urgent",
  "assigneeId": "u_1003",
  "dueDate": "2026-09-01"
}
```

#### 可修改字段

```text
title
description
status
priority
assigneeId
dueDate
```

第一版暂不允许通过普通 `PATCH` 修改 `projectId`。如果以后需要移动 Task，建议设计独立接口：

```http
POST /api/v1/tasks/{taskId}/move
```

#### 成功响应

状态码：`200 OK`

```json
{
  "data": {
    "id": "t_2001",
    "projectId": "p_1001",
    "title": "Design responsive homepage",
    "description": "Create the homepage design",
    "status": "doing",
    "priority": "urgent",
    "assigneeId": "u_1003",
    "dueDate": "2026-09-01",
    "createdAt": "2026-08-15T10:30:00Z",
    "updatedAt": "2026-08-15T11:00:00Z"
  }
}
```

#### 错误情况

- `400 Bad Request`：提交了不支持修改的字段，或 JSON 格式错误。
- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有修改该 Task 的权限。
- `404 Not Found`：Task 不存在，或 `assigneeId` 对应的用户不存在。
- `409 Conflict`：Project 已暂停或已归档，或者状态变更不符合业务规则。
- `422 Unprocessable Content`：字段值校验失败。

示例：

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "The task status transition is not allowed"
  }
}
```

### 5.5 删除 Task

```http
DELETE /api/v1/tasks/{taskId}
```

#### 成功响应

状态码：`204 No Content`

响应体为空。

#### 错误情况

- `401 Unauthorized`：用户未登录或 Token 无效。
- `403 Forbidden`：用户没有删除该 Task 的权限。
- `404 Not Found`：Task 不存在。
- `409 Conflict`：Task 所属 Project 已归档，或当前业务状态不允许删除。

## 6. Project 与 Task 的关系

Project 和 Task 是一对多关系：

```text
一个 Project 可以包含多个 Task
一个 Task 必须属于一个 Project
```

创建和查询 Project 下的 Task 使用嵌套路由：

```http
GET  /api/v1/projects/{projectId}/tasks
POST /api/v1/projects/{projectId}/tasks
```

查询、修改和删除单个 Task 使用顶层资源路由：

```http
GET    /api/v1/tasks/{taskId}
PATCH  /api/v1/tasks/{taskId}
DELETE /api/v1/tasks/{taskId}
```

Project 状态定义：

```text
active：正常工作，可以创建、修改和删除 Task。
paused：暂时暂停，不允许创建 Task，但可以修改已有 Task。
archived：历史项目，只允许查看 Project 和 Task。
```

Project 状态流转：

```text
active  -> paused
active  -> archived
paused  -> active
paused  -> archived
archived -> active
```

归档 Project 使用：

```http
PATCH /api/v1/projects/{projectId}
```

请求体：

```json
{
  "status": "archived"
}
```

归档后的 Project 不允许创建、修改或删除 Task，但允许查询。
归档 Project 只能恢复为 `active`，不能直接恢复为 `paused`。

Task 状态定义：

```text
todo：尚未开始。
doing：正在进行。
done：已完成。
```

第一版允许 Task 在三种状态之间重新切换：

```text
todo  -> doing
todo  -> done
doing -> todo
doing -> done
done  -> todo
done  -> doing
```

## 7. 权限约定

第一版只定义 Project Owner、Task Assignee 和普通成员三个角色。

| 操作 | Project Owner | Task Assignee | 普通成员 |
| --- | --- | --- | --- |
| 查看 Project | 是 | 是 | 是 |
| 创建 Project | 是 | 是 | 是 |
| 修改 Project | 是 | 否 | 否 |
| 暂停、归档、恢复 Project | 是 | 否 | 否 |
| 删除 Project | 是 | 否 | 否 |
| 查看 Task | 是 | 是 | 是 |
| 创建 Task | 是 | 是 | active Project |
| 修改自己的 Task | 是 | 是 | 否 |
| 修改其他人的 Task | 是 | 否 | 否 |
| 修改 Task 优先级或负责人 | 是 | 否 | 否 |
| 删除 Task | 是 | 否 | 否 |

Task Assignee 可以修改自己负责的 Task 的标题、描述、状态和截止日期，
但不能修改 Project、优先级或负责人。

普通成员可以在 `active` Project 中创建 Task，但不能修改或删除已有 Task。

## 8. 幂等性约定

以下创建接口必须携带 `Idempotency-Key` 请求头：

```text
POST /api/v1/projects
POST /api/v1/projects/{projectId}/tasks
```

第一次请求成功返回 `201 Created`。使用相同 Key 重试相同请求时，
返回第一次创建的同一个资源，不重复创建。

缺少请求头时返回：

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REQUIRED",
    "message": "Idempotency-Key header is required"
  }
}
```

同一个 Key 被用于不同请求体时返回：

```http
409 Conflict
```

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REUSED",
    "message": "The idempotency key was already used with a different request"
  }
}
```

## 9. HTTP 状态码约定

| 状态码 | 使用场景 |
| --- | --- |
| `200 OK` | 查询成功、修改成功 |
| `201 Created` | 创建 Project 或 Task 成功 |
| `204 No Content` | 删除成功，无响应体 |
| `400 Bad Request` | 请求格式或 Query 参数错误 |
| `401 Unauthorized` | 用户未登录或 Token 无效 |
| `403 Forbidden` | 已登录，但没有操作权限 |
| `404 Not Found` | 资源不存在 |
| `409 Conflict` | 当前资源状态不允许执行操作 |
| `422 Unprocessable Content` | 字段校验失败 |
| `429 Too Many Requests` | 请求频率或配额超过限制 |
| `500 Internal Server Error` | 未预期的服务端错误 |
| `503 Service Unavailable` | 服务暂时不可用 |

### 状态码区别

```text
401：系统无法确认你是谁，需要先登录。
403：系统知道你是谁，但你没有权限。
404：目标资源不存在。
422：请求格式正确，但字段内容不合法。
409：请求内容可能合法，但和当前资源状态冲突。
```

## 10. 第一版接口清单

```text
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
PATCH  /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}

GET    /api/v1/projects/{projectId}/tasks
POST   /api/v1/projects/{projectId}/tasks
GET    /api/v1/tasks/{taskId}
PATCH  /api/v1/tasks/{taskId}
DELETE /api/v1/tasks/{taskId}
```

## 11. 待 AI Review 的设计问题

在开始写代码前，可以让 AI 审查下面这些问题：

1. Project 和 Task 的路径是否符合 REST 资源设计。
2. `GET`、`POST`、`PATCH`、`DELETE` 的使用是否正确。
3. 是否应该使用 `PUT` 替代或补充 `PATCH`。
4. Project 删除时是否应该级联删除 Task。
5. Project 归档后是否应该禁止创建 Task。
6. Task 是否需要支持移动到其他 Project。
7. `401`、`403`、`404`、`409`、`422` 的使用是否准确。
8. 列表接口的分页、筛选和搜索参数是否足够。
9. 请求和响应字段是否存在命名不一致。
10. 错误响应是否足够统一，便于前端处理。
