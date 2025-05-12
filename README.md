# AIGyy 智能对话助手

AIGyy是一个现代化的AI对话助手网页应用，基于Next.js和Hono构建，提供流畅的对话体验和用户友好的界面。

## 核心功能

- 用户认证系统（注册、登录、第三方OAuth）
- 持久化的对话历史记录
- 流式AI回复输出
- 上下文记忆支持
- AI思考过程可视化
- 响应式UI设计（移动端/桌面端）

## 技术栈

- **前端**: Next.js 14+, React, TailwindCSS, ShadcnUI
- **后端**: Hono, Vercel AI SDK, Supabase
- **数据库**: Supabase Postgres, Prisma ORM
- **开发工具**: TypeScript, ESLint, Prettier, pnpm

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- Supabase账户
- OpenAI API密钥

### 安装

1. 克隆仓库

```bash
git clone https://github.com/your-username/aigyy.git
cd aigyy
```

2. 安装依赖

```bash
pnpm install
```

3. 环境变量配置

复制`.env.example`文件到`.env.local`并填写必要的环境变量:

```bash
cp .env.example .env.local
```

4. 初始化数据库

```bash
pnpm prisma generate
pnpm prisma db push
```

5. 启动开发服务器

```bash
pnpm dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

## 项目结构

```
aiggyy/
├── app/                        # Next.js App Router
│   ├── api/                    # API路由(Hono)
│   ├── (auth)/                 # 认证页面
│   └── (dashboard)/            # 应用页面
├── components/                 # React组件
├── server/                     # 服务器端逻辑
│   ├── api/                    # Hono API定义
│   ├── middleware/             # Hono中间件
│   └── services/               # 业务逻辑服务
├── lib/                        # 工具库
├── hooks/                      # React Hooks
└── prisma/                     # Prisma配置和迁移
```

## 开发指南

详细的开发指南和架构文档请参考 [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)。

## 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

这个项目采用 MIT 许可证 - 详见 LICENSE 文件

## 联系方式

项目维护者 - your.email@example.com
