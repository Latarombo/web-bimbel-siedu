export default function ClassesLoading() {
  return (
    <div className="bg-slate-50 min-h-full animate-pulse">
      {/* Hero Skeleton */}
      <section className="relative overflow-hidden bg-[#1d4ed8] pt-6 pb-16 text-white sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center text-center space-y-3">
          <div className="h-9 sm:h-11 w-80 max-w-full rounded-2xl bg-white/20" />
          <div className="h-4 sm:h-5 w-96 max-w-full rounded-xl bg-white/10" />
        </div>
      </section>

      {/* Filter Bar Card Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16 relative z-10">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-11 flex-1 rounded-xl bg-slate-100" />
            <div className="h-11 w-36 rounded-xl bg-slate-200" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-24 rounded-lg bg-slate-100 shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Class Cards Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-8">
          <div className="h-4 w-32 rounded-md bg-slate-200" />
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-20 rounded-md bg-slate-100" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between h-96"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                  <div className="h-4 w-28 rounded-md bg-slate-100" />
                </div>
                <div className="h-6 w-48 rounded-lg bg-slate-200" />
                <div className="h-4 w-full rounded-md bg-slate-100" />
                <div className="h-4 w-3/4 rounded-md bg-slate-100" />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 rounded-md bg-slate-100" />
                  <div className="h-6 w-28 rounded-lg bg-slate-200" />
                </div>
                <div className="h-11 w-full rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
