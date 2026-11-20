export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Admin Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-slate-200" />
          <div className="h-4 w-72 rounded-md bg-slate-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-slate-200 shrink-0" />
      </div>

      {/* Filter Tabs / Quick Actions Skeleton */}
      <div className="flex items-center gap-2 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-200" />
        ))}
      </div>

      {/* Main Admin Data Table Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-9 w-64 rounded-lg bg-slate-100" />
          <div className="h-8 w-24 rounded-lg bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 rounded-md bg-slate-200" />
                <div className="h-3 w-32 rounded-md bg-slate-100" />
              </div>
              <div className="h-4 w-24 rounded-md bg-slate-100" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
              <div className="size-8 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
