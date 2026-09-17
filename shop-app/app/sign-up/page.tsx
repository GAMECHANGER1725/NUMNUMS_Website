import { SignUpPanel } from "@/components/ui/sign-up-panel";

export const metadata = {
  title: "Create your account | Num Num's Bakery",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <SignUpPanel variant="page" />
    </main>
  );
}
