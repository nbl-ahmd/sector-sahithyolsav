import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { UNIT_LIST, getFamilyFrameRoute } from "@/lib/constants";

export default function HomePage() {
  const familyFrameLink = getFamilyFrameRoute();

  return (
    <AppShell
      title="Sector Sahityolsav"
      subtitle="Family framing is organized under the /family section, with room for future modules like points and leaderboard."
    >
      <div className="panel-grid cards-3">
        <article className="card hero-card">
          <h2>Family Frame Feature</h2>
          <p>Use the Family section for unit-specific user links and the simple upload-share flow.</p>
          <Link className="btn primary" href="/family">
            Open Family Section
          </Link>
        </article>

        <article className="card hero-card">
          <h2>Admin Dashboard</h2>
          <p>Upload and manage the frame overlay used by users.</p>
          <Link className="btn primary" href="/admin">
            Open Admin Dashboard
          </Link>
        </article>

        <article className="card hero-card">
          <h2>Sector Dashboard</h2>
          <p>Monitor unit standings, sector total, and share leaderboard as image or text.</p>
          <Link className="btn primary" href="/sector">
            Open Sector Dashboard
          </Link>
        </article>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>All Units Included</h2>
          <p>Karassery, Kakkad, Sarkkarparamb, Nellikkaparamb, Velliyaparamb, Karuthaparamb, North Karassery, Chonad.</p>
        </div>
        <div className="frames-row">
          {UNIT_LIST.map((unit) => (
            <Link
              key={unit}
              className="frame-chip"
              href={`${familyFrameLink}?unit=${encodeURIComponent(unit)}`}
            >
              {unit}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
