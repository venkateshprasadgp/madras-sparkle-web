/** Instant skeleton shown by loading.tsx while a route's data streams in. */
export default function PageLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-64 rounded-lg bg-neutral-800" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-square bg-neutral-900" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 rounded bg-neutral-800" />
              <div className="h-4 w-2/3 rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
