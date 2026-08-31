export default function CheckEmailPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        We sent a confirmation link. After you click it you will land back here
        and can choose a username.
      </p>
    </div>
  );
}
