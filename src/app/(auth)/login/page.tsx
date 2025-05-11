import LoginForm from "@/modules/auth/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main>
        <LoginForm />
      </main>
    </div>
  );
}
