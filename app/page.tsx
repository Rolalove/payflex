import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-6">FlexPay Landing Page</h1>
        <Link 
          href="/dashboard" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}

