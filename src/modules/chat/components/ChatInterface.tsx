import React from "react";

export default function ChatInterface() {
  return (
    <div className="flex flex-col h-full">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          聊天室
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          与您的 AI 助手开始新的对话，或选择一个历史会话。
        </p>
      </header>

      {/* 模拟聊天消息区域 */}
      <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold">
              AI
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                您好！我是您的 AI 助手，有什么可以帮助您的吗？
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              你
            </div>
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <p className="text-sm">你好！我想问一下今天天气怎么样？</p>
            </div>
          </div>
        </div>
      </div>

      {/* 模拟聊天输入框 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="在此输入您的消息..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <button className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
