import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BVDUMC Quiz Society — Quiz Operations Platform" },
      {
        name: "description",
        content:
          "Official platform of the BVDUMC Quiz Society, Bharati Vidyapeeth (DU) Medical College, Pune — managing medical quiz events, teams and question banks.",
      },
      { property: "og:title", content: "BVDUMC Quiz Society — Quiz Operations Platform" },
      {
        property: "og:description",
        content:
          "Managing medical quiz competitions for Bharati Vidyapeeth Deemed University Medical College, Pune.",
      },
    ],
  }),
  component: LandingPage,
});

const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    title: "Event management",
    body: "Plan quiz events end to end — schedule, venue, registration windows and status.",
  },
  {
    icon: Users,
    title: "Members & teams",
    body: "A single register of participants, teams and society volunteers across every event.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Nine society roles with database-enforced permissions, from Super Admin to Participant.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <BrandMark tone="light" />
          <Button asChild size="sm">
            <Link to="/auth">Member sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="brand-gradient text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-75">
              Bharati Vidyapeeth (DU) Medical College, Pune
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-semibold lg:text-5xl">
              The operations platform for the BVDUMC Quiz Society
            </h1>
            <p className="mt-5 max-w-2xl text-base text-primary-foreground/80">
              One secure home for medical quiz competitions — events, participants, teams, question
              banks, live scoring, certificates and analytics.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">
                  Enter the console <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Built for the way the society works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <article key={item.title} className="surface-panel p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} BVDUMC Quiz Society, Bharati Vidyapeeth Deemed University
          Medical College, Pune.
        </div>
      </footer>
    </div>
  );
}
