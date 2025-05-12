import { apiApp } from '@/server/api/router'
import { handle } from 'hono/vercel'

export const runtime = 'edge'

// 导出处理不同HTTP方法的处理器
export const GET = handle(apiApp)
export const POST = handle(apiApp)
export const PUT = handle(apiApp)
export const DELETE = handle(apiApp)
export const PATCH = handle(apiApp) 