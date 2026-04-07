import Link from "next/link";
import { useRouter } from "next/router";

const items = [
  { href: "/wealth-builder", label: "Overview" },
  { href: "/wealth-builder/dashboard", label: "Dashboard" },
  { href: "/wealth-builder/debt", label: "Debt" },
  { href: "/wealth-builder/budget", label: "Budget" },
  { href: "/wealth-builder/savings", label: "Savings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href;
}

export default function WealthBuilderNav() {
  const router = useRouter();

  return (
    <nav
      aria-label="Wealth Builder Navigation"
      className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-yellow-700/40 bg-black/40 p-4"
    >
      {items.map((item) => {
        const active = isActive(router.pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active
                ? "border-yellow-400 bg-yellow-500/15 text-yellow-300"
                : "border-white/15 bg-white/5 text-white hover:border-yellow-500/40 hover:text-yellow-300",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
