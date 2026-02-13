import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { HeroCTA } from '@/components/hero-cta';

const features = [
  {
    label: 'Ear-First',
    description:
      'No sheet music. Develop your musical ear through real-time MIDI analysis and instant feedback on what you play.',
    tag: 'FR8–13',
  },
  {
    label: 'AI Coaching',
    description:
      'A studio engineer that listens, analyzes, and guides your practice with genre-aware, growth-mindset coaching.',
    tag: 'FR24–28',
  },
  {
    label: 'Adaptive Difficulty',
    description:
      'Intelligent drill generation that meets you exactly where you are and pushes you exactly where you need to go.',
    tag: 'FR14–23',
  },
];

const modes = [
  {
    key: '1',
    name: 'Silent Coach',
    description: 'Full-screen immersive visualization. Play freely with real-time visual feedback.',
  },
  {
    key: '2',
    name: 'Dashboard',
    description: 'Split view with live data cards and conversational AI coaching.',
  },
  {
    key: '3',
    name: 'Replay Studio',
    description: 'Timeline scrubbing, tabbed analysis, and moment-specific AI insight.',
  },
];

export default function MarketingPage() {
  return (
    <main className="flex flex-1 flex-col items-center">
      <div className="mx-auto w-full max-w-content">
        {/* Hero */}
        <section className="flex flex-col items-center px-8 py-32 text-center lg:py-44">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7CB9E8]">
            Practice Companion
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Your instrument
            <br />
            <span className="text-[#7CB9E8]">hears back.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#A3A3A3] sm:text-xl">
            AI-powered real-time MIDI analysis. Plug in, play, and let intelligence shape your
            growth.
          </p>

          <HeroCTA />
        </section>

        <Separator className="bg-[#1A1A1A]" />

        {/* Features */}
        <section className="px-8 py-20 lg:py-28">
          <div className="mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7CB9E8]">
              Capabilities
            </p>
            <div className="mt-2 h-px w-8 bg-[#7CB9E8]" />
          </div>

          <div className="grid gap-px border border-[#1A1A1A] sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="border border-[#1A1A1A] bg-[#0F0F0F] p-8 transition-colors duration-150 hover:bg-[#141414]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#7CB9E8]">
                    {feature.label}
                  </p>
                  <span className="font-mono text-[9px] tracking-wider text-[#333]">
                    {feature.tag}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#A3A3A3]">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-[#1A1A1A]" />

        {/* Modes */}
        <section className="px-8 py-20 lg:py-28">
          <div className="mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7CB9E8]">
              Three Modes
            </p>
            <div className="mt-2 h-px w-8 bg-[#7CB9E8]" />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {modes.map((mode) => (
              <div key={mode.key} className="group">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[32px] font-semibold leading-none text-[#7CB9E8]/20 transition-colors duration-150 group-hover:text-[#7CB9E8]/40">
                    {mode.key}
                  </span>
                  <h3 className="text-base font-medium text-foreground">{mode.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#666]">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section className="border-t border-[#1A1A1A] px-8 py-16 text-center lg:py-20">
          <Image
            src="/minstrel-logo-white.svg"
            alt="Minstrel"
            width={160}
            height={40}
            className="mx-auto mb-4 h-8 w-auto opacity-20"
          />
          <p className="font-mono text-[11px] tracking-wider text-[#333]">
            Your instrument. Your ears. Your pace.
          </p>
        </section>
      </div>
    </main>
  );
}
