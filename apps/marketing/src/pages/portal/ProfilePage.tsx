import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  User,
  Mail,
  Building,
  MapPin,
  Save,
  Check,
  Camera,
  Shield,
  Bell,
  Smartphone,
  Globe,
  Key,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Trash2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  Calendar,
  BadgeCheck,
  Clock,
  Settings,
  CreditCard,
  FileText,
  Download,
  ExternalLink,
  Palette,
  Monitor,
  Moon,
  Sun,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  business_name?: string;
  business_address?: string;
  avatar_url?: string;
  created_at?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
}

type ActiveTab = "profile" | "security" | "notifications" | "preferences";

// ============================================
// COMPONENTS
// ============================================

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left ${
        active
          ? "bg-violet-100 text-violet-700 font-medium"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon
        className={`w-5 h-5 ${active ? "text-violet-600" : "text-gray-400"}`}
      />
      <span>{label}</span>
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  action,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            danger ? "bg-red-100" : "bg-gray-100"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${danger ? "text-red-600" : "text-gray-600"}`}
          />
        </div>
        <div>
          <p
            className={`font-medium ${danger ? "text-red-700" : "text-gray-900"}`}
          >
            {title}
          </p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? "bg-violet-600" : "bg-gray-300"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
          enabled ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
      <CheckCircle className="w-3 h-3" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
      <XCircle className="w-3 h-3" />
      Not Verified
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProfilePage() {
  const { user: contextUser } = useOutletContext<{ user: any }>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile>({
    id: contextUser?.id || "",
    email: contextUser?.email || "",
    full_name: contextUser?.full_name || contextUser?.name || "",
    phone: contextUser?.phone || "",
    business_name: contextUser?.business_name || "",
    business_address: contextUser?.business_address || "",
    avatar_url: contextUser?.avatar_url || "",
    created_at: contextUser?.created_at || "",
    email_verified: true,
    phone_verified: !!contextUser?.phone,
    two_factor_enabled: false,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email_marketing: true,
    email_updates: true,
    email_security: true,
    push_sales: true,
    push_inventory: true,
    push_support: true,
    sms_alerts: false,
    weekly_report: true,
  });

  const [preferences, setPreferences] = useState({
    theme: "system" as "light" | "dark" | "system",
    language: "en",
    timezone: "Africa/Accra",
    currency: "GHS",
    dateFormat: "DD/MM/YYYY",
  });

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(filePath);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));

      // Update in database
      await supabase
        .from("profiles")
        .upsert({ id: profile.id, avatar_url: publicUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Also update profiles table
      await supabase.from("profiles").upsert({
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert("Passwords don't match");
      return;
    }
    if (passwords.new.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setPasswords({ current: "", new: "", confirm: "" });
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNC0yIDAtNCAwLTQgMi00IDItNCAyLTQgNC0yIDQtMiAyLTQgNC0yIDQgMCA0LTIgNC0yIDQgMCAyLTIgNGgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold">
                  {getInitials(profile.full_name || profile.email)}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">
                {profile.full_name || "Set Your Name"}
              </h1>
              {profile.email_verified && (
                <BadgeCheck className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <p className="text-violet-200 mb-3">{profile.email}</p>
            <div className="flex items-center gap-4 text-sm text-violet-200">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Member since {formatDate(profile.created_at)}
              </span>
              {profile.business_name && (
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {profile.business_name}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-2xl font-bold">Pro</p>
              <p className="text-xs text-violet-200">Plan</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-2xl font-bold">847</p>
              <p className="text-xs text-violet-200">Credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1 sticky top-6">
            <TabButton
              active={activeTab === "profile"}
              icon={User}
              label="Personal Info"
              onClick={() => setActiveTab("profile")}
            />
            <TabButton
              active={activeTab === "security"}
              icon={Shield}
              label="Security"
              onClick={() => setActiveTab("security")}
            />
            <TabButton
              active={activeTab === "notifications"}
              icon={Bell}
              label="Notifications"
              onClick={() => setActiveTab("notifications")}
            />
            <TabButton
              active={activeTab === "preferences"}
              icon={Settings}
              label="Preferences"
              onClick={() => setActiveTab("preferences")}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* ==================== PROFILE TAB ==================== */}
          {activeTab === "profile" && (
            <>
              {/* Personal Information */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update your personal details here
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Enter your name"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          placeholder="+233 XX XXX XXXX"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full pl-12 pr-20 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <VerificationBadge
                          verified={profile.email_verified || false}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Business Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Details about your business
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.business_name}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            business_name: e.target.value,
                          })
                        }
                        placeholder="Your business name"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        value={profile.business_address}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            business_address: e.target.value,
                          })
                        }
                        placeholder="Enter your business address"
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      Saved!
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ==================== SECURITY TAB ==================== */}
          {activeTab === "security" && (
            <>
              {/* Password Section */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Change Password
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update your password to keep your account secure
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            current: e.target.value,
                          })
                        }
                        placeholder="Enter current password"
                        className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwords.new}
                          onChange={(e) =>
                            setPasswords({ ...passwords, new: e.target.value })
                          }
                          placeholder="Enter new password"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={passwords.confirm}
                          onChange={(e) =>
                            setPasswords({
                              ...passwords,
                              confirm: e.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !passwords.current ||
                      !passwords.new ||
                      !passwords.confirm
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Security Settings
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage your account security
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <SettingRow
                    icon={Smartphone}
                    title="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                    action={
                      <Toggle
                        enabled={profile.two_factor_enabled || false}
                        onChange={(value) =>
                          setProfile({ ...profile, two_factor_enabled: value })
                        }
                      />
                    }
                  />
                  <SettingRow
                    icon={Globe}
                    title="Login History"
                    description="View your recent login activity"
                    action={
                      <button className="flex items-center gap-1 text-violet-600 font-medium text-sm hover:text-violet-700">
                        View <ChevronRight className="w-4 h-4" />
                      </button>
                    }
                  />
                  <SettingRow
                    icon={Key}
                    title="Active Sessions"
                    description="Manage devices where you're logged in"
                    action={
                      <button className="flex items-center gap-1 text-violet-600 font-medium text-sm hover:text-violet-700">
                        Manage <ChevronRight className="w-4 h-4" />
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
                <div className="p-6 border-b border-red-100 bg-red-50">
                  <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </h2>
                  <p className="text-sm text-red-600">
                    Irreversible and destructive actions
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <SettingRow
                    icon={LogOut}
                    title="Sign out all devices"
                    description="Sign out of all other active sessions"
                    danger
                    action={
                      <button className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors text-sm">
                        Sign Out All
                      </button>
                    }
                  />
                  <SettingRow
                    icon={Trash2}
                    title="Delete Account"
                    description="Permanently delete your account and all data"
                    danger
                    action={
                      <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm">
                        Delete Account
                      </button>
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* ==================== NOTIFICATIONS TAB ==================== */}
          {activeTab === "notifications" && (
            <>
              {/* Email Notifications */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-violet-600" />
                    Email Notifications
                  </h2>
                  <p className="text-sm text-gray-500">
                    Choose what emails you want to receive
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <SettingRow
                    icon={Bell}
                    title="Marketing & Promotions"
                    description="Receive news about new features and special offers"
                    action={
                      <Toggle
                        enabled={notifications.email_marketing}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            email_marketing: value,
                          })
                        }
                      />
                    }
                  />
                  <SettingRow
                    icon={FileText}
                    title="Product Updates"
                    description="Get notified about new features and improvements"
                    action={
                      <Toggle
                        enabled={notifications.email_updates}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            email_updates: value,
                          })
                        }
                      />
                    }
                  />
                  <SettingRow
                    icon={Shield}
                    title="Security Alerts"
                    description="Important security notifications"
                    action={
                      <Toggle
                        enabled={notifications.email_security}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            email_security: value,
                          })
                        }
                      />
                    }
                  />
                  <SettingRow
                    icon={Clock}
                    title="Weekly Reports"
                    description="Receive a weekly summary of your business"
                    action={
                      <Toggle
                        enabled={notifications.weekly_report}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            weekly_report: value,
                          })
                        }
                      />
                    }
                  />
                </div>
              </div>

              {/* Push Notifications */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-violet-600" />
                    Push Notifications
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage mobile and desktop notifications
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <SettingRow
                    icon={CreditCard}
                    title="Sales Alerts"
                    description="Get notified when a sale is made"
                    action={
                      <Toggle
                        enabled={notifications.push_sales}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            push_sales: value,
                          })
                        }
                      />
                    }
                  />
                  <SettingRow
                    icon={AlertTriangle}
                    title="Low Stock Alerts"
                    description="Notifications when inventory is running low"
                    action={
                      <Toggle
                        enabled={notifications.push_inventory}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            push_inventory: value,
                          })
                        }
                      />
                    }
                  />
                  <SettingRow
                    icon={MessageSquare}
                    title="Support Replies"
                    description="Get notified when support responds"
                    action={
                      <Toggle
                        enabled={notifications.push_support}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            push_support: value,
                          })
                        }
                      />
                    }
                  />
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-violet-600" />
                    SMS Notifications
                  </h2>
                  <p className="text-sm text-gray-500">
                    Receive important alerts via SMS
                  </p>
                </div>
                <div className="p-6">
                  <SettingRow
                    icon={AlertTriangle}
                    title="Critical Alerts Only"
                    description="Receive SMS only for critical account issues"
                    action={
                      <Toggle
                        enabled={notifications.sms_alerts}
                        onChange={(value) =>
                          setNotifications({
                            ...notifications,
                            sms_alerts: value,
                          })
                        }
                      />
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* ==================== PREFERENCES TAB ==================== */}
          {activeTab === "preferences" && (
            <>
              {/* Appearance */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    Appearance
                  </h2>
                  <p className="text-sm text-gray-500">
                    Customize how the app looks
                  </p>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            theme: theme.id as "light" | "dark" | "system",
                          })
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          preferences.theme === theme.id
                            ? "border-violet-500 bg-violet-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <theme.icon
                          className={`w-6 h-6 ${
                            preferences.theme === theme.id
                              ? "text-violet-600"
                              : "text-gray-500"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            preferences.theme === theme.id
                              ? "text-violet-700"
                              : "text-gray-700"
                          }`}
                        >
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Regional Settings */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-violet-600" />
                    Regional Settings
                  </h2>
                  <p className="text-sm text-gray-500">
                    Configure your locale preferences
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            language: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      >
                        <option value="Africa/Accra">Africa/Accra (GMT)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Nairobi">
                          Africa/Nairobi (EAT)
                        </option>
                        <option value="Europe/London">
                          Europe/London (GMT/BST)
                        </option>
                        <option value="America/New_York">
                          America/New York (EST)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={preferences.currency}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            currency: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      >
                        <option value="GHS">🇬🇭 GHS - Ghana Cedi</option>
                        <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
                        <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                        <option value="USD">🇺🇸 USD - US Dollar</option>
                        <option value="EUR">🇪🇺 EUR - Euro</option>
                        <option value="GBP">🇬🇧 GBP - British Pound</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        value={preferences.dateFormat}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            dateFormat: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Privacy */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Download className="w-5 h-5 text-violet-600" />
                    Data & Privacy
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage your data and privacy settings
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <SettingRow
                    icon={Download}
                    title="Export Your Data"
                    description="Download a copy of all your data"
                    action={
                      <button className="flex items-center gap-1 text-violet-600 font-medium text-sm hover:text-violet-700">
                        Export <ExternalLink className="w-4 h-4" />
                      </button>
                    }
                  />
                  <SettingRow
                    icon={FileText}
                    title="Privacy Policy"
                    description="Read our privacy policy"
                    action={
                      <button className="flex items-center gap-1 text-violet-600 font-medium text-sm hover:text-violet-700">
                        View <ExternalLink className="w-4 h-4" />
                      </button>
                    }
                  />
                  <SettingRow
                    icon={Shield}
                    title="Terms of Service"
                    description="Read our terms of service"
                    action={
                      <button className="flex items-center gap-1 text-violet-600 font-medium text-sm hover:text-violet-700">
                        View <ExternalLink className="w-4 h-4" />
                      </button>
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
