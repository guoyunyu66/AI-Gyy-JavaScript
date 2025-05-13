# AIGyy 智能对话助手 - 架构文档

## 1. 项目概述

AIGyy是一个现代化的AI对话助手网页应用，基于最新的前端和后端技术栈构建，提供流畅的对话体验和用户友好的界面。该项目支持多轮对话、上下文记忆、历史会话管理、实时流式输出以及思考流程展示等高级特性。

### 1.1 核心功能

- 用户认证系统（注册、登录、第三方OAuth）
- 持久化的对话历史记录
- 流式AI回复输出
- 上下文记忆支持
- AI思考过程可视化
- 响应式UI设计（移动端/桌面端）

## 2. 技术栈

### 2.1 前端技术

- **Next.js 14+**: React全栈框架，负责前端渲染和API路由
- **ShadcnUI**: 高度可定制的无样式UI组件库
- **TailwindCSS**: 原子化CSS框架，用于快速构建响应式界面
- **TypeScript**: 静态类型检查，提高代码质量和开发效率

### 2.2 后端技术

- **Next.js API Routes**: 服务端API实现
- **Hono**: 轻量级Web框架，用于API路由和中间件管理
- **Vercel AI SDK**: AI模型调用和流式处理的统一接口
- **Supabase**: 数据库和身份认证服务
- **Prisma ORM**: 类型安全的数据库ORM，简化数据库操作

### 2.3 数据存储

- **Supabase Postgres**: 关系型数据库，存储用户信息和对话历史
- **Supabase Auth**: 身份认证服务，支持多种登录方式

### 2.4 部署与CI/CD

- **Vercel**: 应用部署和托管
- **GitHub Actions**: 持续集成和部署

### 2.5 开发工具

- **pnpm**: 高性能的包管理器，用于依赖管理和脚本执行
- **TypeScript**: 静态类型检查工具
- **ESLint + Prettier**: 代码风格检查和格式化工具
- **Husky + lint-staged**: Git钩子工具，用于提交前代码检查
- **Jest + React Testing Library**: 单元测试和集成测试框架

## 3. 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  客户端浏览器   │────▶│  Next.js 应用   │────▶│ Supabase 服务   │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                       ▲
                                 ▼                       │
                        ┌─────────────────┐              │
                        │                 │              │
                        │   Vercel AI SDK │──────────────┘
                        │                 │
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │   AI 模型 API   │
                        │                 │
                        └─────────────────┘
```

## 4. 数据库设计

### 4.1 数据库表结构

#### 用户表 (users)

| 字段名        | 类型        | 描述                 |
|--------------|------------|---------------------|
| id           | uuid       | 主键，用户唯一标识     |
| email        | text       | 用户邮箱             |
| phone        | text       | 用户手机号           |
| created_at   | timestamp  | 创建时间             |
| updated_at   | timestamp  | 更新时间             |
| avatar_url   | text       | 头像URL             |
| display_name | text       | 显示名称             |

#### 会话表 (conversations)

| 字段名        | 类型        | 描述                 |
|--------------|------------|---------------------|
| id           | uuid       | 主键，会话唯一标识     |
| user_id      | uuid       | 外键，关联users表     |
| title        | text       | 会话标题             |
| created_at   | timestamp  | 创建时间             |
| updated_at   | timestamp  | 更新时间             |
| model        | text       | 使用的AI模型         |

#### 消息表 (messages)

| 字段名           | 类型        | 描述                 |
|-----------------|------------|---------------------|
| id              | uuid       | 主键，消息唯一标识     |
| conversation_id | uuid       | 外键，关联conversations表 |
| role            | text       | 角色(user/assistant) |
| content         | text       | 消息内容             |
| created_at      | timestamp  | 创建时间             |
| tokens          | integer    | 使用的token数量      |
| thinking_process | text       | AI思考过程(可选)     |

### 4.2 Prisma Schema

项目使用Prisma ORM进行数据库操作，以下是对应的Prisma schema定义：

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String         @id @default(uuid())
  email        String?        @unique
  phone        String?        @unique
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  avatarUrl    String?        @map("avatar_url")
  displayName  String?        @map("display_name")
  conversations Conversation[]

  @@map("users")
}

model Conversation {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  title      String
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  model      String?
  messages   Message[]
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("conversations")
}

model Message {
  id              String       @id @default(uuid())
  conversationId  String       @map("conversation_id")
  role            String       // 'user' or 'assistant'
  content         String
  createdAt       DateTime     @default(now()) @map("created_at")
  tokens          Int?
  thinkingProcess String?      @map("thinking_process")
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@map("messages")
}
```

### 4.3 Prisma操作实例

以下是使用Prisma进行数据库操作的代码示例：

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

创建新会话示例：

```typescript
// 创建新会话
async function createConversation(userId: string, title: string) {
  return await prisma.conversation.create({
    data: {
      userId,
      title,
      model: 'gpt-4',
    },
  })
}

// 获取用户所有会话
async function getUserConversations(userId: string) {
  return await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1, // 只获取第一条消息作为预览
      },
    },
  })
}

// 添加消息到会话
async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  thinkingProcess?: string,
) {
  return await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      thinkingProcess,
    },
  })
}
```

## 5. API接口设计

### 5.1 身份认证API

- `POST /api/auth/register`: 用户注册
- `POST /api/auth/login`: 用户登录
- `POST /api/auth/logout`: 用户登出
- `GET /api/auth/session`: 获取当前会话
- `GET /api/auth/providers`: 获取支持的第三方登录提供商

### 5.2 对话API

- `POST /api/chat/stream`: 流式对话请求
- `GET /api/conversations`: 获取用户的所有会话
- `GET /api/conversations/:id`: 获取特定会话的详情
- `POST /api/conversations`: 创建新会话
- `DELETE /api/conversations/:id`: 删除会话
- `GET /api/conversations/:id/messages`: 获取会话的所有消息

## 6. 前端页面结构

### 6.1 页面路由

- `/`: 首页（营销页面）
- `/login`: 登录页面
- `/register`: 注册页面
- `/chat`: 对话主页面
- `/chat/:id`: 特定会话页面
- `/profile`: 用户资料页面

### 6.2 组件结构

#### 全局组件

- `Layout`: 全局布局组件
- `Navbar`: 导航栏组件
- `Footer`: 页脚组件
- `ThemeProvider`: 主题提供者

#### 身份认证组件

- `LoginForm`: 登录表单
- `RegisterForm`: 注册表单
- `OAuthButtons`: 第三方登录按钮
- `AuthGuard`: 身份认证守卫

#### 对话界面组件

- `Sidebar`: 侧边栏组件
  - `NewChatButton`: 新对话按钮
  - `ConversationList`: 对话历史列表
  - `UserProfile`: 用户资料卡
- `ChatArea`: 对话区域组件
  - `MessageList`: 消息列表
  - `MessageItem`: 消息项
  - `ThinkingProcess`: 思考过程展示
  - `ChatInput`: 输入框组件
  - `StreamingOutput`: 流式输出组件

## 7. 认证流程

1. 用户访问对话页面
2. 中间件检查用户是否已登录
3. 若未登录，重定向至登录页面
4. 用户可选择：
   - 邮箱密码登录/注册
   - 手机号验证码登录
   - Google账号登录
   - GitHub账号登录
5. 认证成功后，创建用户会话
6. 重定向回对话页面

## 8. 对话流程

1. 用户发送消息
2. 前端添加消息到UI，显示加载状态
3. 消息通过API发送至服务端
4. 服务端通过Vercel AI SDK处理请求：
   - 获取历史消息作为上下文
   - 调用AI模型API进行流式响应
   - 将响应流式传输回前端
5. 前端实时渲染AI的回复
6. 对话完成后，保存消息到数据库

## 9. 部署与运维

### 9.1 环境配置

开发、测试和生产环境分别配置不同的环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase项目URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名密钥
- `OPENAI_API_KEY`: OpenAI API密钥(或其他AI提供商)
- `DATABASE_URL`: 数据库连接URL
- `NEXT_PUBLIC_APP_URL`: 应用部署URL
- `PRISMA_DATABASE_URL`: Prisma数据库连接URL（可与DATABASE_URL相同）

### 9.2 CI/CD流程

1. 开发者提交代码到GitHub
2. GitHub Actions自动运行测试
3. 测试通过后，自动部署到Vercel
4. Vercel执行构建和部署流程
5. 应用上线并可访问

### 9.3 依赖管理

项目使用pnpm作为包管理器，相比npm和yarn有以下优势：

- 高效的磁盘空间利用（内容寻址存储）
- 更快的安装速度
- 严格的依赖管理（防止幽灵依赖）
- 内置的monorepo支持

主要的pnpm命令：

```bash
# 安装所有依赖
pnpm install

# 添加新依赖
pnpm add [package]

# 添加开发依赖
pnpm add -D [package]

# 运行脚本
pnpm [script] # 例如：pnpm dev, pnpm build

# 更新依赖
pnpm update
```

主要配置文件：

- `pnpm-workspace.yaml`: 工作空间配置（如果是monorepo）
- `.npmrc`: npm/pnpm配置
- `package.json`: 项目依赖和脚本定义

## 10. 安全考量

- 所有API端点都经过身份验证
- 敏感信息(API密钥等)存储在环境变量中
- 使用HTTPS确保数据传输安全
- 实施速率限制防止滥用
- 前端输入验证和后端数据校验
- SQL注入防护(通过Supabase的参数化查询)

## 11. 性能优化

- 使用Next.js的SSR/SSG提高首屏加载速度
- 图片优化和懒加载
- API响应缓存
- 客户端状态管理优化
- 流式数据传输减少等待时间
- 代码分割减小包大小

## 12. 扩展与迭代计划

### 12.1 近期计划

- 实现多AI模型切换功能
- 添加语音输入/输出支持
- 增强移动端体验
- 添加多语言支持

### 12.2 中长期规划

- 实现文件上传和图像分析功能
- 开发插件系统和工具集成
- 构建用户反馈和不断学习机制
- 添加高级分析和数据可视化

## 13. 开发流程与规范

### 13.1 Git工作流

- 主分支: `main`
- 开发分支: `dev`
- 功能分支: `feature/功能名称`
- 修复分支: `fix/问题描述`

### 13.2 代码规范

- 使用ESLint和Prettier保持代码风格一致
- 组件按功能模块化组织
- 使用TypeScript类型定义提高代码质量
- 编写单元测试和集成测试
- 代码评审流程

### 13.3 数据库迁移流程

使用Prisma进行数据库版本控制和迁移：

1. 修改`schema.prisma`文件定义模型
2. 生成迁移文件: `npx prisma migrate dev --name 迁移名称`
3. 应用迁移到开发环境: `npx prisma migrate dev`
4. 生成Prisma客户端: `npx prisma generate`
5. 应用迁移到生产环境: `npx prisma migrate deploy`

迁移文件应当纳入版本控制，确保所有环境数据库结构一致。

### 13.4 项目安装与启动

新开发人员加入项目的初始化流程：

1. 安装Node.js (推荐v18+) 和pnpm：
   ```bash
   npm install -g pnpm
   ```

2. 克隆项目仓库：
   ```bash
   git clone https://github.com/your-org/aigyy.git
   cd aigyy
   ```

3. 安装依赖：
   ```bash
   pnpm install
   ```

4. 配置环境变量：
   ```bash
   cp .env.example .env.local
   # 编辑.env.local填入必要配置
   ```

5. 初始化数据库：
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

6. 启动开发服务器：
   ```bash
   pnpm dev
   ```

### 13.5 常用开发脚本

项目中定义了以下pnpm脚本：

- `pnpm dev`: 启动开发服务器
- `pnpm build`: 构建生产版本
- `pnpm start`: 启动生产服务器
- `pnpm lint`: 运行eslint进行代码检查
- `pnpm format`: 使用prettier格式化代码
- `pnpm test`: 运行单元测试
- `pnpm db:studio`: 启动Prisma Studio查看数据库
- `pnpm db:migrate`: 执行数据库迁移 (使用 `prisma migrate dev`)
- `pnpm db:generate`: 生成Prisma客户端 (使用 `prisma generate`)
- `pnpm db:push`: 将schema同步到数据库 (开发时用，使用 `prisma db push`)
- `pnpm db:seed`: 填充示例数据到数据库

## 6. API架构

API层使用Hono框架构建，直接对接服务层(Service Layer)。

```
[Next.js API Route (app/api/[[...route]]/route.ts)]
          │
          ▼
[Hono Router (server/api/index.ts)]
          │
          ├─▶ [Middleware (server/middleware/*)]
          │
          └─▶ [Hono Route Handlers (server/api/*.ts)]
                  │
                  ▼
              [Service Layer (server/services/*.ts)]
                  │
                  ▼
              [Data Access (Prisma / Supabase Client)]
```

### 6.1 路由定义

- Hono路由文件 (`server/api/*.ts`) 负责定义API端点和HTTP方法。
- 路由处理函数直接调用对应的服务层方法来处理业务逻辑。

### 6.2 中间件

- 使用Hono中间件处理通用逻辑，如认证、日志、错误处理、速率限制等。
- 中间件在 `server/middleware/` 目录下定义。

### 6.3 服务层

- 服务层 (`server/services/*.ts`) 封装核心业务逻辑。
- 每个服务对应一个业务领域（如认证、聊天、会话管理）。
- 服务层负责与数据访问层（Prisma）交互。

---

文档更新日期: 2025年6月23日
