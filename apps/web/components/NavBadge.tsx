export function NavBadge({ count }: { count: number }) {
  const label = count > 9 ? "9+" : String(count);
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center leading-none"
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  );
}
