// src/server/api/v1/auth/schema.ts
import { z } from 'zod' // 假设使用 zod 进行校验
import { zValidator } from '@hono/zod-validator' // Added import

/**
 * 定义认证相关请求参数的校验 Schema
 * 例如使用 Zod
 */

// 例如: 登录请求体验证 Schema
export const loginSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(6, '密码至少需要6位'),
});

// 例如: 注册请求体验证 Schema
export const registerSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(6, '密码至少需要6位'),
  displayName: z.string().optional(), // 允许用户名为空
});

// Export validators
export const loginValidator = zValidator('json', loginSchema);
export const registerValidator = zValidator('json', registerSchema);
