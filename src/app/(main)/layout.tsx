import React from "react";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* 模拟侧边栏 */}
      <aside className="w-64 bg-white dark:bg-gray-800 p-4 shadow-md flex flex-col">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          AI Gyy 助手
        </h2>
        <nav className="flex-grow">
          <ul>
            <li className="mb-2">
              <a
                href="/chat"
                className="block py-2 px-3 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                默认聊天
              </a>
            </li>
            <li className="mb-2">
              <span className="text-gray-600 dark:text-gray-400 px-3">
                历史会话:
              </span>
              <ul className="ml-4 mt-1 text-sm space-y-1">
                <li>
                  <a
                    href="/chat/conv123"
                    className="block py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    - 会话1 (conv123)
                  </a>
                </li>
                <li>
                  <a
                    href="/chat/conv456"
                    className="block py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    - 会话2 (conv456)
                  </a>
                </li>
                {/* 更多历史会话 */}
              </ul>
            </li>
          </ul>
        </nav>
        <div className="mt-auto">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            用户: 模拟用户
          </p>
          <a
            href="/"
            className="block text-xs text-center mt-2 text-red-500 hover:text-red-700"
          >
            退出登录
          </a>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
