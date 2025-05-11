import React from "react";

interface ConversationInterfaceProps {
  conversationId: string;
}

export default function ConversationInterface({
  conversationId,
}: ConversationInterfaceProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          聊天会话:{" "}
          <span className="text-blue-500 dark:text-blue-400">
            {conversationId}
          </span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          这是您与 AI 助手的聊天记录。
        </p>
      </header>

      {/* 模拟聊天消息区域 */}
      <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4 overflow-y-auto">
        <div className="space-y-4">
          {/* 模拟消息，实际应根据 conversationId 加载 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold">
              AI
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                欢迎回到会话 {conversationId}！
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              你
            </div>
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <p className="text-sm">继续我们上次的话题...</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-bold">
              AI
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                好的，关于那个项目的进展是...
              </p>
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
