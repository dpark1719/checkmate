export function NavBadge({ count }: { count: number }) {
  const label = count > 9 ? "9+" : String(count);
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1.5 -right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none border-2 border-[var(--gp-nav-bg)]"
      style={{
        backgroundColor: "var(--gp-accent)",
        color: "var(--gp-accent-fg)",
      }}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  );
}
