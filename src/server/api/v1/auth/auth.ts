import { Context } from 'hono' // Assuming Context type is available from hono
import { logger } from '@/lib/logger';
// import { AuthService } from '@/server/services/auth.service'

const log = logger.child({ module: 'auth-handler' });

// 登录处理
export const loginHandler = async (c: Context) => {
  let requestBody = {};
  try {
    requestBody = await c.req.json();
    log.info({ path: c.req.path, method: c.req.method, requestBody }, '登录接口请求参数');
  } catch (error) {
    log.warn({ path: c.req.path, method: c.req.method, error }, '解析登录请求参数失败');
    // 即使解析失败，也继续执行后续的TODO逻辑，或者根据需要返回错误
  }
  // const { email, password } = requestBody; // 假设后续会使用
  // const result = await AuthService.login(email, password)
  // TODO: 实现登录逻辑
  log.info('登录接口被调用，功能待实现');
  const response = {
    status: 'success',
    message: '登录功能待实现'
  };
  log.info({ path: c.req.path, response }, '登录接口响应');
  return c.json(response);
}

// 注册处理
export const registerHandler = async (c: Context) => {
  let requestBody = {};
  try {
    requestBody = await c.req.json();
    log.info({ path: c.req.path, method: c.req.method, requestBody }, '注册接口请求参数');
  } catch (error) {
    log.warn({ path: c.req.path, method: c.req.method, error }, '解析注册请求参数失败');
  }
  // const { email, password, displayName } = requestBody;
  // const result = await AuthService.register({ email, password, displayName })
  // TODO: 实现注册逻辑
  log.info('注册接口被调用，功能待实现');
  const response = {
    status: 'success',
    message: '注册功能待实现'
  };
  log.info({ path: c.req.path, response }, '注册接口响应');
  return c.json(response);
}

// 登出处理
export const logoutHandler = async (c: Context) => {
  log.info({ path: c.req.path, method: c.req.method }, '登出接口请求');
  // Supabase的最佳实践是通过客户端SDK的signOut方法来处理登出，
  // 它会自动清除cookie。后端通常不需要直接操作Supabase的session。
  
  // 这个API端点主要用于向客户端发出明确的登出信号，
  // 并可能执行任何特定于服务器的登出后清理（如果需要的话）。
  // 客户端收到成功响应后，应调用其本地Supabase实例的signOut方法。
  
  log.info('[API登出] 收到登出请求，客户端应调用 supabase.auth.signOut()');
  
  // 也可以在这里清除应用特定的非Supabase会话cookie（如果存在）
  // import { deleteCookie } from 'hono/cookie';
  // deleteCookie(c, 'your_app_specific_cookie_name');

  const response = {
    status: 'success',
    message: '登出请求处理成功，请客户端完成后续操作'
  };
  log.info({ path: c.req.path, response }, '登出接口响应');
  return c.json(response);
}

// 获取当前会话处理
export const sessionHandler = async (c: Context) => {
  log.info({ path: c.req.path, method: c.req.method }, '获取会话接口请求');
  // const session = await AuthService.getSession(c)
  // TODO: 实现获取会话逻辑
  log.info('获取会话接口被调用，功能待实现');
  const response = {
    status: 'success',
    authenticated: false,
    message: '获取会话功能待实现'
  };
  log.info({ path: c.req.path, response }, '获取会话接口响应');
  return c.json(response);
} 