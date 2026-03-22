import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrders, listCustomOrders } from "@/lib/supabaseApi";
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Package } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AdminAnalytics() {
  const { data: storeOrders = [], isLoading: loadingStore } = useQuery({
    queryKey: ["admin-orders", "store"],
    queryFn: listOrders,
  });

  const { data: customOrders = [], isLoading: loadingCustom } = useQuery({
    queryKey: ["admin-orders", "custom"],
    queryFn: listCustomOrders,
  });

  const isLoading = loadingStore || loadingCustom;

  // Aggregate metrics
  const { totalRevenue, totalStoreOrders, totalCustomOrders, recentActivity, chartData } = useMemo(() => {
    let revenue = 0;
    const storeCount = storeOrders.length;
    const customCount = customOrders.length;

    // Calculate revenue from successful/delivered/pending store orders (customize as needed)
    storeOrders.forEach((order) => {
      // Assuming all non-cancelled orders count towards revenue for now
      if (order.status !== "Cancelled") {
        revenue += order.total;
      }
      // Note: custom order revenue is not available in DbCustomOrder schema currently, 
      // so we only sum store order revenue.
    });

    // Combine recent activity
    const combinedOrders = [
      ...storeOrders.map((o) => ({
        id: o.id,
        type: "store",
        createdAt: new Date(o.created_at),
        amount: o.total,
        status: o.status,
        customer: "Store Customer", // You could join user table if you have customer name mapping
      })),
      ...customOrders.map((o) => ({
        id: o.id,
        type: "custom",
        createdAt: new Date(o.created_at),
        amount: 0, // Custom order total not in schema
        status: o.status,
        customer: o.customer_name,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const recent = combinedOrders.slice(0, 10);

    // Chart Data (Group by last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        date: d.toISOString().split("T")[0],
        storeOrders: 0,
        customOrders: 0,
      };
    }).reverse();

    combinedOrders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split("T")[0];
      const dayData = last7Days.find((d) => d.date === dateStr);
      if (dayData) {
        if (order.type === "store") dayData.storeOrders += 1;
        if (order.type === "custom") dayData.customOrders += 1;
      }
    });

    // Format display dates for chart
    const formattedChartData = last7Days.map((d) => ({
      name: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      Store: d.storeOrders,
      Custom: d.customOrders,
    }));

    return {
      totalRevenue: revenue,
      totalStoreOrders: storeCount,
      totalCustomOrders: customCount,
      recentActivity: recent,
      chartData: formattedChartData,
    };
  }, [storeOrders, customOrders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Analytics Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={`GHâ‚µ ${totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Total Store Orders"
            value={totalStoreOrders.toString()}
            icon={<ShoppingBag className="w-4 h-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Total Custom Orders"
            value={totalCustomOrders.toString()}
            icon={<Package className="w-4 h-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Conversion Rate"
            value="Coming Soon"
            icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="border border-border p-6 lg:col-span-4 rounded-sm bg-background/50">
          <h3 className="text-sm font-medium mb-6">Orders Over Last 7 Days</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorStore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "2px",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="Store"
                  stroke="hsl(var(--foreground))"
                  fillOpacity={1}
                  fill="url(#colorStore)"
                />
                <Area
                  type="monotone"
                  dataKey="Custom"
                  stroke="hsl(var(--muted-foreground))"
                  fillOpacity={1}
                  fill="url(#colorCustom)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border p-6 lg:col-span-3 rounded-sm bg-background/50">
          <h3 className="text-sm font-medium mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${activity.type === 'store' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                    {activity.type === 'store' ? (
                      <ShoppingBag className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.customer}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{activity.type} Order</span>
                      <span>â€¢</span>
                      <span>{activity.createdAt.toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {activity.amount > 0 && (
                      <p className="text-sm font-semibold">GHâ‚µ{activity.amount}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 font-medium">
                      {activity.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-border p-5 rounded-sm bg-background">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        {icon}
      </div>
      <div className="text-2xl font-serif italic truncate">{value}</div>
    </div>
  );
}
