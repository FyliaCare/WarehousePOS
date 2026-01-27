import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Zap,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { trackSignup } from "../lib/analytics";

// Generate a URL-friendly slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

// Sign Up Form
function SignUpForm() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const fullName = `${formState.firstName} ${formState.lastName}`.trim();
      const slug = generateSlug(formState.companyName);

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formState.email,
        password: formState.password,
        options: {
          data: {
            full_name: fullName,
            company_name: formState.companyName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // 2. Create the tenant (business/organization)
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: formState.companyName,
          slug: `${slug}-${Date.now().toString(36)}`, // Ensure unique slug
          settings: {
            currency: "GHS",
            timezone: "Africa/Accra",
          },
          subscription_tier: "free",
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Tenant creation error:", tenantError);
        // If tenant creation fails, still show success - user can be linked later
        // The auth user is created successfully
      }

      // 3. Create the user profile linked to tenant
      if (tenantData) {
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          tenant_id: tenantData.id,
          email: formState.email,
          name: fullName,
          full_name: fullName, // Dashboard uses full_name for display
          role: "owner", // First user is the owner
          is_active: true,
        });

        if (userError) {
          console.error("User profile creation error:", userError);
          // Still show success - the auth user exists
        }

        // 4. Create a default store for the tenant
        const { error: storeError } = await supabase.from("stores").insert({
          tenant_id: tenantData.id,
          name: "Main Store",
          is_active: true,
        });

        if (storeError) {
          console.error("Default store creation error:", storeError);
        }
      }

      // Track successful signup
      trackSignup({ company: formState.companyName });

      setStep("success");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(
        err.message || "An error occurred during signup. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: formState.password.length >= 8 },
    { text: "Contains a number", met: /\d/.test(formState.password) },
    {
      text: "Contains uppercase letter",
      met: /[A-Z]/.test(formState.password),
    },
  ];

  if (step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Warehouse!
        </h2>
        <p className="text-gray-600 mb-6">
          Your account has been created successfully. Please check your email to
          verify your account, then you can sign in.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all"
        >
          Go to Login
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-gray-500 mt-6">
          Didn't receive the email?{" "}
          <button
            onClick={async () => {
              await supabase.auth.resend({
                type: "signup",
                email: formState.email,
              });
              alert("Verification email resent!");
            }}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Resend verification
          </button>
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="firstName"
              type="text"
              required
              value={formState.firstName}
              onChange={(e) =>
                setFormState({ ...formState, firstName: e.target.value })
              }
              placeholder="John"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={formState.lastName}
            onChange={(e) =>
              setFormState({ ...formState, lastName: e.target.value })
            }
            placeholder="Doe"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Work Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="email"
            type="email"
            required
            value={formState.email}
            onChange={(e) =>
              setFormState({ ...formState, email: e.target.value })
            }
            placeholder="john@company.com"
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label
          htmlFor="companyName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Company Name
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="companyName"
            type="text"
            required
            value={formState.companyName}
            onChange={(e) =>
              setFormState({ ...formState, companyName: e.target.value })
            }
            placeholder="Acme Inc"
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={formState.password}
            onChange={(e) =>
              setFormState({ ...formState, password: e.target.value })
            }
            placeholder="••••••••"
            className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Password Requirements */}
        {formState.password && (
          <div className="mt-3 space-y-1">
            {passwordRequirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  req.met ? "text-green-600" : "text-gray-400"
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${req.met ? "opacity-100" : "opacity-40"}`}
                />
                {req.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terms Agreement */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={formState.agreedToTerms}
            onChange={(e) =>
              setFormState({ ...formState, agreedToTerms: e.target.checked })
            }
            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
          />
          <span className="text-sm text-gray-600">
            I agree to the{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-700">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formState.agreedToTerms}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Social Sign Up */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="w-full py-3 bg-[#24292F] text-white font-medium rounded-xl hover:bg-[#1a1f24] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>
    </form>
  );
}

// Main Sign Up Page
export function SignUpPage() {
  const benefits = [
    { icon: Clock, text: "7-day free trial" },
    { icon: Shield, text: "Cancel anytime during trial" },
    { icon: Zap, text: "Set up in 5 minutes" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden lg:block"
            >
              <Link to="/" className="inline-flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Warehouse
                </span>
              </Link>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Start your free trial today
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of businesses that use Warehouse to manage their
                operations efficiently. Get started in minutes.
              </p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-gray-700">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-600 italic mb-4">
                  "Warehouse has completely transformed how we manage our
                  business. The time we've saved is incredible."
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop"
                    alt="Customer"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Sarah Chen</p>
                    <p className="text-sm text-gray-500">CEO, TechRetail Inc</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Mobile Logo */}
                <div className="lg:hidden text-center mb-6">
                  <Link to="/" className="inline-flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      Warehouse
                    </span>
                  </Link>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create your account
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <SignUpForm />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
