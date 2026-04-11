import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { UNIT_LIST, getFamilyFrameRoute } from "@/lib/constants";

export default function FamilySectionPage() {
  return (
    <AppShell
      title="Family Section"
      subtitle="Use unit-specific links for the user flow: open link, upload photo, share."
    >
      <section className="card">
        <div className="card-head">
          <h2>Family Frame Links</h2>
          <p>Choose a unit link to open the direct user upload-share screen.</p>
        </div>

        <div className="frames-row">
          {UNIT_LIST.map((unit) => (
            <Link
              key={unit}
              className="frame-chip"
              href={`${getFamilyFrameRoute()}?unit=${encodeURIComponent(unit)}`}
            >
              {unit}
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
