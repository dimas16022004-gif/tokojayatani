import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "emerald" | "amber" | "rose" | "blue";
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "emerald",
}: StatCardProps) {
  const variantStyles = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 icon-bg:bg-emerald-500",
    amber: "bg-amber-50 border-amber-200 text-amber-900 icon-bg:bg-amber-500",
    rose: "bg-rose-50 border-rose-200 text-rose-900 icon-bg:bg-rose-500",
    blue: "bg-blue-50 border-blue-200 text-blue-900 icon-bg:bg-blue-500",
  };

  const iconColors = {
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-600 text-white",
    blue: "bg-blue-600 text-white",
  };

  return (
    <div
      className={`p-5 rounded-2xl border-2 shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md ${iconColors[variant]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-black mt-0.5 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs font-semibold text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
