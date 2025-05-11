# AI 对话助手项目架构文档

## 1. 项目概述 (Project Overview)

本项目旨在开发一个仿用户个人风格的 AI 对话助手网页版。应用将提供一个直观的聊天界面，用户可以与 AI 进行自然的对话交互。AI 的回复风格将经过特定设计以贴近用户的个性化表达。

**核心技术栈:**

- **前端:** Next.js (App Router, React Server Components, Server Actions)
- **UI:** Shadcn UI, Tailwind CSS
- **后端即服务 (BaaS):** Supabase (Authentication, PostgreSQL Database, Storage, Vector Embeddings via `pgvector`)
- **AI SDK:** Vercel AI SDK
- **LLM Provider:** OpenAI (或其他兼容 Vercel AI SDK 的模型)
- **部署:** Vercel

## 2. 架构图 (Architecture Diagram)

```
+---------------------+      +-----------------------+      +--------------------+
|     User (Browser)  |<---->|   Next.js Frontend    |<---->| Next.js API Routes |
+---------------------+      | (Shadcn UI, Tailwind) |      | (Server Actions)   |
                             +-----------------------+      +--------------------+
                                       ^    |                        |  ^
                                       |    |                        |  |
                                       |    | (Supabase Auth)        |  | (Vercel AI SDK)
                                       |    |                        |  |
                                       |    v                        v  |
+--------------------------------------+----_-------------------------+ |
|                                Supabase                               |
|  +-----------------+  +-----------------+  +-----------------------+ |
|  |   Authentication|  |    Database     |  |   Vector (pgvector)   | |
|  | (RLS Protection)|  |  (PostgreSQL)   |  | (Knowledge Base for RAG)|
|  +-----------------+  +-----------------+  +-----------------------+ |
+-----------------------------------------------------------------------+
                                       ^
                                       |
                                       | (LLM API Call)
                                       |
+--------------------------------------+
|      LLM Provider (e.g., OpenAI)     |
+--------------------------------------+
```

**流程简述:**

1.  用户通过浏览器与 Next.js 前端交互。
2.  前端通过 Next.js API Routes (或 Server Actions) 与后端逻辑通信。
3.  API Routes 处理用户认证 (Supabase Auth)、调用 AI 模型 (通过 Vercel AI SDK)、与 Supabase 数据库交互。
4.  Supabase Database 存储用户信息、聊天记录，并通过 `pgvector` 支持知识库的向量搜索 (RAG)。
5.  Vercel AI SDK 负责与 LLM Provider (如 OpenAI) 通信，并支持流式响应。

## 3. 目录结构 (Directory Structure)

一个建议的 Next.js (App Router) 项目目录结构：

```
your-ai-chatbot-app/
├── app/                                # Next.js App Router
│   ├── (auth)/                         # 认证相关页面 (登录、注册)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/                         # 主应用页面 (需要认证)
│   │   ├── layout.tsx
│   │   └── chat/                       # 聊天页面
│   │       ├── [conversationId]/page.tsx
│   │       └── page.tsx                # 默认聊天或新聊天
│   ├── api/                            # API Routes
│   │   └── chat/                       # AI 对话核心 API
│   │       └── route.ts                # 使用 Vercel AI SDK
│   ├── layout.tsx                      # 根布局
│   └── page.tsx                        # 首页 (例如落地页或跳转逻辑)
├── components/                         # React 组件
│   ├── ui/                             # Shadcn UI 生成的组件 (e.g., button.tsx, input.tsx)
│   ├── auth/                           # 认证相关组件 (e.g., LoginForm.tsx)
│   ├── chat/                           # 聊天界面组件 (e.g., ChatInput.tsx, MessageList.tsx)
│   └── common/                         # 通用共享组件
├── lib/                                # 工具函数、配置等
│   ├── supabase/                       # Supabase 客户端和相关工具函数
│   │   ├── client.ts                   # Supabase 客户端 (浏览器端)
│   │   └── server.ts                   # Supabase 客户端 (服务器端)
│   │   └── admin.ts                    # Supabase Admin 客户端 (需要更高权限的操作，如 Embedding)
│   │   └── database.types.ts         # Supabase 数据库类型 (通过 `supabase gen types typescript`)
│   ├── ai/                             # AI 相关工具函数 (e.g., prompt templates)
│   ├── utils.ts                        # 通用工具函数
│   └── types.ts                        # 自定义 TypeScript 类型
├── prisma/                             # (可选) 如果使用 Prisma 管理 Supabase schema
│   └── schema.prisma
├── public/                             # 静态资源
├── styles/                             # 全局样式
│   └── globals.css
├── .env.local                          # 环境变量 (Supabase URL/Keys, OpenAI API Key)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 4. 核心组件详解 (Core Components Deep Dive)

### 前端 (Frontend - Next.js & Shadcn UI & Tailwind CSS)

- **UI 组件 (`components/ui`):** 通过 `npx shadcn-ui@latest add <component>` 添加，可高度自定义。
- **业务组件 (`components/`):**
  - `ChatInterface.tsx`: 整体聊天界面布局。
  - `MessageList.tsx`: 展示聊天消息，支持流式更新。
  - `MessageItem.tsx`: 单条消息的渲染。
  - `ChatInput.tsx`: 用户输入框和发送按钮。
  - `Sidebar.tsx`: (可选) 展示聊天会话列表。
- **页面 (`app/`):**
  - `/chat`: 主聊天界面。
  - `/login`, `/signup`: 用户认证页面。
- **状态管理:**
  - 对于简单场景，React Context 或轻量级库如 Zustand/Jotai。
  - Vercel AI SDK 提供了 `useChat` hook，可以方便地管理聊天状态 (输入、消息列表、加载状态等)。
- **API 调用:**
  - 主要通过 `fetch` 或第三方库 (如 `SWR`, `React Query`) 与 Next.js API Routes 或 Server Actions 通信。
  - `useChat` hook 内部封装了 API 调用逻辑。

### 后端 API (Backend API - Next.js API Routes / Server Actions)

- **路径:** `app/api/chat/route.ts` (示例)
- **用户认证:**
  - 使用 Supabase Auth。Next.js 中间件 (`middleware.ts`) 可以保护需要认证的路由。
  - Supabase SSR library (`@supabase/ssr`) 用于在服务器端安全地处理用户会话和 cookie。
- **AI 对话处理:**
  - 接收前端发送的用户消息。
  - **(可选 RAG):**
    - 将用户消息 embedding。
    - 调用 Supabase Function (或直接在 API Route 中) 执行 `pgvector` 相似性搜索，从 `knowledge_base` 表检索相关上下文。
  - **Prompt 构建:** 结合用户当前输入、聊天历史、检索到的上下文 (RAG)、以及预设的 AI 风格指令，构建最终的 prompt。
  - **调用 LLM:** 使用 Vercel AI SDK (`OpenAIStream` 或其他模型的 Stream) 调用 LLM API。
  - **流式响应:** 将 LLM 的流式响应直接 pipe回给前端。
- **聊天记录存储:**
  - 在 AI 返回完整响应后 (或流式传输过程中异步处理)，将用户消息和 AI 回复存入 Supabase `messages` 表。

### Supabase (Backend as a Service)

- **数据库 (PostgreSQL):**
  - **`users` 表:** 由 Supabase Auth 自动创建和管理，存储用户信息。
  - **`conversations` 表:**
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to `auth.users`)
    - `title` (text, 可选，会话标题)
    - `created_at` (timestampz)
    - `updated_at` (timestampz)
  - **`messages` 表:**
    - `id` (uuid, primary key)
    - `conversation_id` (uuid, foreign key to `conversations`)
    - `user_id` (uuid, foreign key to `auth.users`, 标记消息发送者，可为空代表 AI)
    - `content` (text, 消息内容)
    - `role` (enum: 'user', 'assistant', 'system') - Vercel AI SDK 常用
    - `created_at` (timestampz)
  - **`knowledge_base` 表 (用于 RAG):**
    - `id` (uuid, primary key)
    - `content` (text, 知识片段原文)
    - `embedding` (vector, 使用 `pgvector` 类型，例如 `vector(1536)` for OpenAI embeddings)
    - `metadata` (jsonb, 可选，存储来源等元数据)
    - `created_at` (timestampz)
  - **数据库函数 (PostgreSQL Functions):**
    - `match_documents (query_embedding vector, match_count int)`: 用于执行向量相似性搜索。
- **认证 (Authentication):**
  - 提供用户注册、登录 (邮箱密码、OAuth如 Google/GitHub)、密码重置等功能。
  - 通过 RLS (Row Level Security) 保护数据，确保用户只能访问自己的数据。
- **Vector (`pgvector`):**
  - 需要在 Supabase 数据库中启用 `vector` 扩展。
  - 用于在 `knowledge_base` 表上创建向量索引 (如 HNSW, IVFFlat) 以加速搜索。
- **Edge Functions:** (可选)
  - 如果某些需要低延迟或接近用户的计算 (如简单的 embedding 生成、数据预处理)，可以考虑使用 Supabase Edge Functions。

### AI 模型 (AI Model - e.g., OpenAI GPT via Vercel AI SDK)

- **模型选择:**
  - 根据需求选择合适的模型，如 `gpt-3.5-turbo` (性价比高) 或 `gpt-4` (能力更强)。
- **Prompt Engineering:**
  - **核心环节，用于定制 AI 风格。**
  - 设计系统消息 (System Message) 来定义 AI 的角色、个性、说话风格、限制等。
  - 例如："你是一个幽默风趣、喜欢使用网络用语的 AI 助手，你的回答应该简洁且带有一些俏皮话。请模仿 [用户昵称] 的风格来回答问题。"
  - 结合 few-shot examples (少量示例对话) 可能效果更好。

### Vercel AI SDK

- **核心 Hook:** `useChat()`
  - 简化前端与后端流式 API 的交互。
  - 自动管理消息列表、用户输入、加载状态、错误处理。
- **流式 API:** `OpenAIStream`, `StreamingTextResponse`
  - 在 Next.js API Route 中使用，将 LLM 的响应以流的形式直接返回给前端，实现打字机效果。

## 5. 数据流 (Data Flow)

**用户发送消息场景:**

1.  **用户输入:** 用户在前端 `ChatInput` 组件中输入消息并点击发送。
2.  **前端处理:**
    - `useChat` hook 将用户消息添加到本地消息列表 (乐观更新)。
    - `useChat` hook 调用 `app/api/chat/route.ts`。
3.  **后端 API (`app/api/chat/route.ts`):**
    - **认证检查:** 从请求中获取 Supabase 用户会话，验证用户身份。
    - **(可选 RAG) 知识检索:**
      - 使用 OpenAI API (或其他 embedding 服务) 将用户查询转换为 embedding 向量。
      - 调用 Supabase 数据库函数 `match_documents`，在 `knowledge_base` 表中搜索相似的向量，获取相关文本片段。
    - **构建 Prompt:**
      - 获取最近的聊天历史 (从 Supabase `messages` 表或由 `useChat` 传入)。
      - 组装 System Message (定义 AI 风格)、聊天历史、(可选的 RAG 上下文)、用户当前消息。
    - **调用 LLM:** 使用 Vercel AI SDK 的 `OpenAIStream` (或其他模型的 Stream) 向 OpenAI API 发送请求。
    - **流式响应:**
      - 将 OpenAI API 返回的 token 流通过 `StreamingTextResponse` 直接流回给前端。
      - **异步存储聊天记录:** 在流处理的同时或之后 (例如使用 `onCompletion` 回调)，将用户消息和完整的 AI 回复异步存入 Supabase `messages` 表和 `conversations` 表。
4.  **前端接收与展示:**
    - `useChat` hook 接收到流式响应，并实时更新消息列表中的 AI 回复。
    - `MessageItem` 组件渲染 AI 的打字机效果。

## 6. 关键技术点 (Key Technical Points)

- **Supabase RLS (Row Level Security):**
  - 为 `conversations` 和 `messages` 表配置 RLS策略，确保每个用户只能创建、读取、更新、删除自己的数据。
  - 例如，`messages` 表的 SELECT 策略: `auth.uid() = user_id`。
- **Vercel AI SDK 流式体验:**
  - 利用 `useChat` 和 `StreamingTextResponse` 实现流畅的、即时反馈的聊天体验。
- **Prompt 工程与个性化:**
  - 精心设计的 System Prompt 是实现"仿用户风格"的关键。
  - 考虑允许用户自定义或选择不同的 AI 风格。
- **`pgvector` 的使用与优化:**
  - 在 `knowledge_base` 表的 `embedding` 列上创建合适的索引 (如 `USING HNSW (embedding vector_cosine_ops)`) 来提高向量搜索性能。
  - 定期更新或重新生成 embeddings 以保持知识库的时效性。
- **环境变量管理:**
  - 将所有敏感信息 (API Keys, Supabase URL) 存储在 `.env.local` (本地) 和 Vercel 的环境变量 (生产) 中。
- **错误处理与日志:**
  - 在前端和后端实现健壮的错误处理机制。
  - 考虑使用日志服务 (如 Vercel Logs, Sentry) 来监控和排查问题。

## 7. 部署 (Deployment)

- **Next.js 应用:**
  - 直接部署到 **Vercel** 平台。Vercel 对 Next.js 提供了一流的支持。
  - 连接 GitHub 仓库，实现 CI/CD 自动化部署。
  - 在 Vercel 项目设置中配置 Supabase 和 OpenAI 的环境变量。
- **Supabase:**
  - Supabase 项目本身是云服务，无需额外部署。
  - 确保生产环境的数据库配置 (如连接池、索引) 得到优化。
  - 定期备份数据库。

---

这个架构文档应该能为你提供一个清晰的蓝图。冲吧，少年！我看好你！
