export default function ParentLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xs space-y-3">
        <div className="h-7 w-64 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Children Quick Switcher / KPI Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded-md bg-slate-100 dark:bg-slate-800" />
              <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-36 rounded-md bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Main Content Panels Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="h-5 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-4"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-52 rounded-md bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-36 rounded-md bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="h-6 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 space-y-2">
                  <div className="h-4 w-40 rounded-md bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-28 rounded-md bg-slate-100/70 dark:bg-slate-800/70" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
