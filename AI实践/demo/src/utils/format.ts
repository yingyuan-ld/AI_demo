export function formatAmount(value: number, token: string): string {
  const abs = Math.abs(value);
  const formatted =
    abs >= 1_000_000
      ? `${(value / 1_000_000).toFixed(2)}M`
      : abs >= 1_000
        ? `${(value / 1_000).toFixed(1)}K`
        : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${formatted} ${token}`;
}

export function formatFullAmount(value: number, token: string): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${token}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function riskTone(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function riskLabel(score: number): string {
  const tone = riskTone(score);
  if (tone === "critical") return "极高风险";
  if (tone === "high") return "高风险";
  if (tone === "medium") return "中风险";
  return "低风险";
}
