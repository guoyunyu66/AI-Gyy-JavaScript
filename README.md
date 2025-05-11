# AIggy - 仿用户个人风格的 AI 对话助手

[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js&logoColor=white)](https://nextjs.org) [![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com) [![Supabase](https://img.shields.io/badge/Supabase-brightgreen?logo=supabase&logoColor=white)](https://supabase.com) [![Prisma](https://img.shields.io/badge/Prisma-6.x-1B222D?logo=prisma&logoColor=white)](https://www.prisma.io/) [![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-gray?logo=vercel&logoColor=white)](https://sdk.vercel.ai) [![OpenAI](https://img.shields.io/badge/OpenAI-42B5A0?logo=openai&logoColor=white)](https://openai.com)

本项目 (`aigyy`) 旨在开发一个能够模仿用户个人风格的 AI 对话助手网页应用。用户可以通过直观的聊天界面与 AI 进行自然交互，AI 的回复将经过精心设计，以贴近用户的个性化表达。

详细的项目架构设计，请参见 [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)。

## 🚀 快速开始 (Getting Started)

首先，确保你已经安装了 Node.js (推荐版本 >= 18.x) 和 pnpm。

1.  **克隆仓库 (Clone the repository):**
    ```bash
    git clone <your-repository-url>
    cd aigyy
    ```

2.  **安装依赖 (Install dependencies):**
    ```bash
    pnpm install
    ```

3.  **配置环境变量 (Set up environment variables):**
    复制 `.env.example` (如果项目中有提供) 为 `.env.local`，并根据你的 Supabase 和 OpenAI 配置填写必要的环境变量。至少需要以下变量：
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    # SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # 如果后端操作需要

    # OpenAI
    OPENAI_API_KEY=your_openai_api_key

    # 其他自定义环境变量...
    ```
    请参考 [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) 中关于环境变量管理的部分获取更详细的信息。

4.  **数据库迁移与生成 (Database migration and generation):**
    本项目使用 Prisma 与 Supabase (PostgreSQL) 交互。
    ```bash
    # (可选) 如果 schema 有变更，应用到数据库
    pnpm run db:push

    # 生成 Prisma Client
    pnpm run db:generate
    ```
    你也可以使用 `pnpm run prisma:studio` 来打开 Prisma Studio 查看和管理数据库。

5.  **运行开发服务器 (Run the development server):**
    ```bash
    pnpm run dev
    ```

    然后在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

    你可以通过修改 `src/app/page.tsx` (或其他相关页面和组件) 来开始编辑页面。文件修改后，页面会自动更新。

## 🛠️ 可用脚本 (Available Scripts)

在 `package.json` 中，你可以找到以下常用脚本：

-   `pnpm run dev`: 以 Turbopack 模式启动 Next.js 开发服务器。
-   `pnpm run build`: 构建生产版本的应用。
-   `pnpm run start`: 启动生产服务器 (需要先执行 `build`)。
-   `pnpm run lint`: 使用 Next.js 内置的 ESLint 配置检查代码。
-   `pnpm run lint:fix`: 自动修复 ESLint 发现的问题。
-   `pnpm run format`: 使用 Prisma Formatter 和 Prettier 格式化代码。
-   `pnpm run db:generate`: 生成 Prisma Client。
-   `pnpm run prisma:studio`: 启动 Prisma Studio。
-   `pnpm run prisma:validate`: 验证 Prisma schema。
-   `pnpm run db:push`: 将 Prisma schema 的状态同步到数据库 (不适用于生产环境的迁移)。
-   `pnpm run db:seed`: (如果配置了) 运行数据库填充脚本。

## ✨ 技术栈 (Tech Stack)

-   **框架 (Framework):** [Next.js](https://nextjs.org/) (App Router, React Server Components, Server Actions)
-   **UI:** [Shadcn UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **后端即服务 (BaaS):** [Supabase](https://supabase.com/) (Authentication, PostgreSQL Database, Storage, Vector Embeddings via `pgvector`)
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **AI SDK:** [Vercel AI SDK](https://sdk.vercel.ai/)
-   **LLM Provider:** [OpenAI](https://openai.com/) (或其他兼容 Vercel AI SDK 的模型)
-   **部署 (Deployment):** [Vercel](https://vercel.com/)

## 📖 了解更多 (Learn More)

要了解有关 Next.js 的更多信息，请查看以下资源：

-   [Next.js Documentation](https://nextjs.org/docs) - 了解 Next.js 的功能和 API。
-   [Learn Next.js](https://nextjs.org/learn) - 一个交互式的 Next.js 教程。
-   [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs) - 学习如何使用 Vercel AI SDK 构建 AI 应用。
-   [Supabase Documentation](https://supabase.com/docs) - 学习如何使用 Supabase。
-   [Prisma Documentation](https://www.prisma.io/docs) - 学习如何使用 Prisma。

欢迎查看 [Next.js GitHub repository](https://github.com/vercel/next.js) - 欢迎你的反馈和贡献！

## ☁️ 部署到 Vercel (Deploy on Vercel)

部署 Next.js 应用最简单的方法是使用 [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)，它由 Next.js 的创建者提供。

有关更多详细信息，请参阅我们的 [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)。

确保在 Vercel 项目设置中配置了所有必要的环境变量。

---

祝你编码愉快！🎉
