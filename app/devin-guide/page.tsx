import type { Metadata } from "next";
import {
  BookOpen,
  ExternalLink,
  Gem,
  GitPullRequest,
  KeyRound,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  MonitorPlay,
  Ban,
  FileCode,
  RotateCcw,
  Link2,
  Split,
  Target,
  Workflow,
  SquarePlay,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Devin AI Guide",
  description: "How to use Devin AI effectively: prompting best practices, workflow tips, docs and video tutorials.",
};

type Tip = { icon: LucideIcon; title: string; text: string };
type Resource = { href: string; label: string; note: string };

const PROMPTING_TIPS: Tip[] = [
  {
    icon: FileCode,
    title: "Be specific",
    text: "Include file paths, function names and the expected behaviour so Devin knows exactly where and what to change.",
  },
  {
    icon: Target,
    title: "State the goal and acceptance criteria",
    text: "Explain why the change is needed and what “done” looks like, not just the task itself.",
  },
  {
    icon: Link2,
    title: "Provide context",
    text: "Link related PRs and issues, and describe how the repo is set up and run.",
  },
  {
    icon: Split,
    title: "Break large tasks down",
    text: "Split big projects into smaller, well-scoped sessions that each produce a reviewable result.",
  },
  {
    icon: ListChecks,
    title: "Specify how to verify",
    text: "Name the tests to run, the commands to use and the output you expect to see.",
  },
  {
    icon: Ban,
    title: "Mention what NOT to change",
    text: "Call out constraints: files, APIs or behaviour that must stay untouched.",
  },
  {
    icon: MessageSquare,
    title: "Ask mode vs. sessions",
    text: "Use Devin's Ask mode for questions about the codebase, and full sessions for code changes.",
  },
];

const USAGE_TIPS: Tip[] = [
  {
    icon: KeyRound,
    title: "Set up the environment",
    text: "Configure devin.json / repo onboarding notes and secrets so Devin can install, run and test the app.",
  },
  {
    icon: MessagesSquare,
    title: "Review the plan early",
    text: "Check Devin's plan at the start of a session and correct course via chat before work goes too far.",
  },
  {
    icon: Workflow,
    title: "Use playbooks",
    text: "Capture repeated tasks as playbooks so every run follows the same proven steps.",
  },
  {
    icon: GitPullRequest,
    title: "Iterate on draft PRs",
    text: "Let Devin open draft PRs, then leave PR comments to request changes and iterate.",
  },
  {
    icon: RotateCcw,
    title: "Monitor and roll back",
    text: "Keep an eye on the session and use snapshots / rollback when a direction doesn't work out.",
  },
];

const DOCS: Resource[] = [
  { href: "https://docs.devin.ai", label: "Devin Docs", note: "Official documentation" },
  { href: "https://docs.devin.ai/get-started", label: "Get Started", note: "Quickstart" },
  { href: "https://docs.devin.ai/work-with-devin", label: "Work with Devin", note: "Best practices and prompting" },
  { href: "https://cognition.ai/blog", label: "Cognition Blog", note: "News and deep dives from the Devin team" },
];

const VIDEOS: Resource[] = [
  { href: "https://www.youtube.com/@CognitionAI", label: "Cognition on YouTube", note: "Official Cognition / Devin channel" },
  {
    href: "https://www.youtube.com/results?search_query=Devin+AI+tutorial",
    label: "Devin AI tutorials",
    note: "YouTube search",
  },
  {
    href: "https://www.youtube.com/results?search_query=Devin+AI+Cognition+demo",
    label: "Devin AI demos",
    note: "YouTube search",
  },
];

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center">
      <h2 className="font-heading text-3xl text-gold-gradient md:text-4xl">{children}</h2>
      {sub && <p className="mt-2 text-sm text-neutral-400">{sub}</p>}
      <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-gold">
        <span className="h-px w-12 bg-gold/60" />
        <Gem className="h-4 w-4" />
        <span className="h-px w-12 bg-gold/60" />
      </div>
    </div>
  );
}

function TipGrid({ tips }: { tips: Tip[] }) {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tips.map(({ icon: Icon, title, text }) => (
        <div key={title} className="card flex gap-4 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon text-royal">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
            <p className="mt-1 text-sm text-neutral-400">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LinkList({ title, icon: Icon, links }: { title: string; icon: LucideIcon; links: Resource[] }) {
  return (
    <div className="card p-6">
      <h3 className="flex items-center gap-2 font-heading text-xl text-maroon">
        <Icon className="h-5 w-5" /> {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 rounded-xl border border-neutral-800 bg-royal px-4 py-3 transition hover:border-maroon"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-100 group-hover:text-maroon">{l.label}</span>
                <span className="block text-xs text-neutral-400">{l.note}</span>
                <span className="mt-1 block break-all text-xs text-gold">{l.href}</span>
              </span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500 group-hover:text-maroon" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DevinGuidePage() {
  return (
    <>
      <section className="border-b border-neutral-800 bg-cream">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <span className="rounded-full border border-maroon/40 px-4 py-1 text-[11px] uppercase tracking-[0.3em] text-maroon">
            Guide
          </span>
          <h1 className="mt-5 font-heading text-3xl leading-tight text-gold-gradient md:text-5xl">
            How to Use Devin AI Effectively
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-400 md:text-base">
            Practical tips for writing great prompts, running productive sessions, and where to learn more.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionTitle sub="Clear prompts get better results, faster">Prompting Best Practices</SectionTitle>
        <TipGrid tips={PROMPTING_TIPS} />
      </section>

      <section className="border-y border-neutral-800 bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionTitle sub="Set Devin up to succeed and stay in the loop">Using Devin Effectively</SectionTitle>
          <TipGrid tips={USAGE_TIPS} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionTitle sub="Official docs, tutorials and videos">Learn More</SectionTitle>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <LinkList title="Tutorials & Docs" icon={BookOpen} links={DOCS} />
          <LinkList title="YouTube" icon={SquarePlay} links={VIDEOS} />
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <MonitorPlay className="h-4 w-4" /> Links open in a new tab.
        </p>
      </section>
    </>
  );
}
