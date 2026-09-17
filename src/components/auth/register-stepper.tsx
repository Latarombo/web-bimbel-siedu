import { useTranslations } from 'next-intl';
/* Stepper wizard registrasi 3 langkah — satu sumber label "Langkah X dari 3"
   (dulu teks statis di tiap form yang rawan tidak sinkron antar halaman). */


export default function RegisterStepper({ aktif }: { aktif: 1 | 2 | 3 }) {
  const t = useTranslations('auth');
  const STEPS = [t('stepParent'), t('stepPersonal'), t('stepChild')];
  return (
    <nav aria-label={t('progress')} className="mb-6">
      {/* Mobile: label ringkas + bar progres */}
      <p className="mb-2 text-xs font-semibold text-slate-500 sm:hidden">
        {t('stepDetail', {step: aktif, label: STEPS[aktif - 1]})}
      </p>
      <div
        className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 sm:hidden"
        role="progressbar"
        aria-valuenow={aktif}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label={t('step', {step: aktif})}
      >
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${(aktif / 3) * 100}%` }}
        />
      </div>

      {/* Desktop: 3 node + penghubung */}
      <ol className="hidden sm:flex sm:items-center">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const selesai = n < aktif;
          const sedang = n === aktif;
          return (
            <li
              key={label}
              aria-current={sedang ? "step" : undefined}
              className="flex items-center"
            >
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className={`mx-2 h-px w-8 lg:w-10 ${
                    sedang || selesai ? "bg-brand" : "bg-slate-200"
                  }`}
                />
              ) : null}
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  selesai
                    ? "bg-brand text-white"
                    : sedang
                      ? "border-2 border-brand text-brand"
                      : "border border-slate-200 text-slate-400"
                }`}
              >
                {selesai ? "✓" : n}
              </span>
              <span
                className={`ml-2 text-xs font-semibold whitespace-nowrap ${
                  sedang ? "text-slate-900" : selesai ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
