import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-8">
      <main className="flex flex-col items-center text-center gap-8">
        <div className="mb-8">
          {/* 你可以在这里放一个酷炫的 Logo */}
          <h1 className="text-6xl font-bold tracking-tight">
            欢迎使用{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              AI Gyy
            </span>{" "}
            助手
          </h1>
          <p className="mt-4 text-xl text-slate-300 max-w-xl">
            您的专属智能伙伴，随时随地为您提供帮助、解答疑问、激发灵感。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            href="/login"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105 text-lg"
          >
            登录账户
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg shadow-lg transition-transform transform hover:scale-105 text-lg"
          >
            注册新用户
          </Link>
        </div>

        <div className="mt-16 text-center text-slate-400">
          <p className="mb-2">体验未来，从这里开始。</p>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} AI Gyy 项目. 版权所有.
          </p>
        </div>
      </main>
    </div>
  );
}
