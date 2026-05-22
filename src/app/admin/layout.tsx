import Link from "next/link";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { signOut } from "@/auth";
import { safeAuth } from "@/lib/safe-auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/site-builder", label: "Site builder" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isLoginPage) {
    return (
      <div className="dark min-h-screen bg-black text-cream [&_input]:text-cream [&_input]:placeholder:text-zinc-400 [&_select]:text-cream [&_textarea]:text-cream">
        {children}
      </div>
    );
  }

  const authResult = await safeAuth();
  if (!authResult.ok) {
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(pathname || "/admin")}`);
  }
  const session: Session | null = authResult.session;
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
  if (!session?.user) redirect(`/admin/login?callbackUrl=${encodeURIComponent(pathname || "/admin")}`);
  if (!isAdmin) redirect("/");

  return (
    <div className="dark min-h-screen bg-black text-cream">
      <header className="border-b border-brand-primary/35 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/admin" className="font-serif text-xl text-brand-primary tracking-wide">
            Zieg&apos;s on a Mission Merch — Admin
          </Link>
          <nav className="flex items-center gap-6">
            {adminNav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-zinc-300 hover:text-brand-accent transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
              Storefront
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm" className="border-brand-primary/50 text-brand-primary">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8 [&_input]:text-cream [&_input]:placeholder:text-zinc-400 [&_select]:text-cream [&_textarea]:text-cream [&_button[data-variant=outline]]:text-cream">
        {children}
      </main>
    </div>
  );
}
