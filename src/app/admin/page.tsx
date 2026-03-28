import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let productCount = 0;
  let orderCount = 0;
  let collectionCount = 0;
  let dbError: string | null = null;
  try {
    [productCount, orderCount, collectionCount] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.collection.count(),
    ]);
  } catch (e) {
    console.error("[admin dashboard] database query failed:", e);
    dbError =
      e instanceof Error
        ? e.message
        : "Could not reach the database. Check DATABASE_URL on Vercel and Supabase.";
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Dashboard</h1>
      {dbError && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          <p className="font-medium text-red-100">Database unavailable</p>
          <p className="mt-1 text-red-200/90">{dbError}</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Products</CardTitle>
            <CardDescription>Total products</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">{productCount}</p>
            <Button asChild variant="outline" size="sm" className="mt-2 border-brand-primary/50 text-brand-primary">
              <Link href="/admin/products">Manage</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Orders</CardTitle>
            <CardDescription>Total orders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">{orderCount}</p>
            <Button asChild variant="outline" size="sm" className="mt-2 border-brand-primary/50 text-brand-primary">
              <Link href="/admin/orders">View</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Collections</CardTitle>
            <CardDescription>Product collections</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">{collectionCount}</p>
            <Button asChild variant="outline" size="sm" className="mt-2 border-brand-primary/50 text-brand-primary">
              <Link href="/admin/products">Manage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
