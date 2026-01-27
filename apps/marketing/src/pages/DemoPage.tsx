import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Download,
  Smartphone,
  Chrome,
  AlertCircle,
  ExternalLink,
  Wifi,
  WifiOff,
  Zap,
  Monitor,
  Apple,
} from "lucide-react";

// Detect if user is on Chrome
function isChrome() {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("chrome") &&
    !userAgent.includes("edg") &&
    !userAgent.includes("opr")
  );
}

// Detect if user is on mobile
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

// App URL - the main POS app
const APP_URL = "https://warehousepos.com";

// Hero Section - Now focused on trying/downloading the app
function HeroSection() {
  const [isOnChrome, setIsOnChrome] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    setIsOnChrome(isChrome());
    setIsMobileDevice(isMobile());
  }, []);

  return (
    <section className="relative pt-32 pb-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Download className="w-4 h-4" />
            Try It Free
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Download{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Warehouse POS
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get the full app experience on your phone or computer. Works
            offline, syncs when connected. No app store needed.
          </p>

          {/* Chrome recommendation notice */}
          {!isOnChrome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Chrome className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-amber-900">
                    For the best experience, use Google Chrome
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Chrome installs Warehouse as a real app on your device.
                    Other browsers may only create a shortcut.{" "}
                    <a
                      href="https://www.google.com/chrome/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-amber-900"
                    >
                      Download Chrome →
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Smartphone className="w-5 h-5" />
              {isMobileDevice ? "Install App" : "Open Warehouse App"}
              <ExternalLink className="w-4 h-4" />
            </a>
            {!isOnChrome && (
              <a
                href={`googlechrome://${APP_URL.replace("https://", "")}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all border border-gray-200"
              >
                <Chrome className="w-5 h-5 text-[#4285F4]" />
                Open in Chrome
              </a>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Free 7-day trial • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Installation Instructions Section
function InstallInstructions() {
  const [activeTab, setActiveTab] = useState<"mobile" | "desktop">("mobile");

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              How to Install Warehouse
            </h2>
            <p className="text-gray-600">
              Follow these simple steps to install the app on your device
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("mobile")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "mobile"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📱 Mobile (Phone)
              </button>
              <button
                onClick={() => setActiveTab("desktop")}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "desktop"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                💻 Desktop (Computer)
              </button>
            </div>
          </div>

          {/* Mobile instructions */}
          {activeTab === "mobile" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Android/Chrome */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <Chrome className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Android (Chrome)
                    </h3>
                    <p className="text-sm text-green-700">Recommended ✓</p>
                  </div>
                </div>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    <span>
                      Open Chrome and go to <strong>warehousepos.com</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    <span>
                      Tap the <strong>⋮ menu</strong> (three dots) in the top
                      right
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    <span>
                      Tap <strong>"Install app"</strong> or{" "}
                      <strong>"Add to Home screen"</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      4
                    </span>
                    <span>
                      Tap <strong>"Install"</strong> to confirm
                    </span>
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>✓ Full app experience:</strong> Works offline, home
                    screen icon, no browser bar
                  </p>
                </div>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-all"
                >
                  <Chrome className="w-4 h-4" />
                  Open in Chrome to Install
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* iPhone/Safari */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      iPhone (Safari)
                    </h3>
                    <p className="text-sm text-blue-700">Must use Safari</p>
                  </div>
                </div>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      1
                    </span>
                    <span>
                      Open <strong>Safari</strong> and go to{" "}
                      <strong>warehousepos.com</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      2
                    </span>
                    <span>
                      Tap the <strong>Share button</strong> (square with arrow)
                      at the bottom
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      3
                    </span>
                    <span>
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      4
                    </span>
                    <span>
                      Tap <strong>"Add"</strong> in the top right
                    </span>
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> On iPhone, you must use Safari for
                    the best experience
                  </p>
                </div>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all"
                >
                  <Apple className="w-4 h-4" />
                  Open in Safari to Install
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}

          {/* Desktop instructions */}
          {activeTab === "desktop" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center">
                    <Chrome className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Desktop (Chrome)
                    </h3>
                    <p className="text-sm text-violet-700">
                      Works on Windows, Mac & Linux
                    </p>
                  </div>
                </div>
                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="w-7 h-7 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-medium">Open Google Chrome</span>
                      <p className="text-gray-500 mt-0.5">
                        Make sure you're using Chrome, not Edge or Firefox
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-7 h-7 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-medium">
                        Go to warehousepos.com
                      </span>
                      <p className="text-gray-500 mt-0.5">
                        Type the URL in the address bar
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-7 h-7 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-medium">
                        Click the install icon in the address bar
                      </span>
                      <p className="text-gray-500 mt-0.5">
                        Look for the ⊕ or computer icon on the right side of the
                        URL bar
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-7 h-7 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      4
                    </span>
                    <div>
                      <span className="font-medium">
                        Click "Install" to confirm
                      </span>
                      <p className="text-gray-500 mt-0.5">
                        The app will be added to your desktop and start menu
                      </p>
                    </div>
                  </li>
                </ol>
                <div className="mt-6 p-4 bg-violet-100 rounded-lg">
                  <p className="text-sm text-violet-800">
                    <strong>💡 Tip:</strong> After installing, you can launch
                    Warehouse from your desktop like any other app - no need to
                    open Chrome!
                  </p>
                </div>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all"
                >
                  <Chrome className="w-5 h-5" />
                  Open in Chrome to Install
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

// Why install section
function WhyInstallSection() {
  const benefits = [
    {
      icon: WifiOff,
      title: "Works Offline",
      description:
        "Make sales even without internet. Data syncs when you're back online.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Loads instantly from your device. No waiting for pages to load.",
    },
    {
      icon: Smartphone,
      title: "Full Screen",
      description: "No browser bar taking up space. Uses your whole screen.",
    },
    {
      icon: Download,
      title: "Home Screen Icon",
      description:
        "Quick access from your home screen or desktop. One tap to open.",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why Install the App?
            </h2>
            <p className="text-gray-600">
              Get a better experience than using the website in a browser
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Still want help? Contact form
function ContactSection() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Need Help Getting Started?
            </h2>
            <p className="text-gray-600">
              Our team is here to help. Send us a message and we'll get back to
              you within 24 hours.
            </p>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Message Received!
              </h3>
              <p className="text-gray-600">
                We'll get back to you within 24 hours. Check your email for
                updates.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
            >
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) =>
                      setFormState({ ...formState, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    WhatsApp Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+233 XX XXX XXXX"
                    value={formState.phone}
                    onChange={(e) =>
                      setFormState({ ...formState, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) =>
                    setFormState({ ...formState, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  How can we help?
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formState.message}
                  onChange={(e) =>
                    setFormState({ ...formState, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-white"
                  placeholder="Tell us about your business and what you need help with..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Or WhatsApp us directly at{" "}
                <a
                  href="https://wa.me/233200000000"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  +233 20 000 0000
                </a>
              </p>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}

// Main Demo Page
export function DemoPage() {
  return (
    <div>
      <HeroSection />
      <InstallInstructions />
      <WhyInstallSection />
      <ContactSection />
    </div>
  );
}

export default DemoPage;
