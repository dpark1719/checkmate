import Link from "next/link";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/post", label: "Post" },
  { href: "/streaks", label: "Streaks" },
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "Profile" },
];

export function AppNav() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/feed" className="font-bold text-emerald-400">
          GoalPost
        </Link>
        <div className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-400 hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
