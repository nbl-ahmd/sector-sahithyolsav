interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function StatCard({ label, value, accent = "#f6b73c" }: StatCardProps) {
  return (
    <article className="stat-card" style={{ borderTopColor: accent }}>
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}
