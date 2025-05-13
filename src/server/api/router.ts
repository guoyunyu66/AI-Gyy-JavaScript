import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { v1Router } from './v1/router'

// 创建主Hono实例
export const apiApp = new Hono().basePath('/api')

// 全局中间件
apiApp.use('*', logger())
apiApp.use('*', cors())

// 健康检查
apiApp.get('/health', (c) => c.json({ status: 'ok' }))

// 临时路由
apiApp.get('/hello', (c) => {
  return c.json({
    message: 'Hello from AIGyy!',
    version: '0.1.0'
  })
})

// 注册路由
apiApp.route('/v1', v1Router)