# AIGyy - Supabase Auth 集成流程

本文档描述了 AIGyy 项目中 Supabase Auth 的集成方式和认证流程。

## 核心思路

1.  **客户端 (React/Next.js)**: 使用 `@supabase/supabase-js` 处理认证操作和会话管理，`@supabase/auth-ui-react` 提供 UI 组件。通过 React Context (`AuthContext`) 全局管理认证状态。
2.  **服务端 (Hono API)**: 通过 Hono 中间件 (`authMiddleware`) 验证客户端请求头中的 Supabase JWT，以保护需要认证的 API 路由。

## 认证流程详解

### 客户端流程

1.  **用户交互**: 用户在登录页面 (`/login`) 或注册页面 (`/register`) 通过 Supabase提供的 `<Auth>` UI 组件输入凭据（邮箱/密码、手机/密码）或选择 OAuth 提供商（如 Google, GitHub）。

2.  **认证请求**: `@supabase/auth-ui-react` 内部调用 `@supabase/supabase-js` 的相应方法 (`signInWithPassword`, `signUp`, `signInWithOAuth`) 向 Supabase Auth 服务器发起认证请求。

3.  **认证成功与 Session 获取**:
    *   **密码登录/注册**: Supabase Auth 服务器验证凭据成功后，返回包含用户信息的 `Session` 对象给客户端 SDK。
    *   **OAuth 登录**: 用户在第三方平台授权后，会被重定向到我们在 Supabase 配置的 `redirectTo` URL (通常是 `/auth/callback`)，并携带一个授权码 (code)。 `/auth/callback` 路由 (需要创建) 负责使用此 code 调用 `supabase.auth.exchangeCodeForSession()` 来换取 `Session`。

4.  **Session 存储**: `@supabase/supabase-js` SDK 自动将获取到的 `Session` (包含 JWT 访问令牌和刷新令牌) 安全地存储在浏览器的 LocalStorage 中。

5.  **全局状态更新**: `src/contexts/auth-context.tsx` 中的 `useEffect` 钩子通过 `supabase.auth.onAuthStateChange` 监听到认证状态变化。
    *   `AuthProvider` 更新其内部状态 (`session`, `user`, `loading`)。

6.  **UI 重渲染与路由**: 
    *   所有使用 `useAuth()` hook 的组件会因为 `AuthContext` 的更新而重新渲染。
    *   受保护的布局 (`src/app/(dashboard)/layout.tsx`) 检测到 `session` 存在且 `loading` 为 false，不再重定向到 `/login`，允许用户访问仪表盘页面。
    *   **待优化**: 登录/注册页面应添加逻辑，检测到 `session` 存在时自动使用 `router.push('/chat')` 跳转。
    *   `/auth/callback` 路由在成功交换 Session 后，也应将用户重定向到 `/chat`。

### 服务端流程 (API 请求)

1.  **客户端准备请求**: 当客户端需要访问受保护的 API (如 `/api/chat/stream`) 时：
    *   通过 `supabase.auth.getSession()` 获取当前有效的 `Session`。
    *   提取 `session.access_token` (JWT)。
    *   将此 token 添加到请求的 `Authorization` 头部，格式为 `Bearer <token>`。

2.  **API 接收请求**: Hono 服务器接收到请求。

3.  **认证中间件验证**: `src/server/middleware/auth.ts` 中的 `authMiddleware` 介入：
    *   从 `Authorization` 头部提取 token。
    *   从环境变量读取 `SUPABASE_JWT_SECRET`。
    *   使用 `@tsndr/cloudflare-worker-jwt` 的 `verify` 方法验证 token 的签名和有效期。
    *   如果验证失败，返回 401 未授权错误。
    *   如果验证成功，解码 token (无需再次验证签名)，从中提取用户 ID (通常是 `sub` 字段)。
    *   将 `userId` 通过 `c.set('userId', userId)` 存入 Hono 请求上下文。

4.  **路由处理**: 请求传递到具体的 API 路由处理函数 (如 `src/server/api/chat.ts`):
    *   处理函数通过 `c.get('userId')` 获取当前认证用户的 ID。
    *   调用相应的服务层方法 (`ChatService`, `ConversationService` 等)，并将 `userId` 传递下去。

5.  **服务层与数据访问**: 服务层使用 `userId` 进行数据库操作（查询用户相关的会话、消息等），确保数据隔离。

## 关键文件

*   `src/lib/supabase/client.ts`: Supabase 客户端实例。
*   `src/contexts/auth-context.tsx`: 全局认证状态管理。
*   `src/app/(auth)/login/page.tsx`: 登录页面 UI。
*   `src/app/(auth)/register/page.tsx`: 注册页面 UI。
*   `src/app/(dashboard)/layout.tsx`: 受保护路由的布局和重定向逻辑。
*   `src/server/middleware/auth.ts`: 服务端 JWT 验证中间件。
*   `src/server/api/*.ts`: Hono API 路由定义。
*   `.env.local` / `.env`: 存储 Supabase URL, Anon Key, JWT Secret。

## 后续必要步骤

1.  **创建 `/auth/callback` 路由**: 处理 OAuth 登录成功后的回调，交换 code 获取 session 并重定向。
2.  **实现 `Profile` 表自动同步**: 用户注册时自动在 `profiles` 表创建记录，关联 `auth.users.id` (可通过 Supabase 数据库触发器或后端逻辑实现)。
3.  **实现登录/注册后自动跳转**: 优化用户体验。
4.  **实现登出功能**: 提供按钮调用 `supabase.auth.signOut()` 并处理状态更新和重定向。 