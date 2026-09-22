export default function TeacherLoading() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-slate-200" />
          <div className="h-4 w-80 rounded-lg bg-slate-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-md bg-slate-100" />
              <div className="size-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-16 rounded-lg bg-slate-200" />
            <div className="h-3 w-32 rounded-md bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-40 rounded-lg bg-slate-200" />
          <div className="h-8 w-24 rounded-lg bg-slate-100" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded-md bg-slate-200" />
                  <div className="h-3 w-28 rounded-md bg-slate-100" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
