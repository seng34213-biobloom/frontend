export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-10 text-center shadow-lg">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
          Next.js 14
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Welcome to My Storefront
        </h1>

        <p className="mt-4 text-base leading-7 text-gray-600">
          Your Next.js App Router and TypeScript project is ready.
        </p>

        <div className="mt-8 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white">
          Get Started
        </div>
      </div>
    </main>
  );
}