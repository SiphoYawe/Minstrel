import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const features = [
  {
    label: 'Ear-First',
    description:
      'No sheet music. Develop your musical ear through real-time MIDI analysis and instant feedback on what you play.',
  },
  {
    label: 'AI Coaching',
    description:
      'A studio engineer that listens, analyzes, and guides your practice with genre-aware, growth-mindset coaching.',
  },
  {
    label: 'Adaptive Difficulty',
    description:
      'Intelligent drill generation that meets you exactly where you are and pushes you exactly where you need to go.',
  },
];

export default function MarketingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="mx-auto w-full max-w-content">
        {/* Hero */}
        <section className="flex flex-col items-center py-24 text-center lg:py-40">
          <p className="text-ui-label uppercase tracking-[0.2em] text-primary">
            Practice Companion
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Minstrel
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            AI-powered real-time MIDI practice companion. Plug in your instrument, play, and let
            intelligence shape your growth.
          </p>

          <div className="mt-10 flex gap-4">
            <Link
              href="/play"
              className="inline-flex h-12 items-center bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors duration-micro hover:brightness-110 active:brightness-90"
            >
              Start Playing
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center border border-border bg-transparent px-8 text-sm font-medium text-foreground transition-colors duration-micro hover:bg-surface-light"
            >
              Create Account
            </Link>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section className="grid gap-px border border-border sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="border border-border bg-card p-8 transition-colors duration-micro hover:bg-surface-light"
            >
              <p className="text-ui-label font-mono uppercase tracking-[0.15em] text-primary">
                {feature.label}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        {/* Footer tagline */}
        <section className="py-16 text-center lg:py-24">
          <p className="text-caption text-muted-foreground">
            Your instrument. Your ears. Your pace.
          </p>
        </section>
      </div>
    </main>
  );
}
