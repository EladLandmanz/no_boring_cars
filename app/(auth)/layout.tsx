import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-sm text-zinc-500">
          ← Home
        </Link>
        {children}
      </div>
    </div>
  );
}
