import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Hero Section
function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-[820px]">
          <h1 className="text-[42px] leading-[1.15] font-[650] text-slate-900 mb-5 tracking-[-0.02em]">
            We get it. Running a business is hard enough without fighting your
            software.
          </h1>
          <p className="text-[19px] leading-[1.6] text-slate-600 mb-8 max-w-[650px]">
            Warehouse was founded in 2021 after our founder, Mr. Montford,
            became frustrated watching many promising startups shut down. Not
            because their ideas were bad or their teams were lazy, but simply
            because they lacked basic management processes.
          </p>
          <div className="text-[15px] text-slate-500 leading-[1.7] space-y-2.5 max-w-[680px]">
            <p>
              He saw that it was often the everyday systems and organization,
              not the product itself, that determined whether a business could
              survive and grow.
            </p>
            <p>
              Today, we help shops, pharmacies, and wholesalers across Ghana
              spend less time on admin and more time on what actually matters.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// The Problem Section
function ProblemSection() {
  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            The problem we saw
          </h2>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-[21px] font-[650] text-slate-900 mb-3 tracking-[-0.01em]">
                  Business owners were spending more time on paperwork than
                  customers
                </h3>
                <p className="text-[16px] leading-[1.7] text-slate-600">
                  We talked to Kwame who runs a pharmacy in Osu. He'd spend 2
                  hours every night updating his records. Akosua in Madina
                  Market was losing track of what sold and what didn't. Kofi's
                  suppliers kept asking "how many left?" and he never knew.
                </p>
              </div>

              <div>
                <h3 className="text-[21px] font-[650] text-slate-900 mb-3 tracking-[-0.01em]">
                  Existing tools were built for different realities
                </h3>
                <p className="text-[16px] leading-[1.7] text-slate-600">
                  QuickBooks assumes you sit at a desk. Square assumes perfect
                  internet. Zoho assumes you have an IT person. None of them
                  were built for someone running a shop from their phone while
                  serving customers.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-7 rounded-lg">
              <div className="text-[15px] font-[650] text-slate-700 mb-4">
                What we kept hearing:
              </div>
              <div className="space-y-3 text-[15px] leading-[1.6] text-slate-600">
                <div className="flex gap-2">
                  <span className="text-slate-400">“</span>
                  <span>
                    I know I'm making sales, but I honestly don't know my profit
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">“</span>
                  <span>My best items run out and I don't even notice</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">“</span>
                  <span>I forget to follow up with good customers</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">“</span>
                  <span>
                    End of day, I'm too tired to update my records properly
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">“</span>
                  <span>I just want something simple that actually works</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// What We Built Section
function WhatWeBuitSection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            So we built something different
          </h2>

          <div className="space-y-8">
            <div className="grid lg:grid-cols-[0.4fr_1fr] gap-6 items-start">
              <div className="text-[17px] font-[650] text-slate-900">
                It handles the boring stuff
              </div>
              <div className="text-[16px] leading-[1.7] text-slate-600">
                Stock counts update automatically. Receipts send themselves.
                Reports generate without you lifting a finger. You just focus on
                your customers.
              </div>
            </div>

            <div className="grid lg:grid-cols-[0.4fr_1fr] gap-6 items-start">
              <div className="text-[17px] font-[650] text-slate-900">
                It shows you what's actually happening
              </div>
              <div className="text-[16px] leading-[1.7] text-slate-600">
                See your real profit, not just revenue. Know which products make
                you money. Get alerts before your best sellers run out. Make
                decisions based on facts, not guesses.
              </div>
            </div>

            <div className="grid lg:grid-cols-[0.4fr_1fr] gap-6 items-start">
              <div className="text-[17px] font-[650] text-slate-900">
                It works the way you work
              </div>
              <div className="text-[16px] leading-[1.7] text-slate-600">
                Use it on your phone while serving customers. Works even when
                internet is spotty. Accepts the payments your customers actually
                use: MoMo, cash, card, whatever.
              </div>
            </div>

            <div className="grid lg:grid-cols-[0.4fr_1fr] gap-6 items-start">
              <div className="text-[17px] font-[650] text-slate-900">
                Pricing that makes sense
              </div>
              <div className="text-[16px] leading-[1.7] text-slate-600">
                Start free. Upgrade when you're ready. Pay for what you use. No
                surprise fees. No contracts. Cancel anytime and your data is
                still yours.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Leadership Section - Mercy Cherbu
function LeadershipSection() {
  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-8">
            The person behind the vision
          </h2>

          <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">
            {/* Mercy's Photo */}
            <div className="relative">
              <img
                src="/images/mercy-cherbu.png"
                alt="Mercy Cherbu - Managing Director"
                className="w-full aspect-[3/4] object-cover object-top rounded-xl"
              />
              <div className="mt-4">
                <div className="text-[21px] font-[650] text-slate-900">
                  Mercy Cherbu
                </div>
                <div className="text-[15px] text-slate-500">
                  Managing Director
                </div>
              </div>
            </div>

            {/* Mercy's Vision */}
            <div className="space-y-5">
              <h3 className="text-[21px] font-[650] text-slate-900 tracking-[-0.01em]">
                Making sure every business owner has a fair shot
              </h3>
              <div className="space-y-4 text-[16px] leading-[1.7] text-slate-600">
                <p>
                  Mercy joined Warehouse because she's seen too many hardworking
                  business owners struggle. Not from lack of effort, but from
                  lack of the right tools.
                </p>
                <p>
                  Her job is simple: make sure Warehouse actually helps real
                  people run real businesses. If something's confusing or
                  doesn't work, she wants to hear about it.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-900">
                <p className="text-[16px] leading-[1.7] text-slate-700 italic mb-3">
                  "I've met so many talented entrepreneurs who just need someone
                  to handle the business side so they can do what they're good
                  at. That's what we're here for. If you're putting in the work,
                  we'll make sure the tools are there."
                </p>
                <div className="text-[14px] font-[650] text-slate-900">
                  Mercy Cherbu
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// How We Work Section
function HowWeWorkSection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            How we work
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-[17px] font-[650] text-slate-900 mb-3">
                We use Warehouse ourselves
              </h3>
              <p className="text-[15px] leading-[1.7] text-slate-600 mb-3">
                If something's annoying or broken, we feel it first. That's how
                we stay honest about what actually needs fixing.
              </p>
              <p className="text-[14px] text-slate-500">
                Bugs don't last long here.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-[17px] font-[650] text-slate-900 mb-3">
                We ship improvements weekly
              </h3>
              <p className="text-[15px] leading-[1.7] text-slate-600 mb-3">
                Small, steady updates. Not big dramatic launches that break
                things. You'll notice little things getting better all the time.
              </p>
              <p className="text-[14px] text-slate-500">
                We're always listening and improving.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-[17px] font-[650] text-slate-900 mb-3">
                Backed by MicroAI Systems
              </h3>
              <p className="text-[15px] leading-[1.7] text-slate-600 mb-3">
                We're not some fly-by-night startup. MicroAI Systems is a real
                tech company building practical tools for African businesses.
              </p>
              <p className="text-[14px] text-slate-500">
                We're here for the long run.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// What We're Not Section
function WhatWereNotSection() {
  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[720px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            A few honest things
          </h2>

          <div className="space-y-5 text-[16px] leading-[1.7] text-slate-600">
            <p>
              <span className="font-[650] text-slate-900">
                We focus on what we're good at.
              </span>{" "}
              Inventory, sales, and keeping track of your money. We don't try to
              do payroll, complex manufacturing, or things we'd do poorly.
            </p>

            <p>
              <span className="font-[650] text-slate-900">
                We're not chasing investors.
              </span>{" "}
              We're bootstrapped, which means we can build what you actually
              need instead of what looks good to VCs. We answer to you, not
              Silicon Valley.
            </p>

            <p>
              <span className="font-[650] text-slate-900">
                We're built for small businesses.
              </span>{" "}
              If you're a corporation with 500 employees, we're probably not
              your fit. If you're running a shop, pharmacy, or small wholesale
              operation, we're built exactly for you.
            </p>

            <p>
              <span className="font-[650] text-slate-900">
                We believe in being genuinely useful.
              </span>{" "}
              Every feature we add has to earn its place. If it doesn't help you
              run your business better, we don't ship it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[680px]">
          <h2 className="text-[28px] leading-[1.2] font-[650] text-slate-900 mb-4 tracking-[-0.02em]">
            Ready to take back your time?
          </h2>
          <p className="text-[16px] leading-[1.7] text-slate-600 mb-7">
            Give it a try for free. No credit card, no sales calls, no pressure.
            Just sign up and see if it works for you. We think it will.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-[650] text-[15px] rounded-lg hover:bg-slate-800 transition-colors"
            >
              Get started free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-[650] text-[15px] rounded-lg border border-slate-300 hover:border-slate-400 transition-colors"
            >
              Have questions? Let's talk
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main About Page
export function AboutPage() {
  return (
    <div>
      <HeroSection />
      <ProblemSection />
      <WhatWeBuitSection />
      <LeadershipSection />
      <HowWeWorkSection />
      <WhatWereNotSection />
      <CTASection />
    </div>
  );
}

export default AboutPage;
