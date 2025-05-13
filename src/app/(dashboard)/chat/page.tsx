import { redirect } from 'next/navigation';

export default function ChatRedirectPage() {
  redirect('/'); // 重定向到首页
  // 通常 redirect() 之后不需要返回任何 JSX，因为它会立即中断渲染并发送重定向响应
  // 但为了让函数有返回值（如果 ESLint 或 TypeScript 要求），可以返回 null 或一个简单的 div
  return null;
} 