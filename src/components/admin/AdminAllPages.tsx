import Link from "next/link";
import { ADMIN_PAGE_GROUPS } from "@/lib/adminPages";

export default function AdminAllPages() {
  return (
    <section className="mt-8 rounded-xl border border-gray-700 bg-gray-800/70 p-5">
      <h2 className="text-xl font-bold text-gold">All admin pages</h2>
      <p className="mt-1 text-sm text-gray-400">
        Every admin page in one place.
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_PAGE_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-sm font-semibold text-gray-200">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.pages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="text-sm text-yellow-200 hover:underline"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
