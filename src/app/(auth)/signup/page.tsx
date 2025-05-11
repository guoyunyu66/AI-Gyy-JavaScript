import SignupForm from "@/modules/auth/sign/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main>
        <SignupForm />
      </main>
    </div>
  );
}
