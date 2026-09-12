"use client";

// Select jenjang: submit form induk saat nilai berubah (form tanpa tombol Cari).
export function JenjangSelect({
  name,
  value,
  options,
  className,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      className={className}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
