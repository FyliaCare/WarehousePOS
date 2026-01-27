import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";

// Hero Section
function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-[820px]">
          <h1 className="text-[42px] leading-[1.15] font-[650] text-slate-900 mb-5 tracking-[-0.02em]">
            Need help? Use your portal.
          </h1>
          <p className="text-[19px] leading-[1.6] text-slate-600 mb-8 max-w-[650px]">
            We're based in Mpatado, Green Hills. For questions and complaints,
            log into your vendor portal and use the chatbox. We respond faster
            there because we can see your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-[650] text-[15px] rounded-lg hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Log into your portal
            </a>
            <a
              href="mailto:hello@warehouse.app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-[650] text-[15px] rounded-lg border border-slate-300 hover:border-slate-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              hello@warehouse.app
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Who to Contact Section
function WhoToContactSection() {
  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            Who to email
          </h2>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="text-[17px] font-[650] text-slate-900 mb-2">
                Questions before signing up
              </div>
              <p className="text-[15px] text-slate-600 mb-3">
                "Does it work offline?" "Can I import my Excel data?" "How much
                does it actually cost?"
              </p>
              <a
                href="mailto:hello@warehouse.app"
                className="text-[15px] font-[650] text-emerald-700 hover:text-emerald-800"
              >
                hello@warehouse.app
              </a>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="text-[17px] font-[650] text-slate-900 mb-2">
                Help or complaints
              </div>
              <p className="text-[15px] text-slate-600 mb-3">
                "Can't sync my data" "Having trouble with a feature" "I have a
                complaint"
              </p>
              <p className="text-[15px] font-[650] text-emerald-700">
                Use the chatbox complaint button in your portal
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="text-[17px] font-[650] text-slate-900 mb-2">
                Billing questions
              </div>
              <p className="text-[15px] text-slate-600 mb-3">
                "Need an invoice" "Want to upgrade" "Cancel my account" "Refund
                request"
              </p>
              <a
                href="mailto:billing@warehouse.app"
                className="text-[15px] font-[650] text-emerald-700 hover:text-emerald-800"
              >
                billing@warehouse.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Form Section
function ContactFormSection() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[680px]">
          <h2 className="text-[24px] font-[650] text-slate-900 mb-3 tracking-[-0.01em]">
            Or use this form
          </h2>
          <p className="text-[16px] text-slate-600 mb-8">
            We'll get back to you within a few hours during business hours
            (9am-6pm GMT, Monday-Friday). Sometimes faster.
          </p>

          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-7">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-[17px] font-[650] text-slate-900 mb-1">
                    Got it. We'll reply soon.
                  </h3>
                  <p className="text-[15px] text-slate-600">
                    Check your inbox. We usually respond in a few hours. Check
                    spam if you don't see anything.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-[15px] font-[650] text-slate-700 mb-2"
                >
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) =>
                    setFormState({ ...formState, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-[15px]"
                  placeholder="Kofi Mensah"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[15px] font-[650] text-slate-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) =>
                    setFormState({ ...formState, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-[15px]"
                  placeholder="kofi@myshop.com"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-[15px] font-[650] text-slate-700 mb-2"
                >
                  What can we help with?
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) =>
                    setFormState({ ...formState, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-[15px]"
                  placeholder="I'm trying to..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-[650] text-[15px] rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// Response Time Section
function ResponseTimeSection() {
  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[900px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            What to expect
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-start gap-3 mb-6">
                <Clock className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-[17px] font-[650] text-slate-900 mb-2">
                    Response times
                  </h3>
                  <div className="space-y-2 text-[15px] text-slate-600">
                    <p>
                      <span className="font-[650] text-slate-900">
                        Sales questions:
                      </span>{" "}
                      Usually within 2-3 hours
                    </p>
                    <p>
                      <span className="font-[650] text-slate-900">
                        Support issues:
                      </span>{" "}
                      4-6 hours for most issues
                    </p>
                    <p>
                      <span className="font-[650] text-slate-900">
                        Billing:
                      </span>{" "}
                      Same day, usually faster
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[14px] text-slate-500 bg-slate-50 p-4 rounded-lg">
                We're in Ghana (GMT timezone). If you email at 11pm your time,
                we'll reply when we're awake. No 24/7 support team, just real
                people with normal hours.
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3 mb-6">
                <Mail className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-[17px] font-[650] text-slate-900 mb-2">
                    Who will reply
                  </h3>
                  <div className="space-y-2 text-[15px] text-slate-600">
                    <p>
                      You can reach out to Mercy through our portal or contact
                      us via email. We're always open to hearing your concerns,
                      suggestions for improvement, and feedback on anything that
                      isn't working as it should.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Office Section
function OfficeSection() {
  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="max-w-[720px]">
          <h2 className="text-[15px] font-[650] text-slate-400 uppercase tracking-[0.06em] mb-6">
            Where we work
          </h2>

          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-[17px] font-[650] text-slate-900 mb-3">
              Takoradi, Ghana
            </h3>
            <p className="text-[15px] leading-[1.7] text-slate-600 mb-4">
              We are located at Green Hills, Mpatado Takoradi, but we are always
              just a message away. Reach out to us and we will respond to your
              needs. Together, we will help grow your business into a
              self-sufficient empire so successful that one day you will not
              even need us.
            </p>
            <div className="text-[14px] text-slate-500">
              <p className="mb-1">
                <span className="font-[650] text-slate-700">Office hours:</span>{" "}
                Monday-Friday, 9am-6pm GMT
              </p>
              <p>
                <span className="font-[650] text-slate-700">Email:</span>{" "}
                hello@warehouse.app
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main Contact Page
export function ContactPage() {
  return (
    <div>
      <HeroSection />
      <WhoToContactSection />
      <ContactFormSection />
      <ResponseTimeSection />
      <OfficeSection />
    </div>
  );
}

export default ContactPage;
