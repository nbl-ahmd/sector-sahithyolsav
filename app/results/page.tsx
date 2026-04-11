import { AppShell } from "@/components/AppShell";

export default function ResultsPage() {
	return (
		<AppShell title="Results" subtitle="Coming soon">
			<div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-sm">
				<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
						<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
						<path d="M4 22h16" />
						<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
						<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
						<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
					</svg>
				</div>
				<h2 className="text-2xl font-bold tracking-tight">Results & Scores</h2>
				<p className="mt-2 max-w-md text-muted-foreground">
					This feature is currently under active development. Check back later for comprehensive
					results, scoreboards, and analytics.
				</p>
			</div>
		</AppShell>
	);
}
