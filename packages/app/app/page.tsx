export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
      <div className="max-w-2xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          DevMentor
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Grow with a mentor who knows the way.
        </h1>
        <p className="mx-auto max-w-xl text-lg leading-8 text-slate-300">
          Find an experienced mentor who will help you take the next step in
          your tech career.
        </p>
        <a
          href="#mentors"
          className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          Find a mentor
        </a>
      </div>
    </main>
  );
}
