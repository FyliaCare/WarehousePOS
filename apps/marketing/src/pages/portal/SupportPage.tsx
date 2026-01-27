import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  HeadphonesIcon,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Search,
  HelpCircle,
  BookOpen,
  FileText,
  Phone,
  Mail,
  Plus,
  ArrowLeft,
  Paperclip,
  X,
  RefreshCw,
  User,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Zap,
  Shield,
  CreditCard,
  Settings,
  Package,
  Smartphone,
  Star,
  ThumbsUp,
  SlidersHorizontal,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "waiting_internal"
  | "resolved"
  | "closed"
  | "cancelled";

type TicketPriority = "low" | "medium" | "high" | "urgent";

type TicketCategory =
  | "billing"
  | "technical"
  | "feature_request"
  | "bug_report"
  | "account"
  | "integration"
  | "general"
  | "urgent";

interface SupportTicket {
  id: string;
  ticket_number: string;
  tenant_id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  first_response_at: string | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  assigned_admin?: {
    id: string;
    name: string;
    avatar_url?: string;
  } | null;
  messages_count?: number;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "customer" | "admin" | "system";
  admin_id: string | null;
  user_email: string | null;
  user_name: string | null;
  message: string;
  is_internal: boolean;
  attachments: { name: string; url: string; size: number; type: string }[];
  created_at: string;
  admin?: {
    name: string;
    avatar_url?: string;
  } | null;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ElementType;
}

interface NewTicketForm {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
}

// ============================================
// FAQ DATA
// ============================================

const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "How do I change my subscription plan?",
    answer:
      "Go to the Subscription page in your portal and click 'Upgrade' or 'Change Plan'. You can switch plans anytime, and the billing will be prorated automatically.",
    category: "Billing",
    icon: CreditCard,
  },
  {
    id: "faq-2",
    question: "How do SMS/WhatsApp credits work?",
    answer:
      "Your plan includes monthly credits that refresh every billing cycle. SMS uses 1 credit per message, WhatsApp uses 3 credits. You can purchase additional credit packs from the Credits page anytime.",
    category: "Credits",
    icon: MessageCircle,
  },
  {
    id: "faq-3",
    question: "Can I use Warehouse POS offline?",
    answer:
      "Yes! Our mobile app supports full offline mode. Sales are stored locally and automatically sync when you're back online. No internet? No problem!",
    category: "Features",
    icon: Smartphone,
  },
  {
    id: "faq-4",
    question: "How do I add team members?",
    answer:
      "Go to Settings > Team in your POS app. Click 'Add Staff' and enter their email. They'll receive an invitation to join your store with customizable permissions.",
    category: "Features",
    icon: User,
  },
  {
    id: "faq-5",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit/debit cards, mobile money (MTN, Vodafone, AirtelTigo), and bank transfers for yearly plans. All payments are securely processed through Paystack.",
    category: "Billing",
    icon: CreditCard,
  },
  {
    id: "faq-6",
    question: "How do I cancel my subscription?",
    answer:
      "Go to the Subscription page and click 'Cancel Plan'. Your access will continue until the end of your current billing period. You can reactivate anytime.",
    category: "Billing",
    icon: Settings,
  },
  {
    id: "faq-7",
    question: "How do I export my data?",
    answer:
      "Go to Reports in your POS app. Select the report type and date range, then click 'Export' to download as PDF or Excel. You can export sales, inventory, and customer data.",
    category: "Features",
    icon: FileText,
  },
  {
    id: "faq-8",
    question: "Is my data secure?",
    answer:
      "Absolutely! We use bank-level encryption (256-bit SSL), secure data centers with daily backups, and strict access controls. Your data is fully protected and never shared with third parties.",
    category: "Security",
    icon: Shield,
  },
  {
    id: "faq-9",
    question: "How do I set up inventory alerts?",
    answer:
      "In your POS app, go to Inventory > Settings. Set minimum stock levels for each product. You'll receive notifications when stock falls below your threshold.",
    category: "Features",
    icon: Package,
  },
  {
    id: "faq-10",
    question: "Can I integrate with other services?",
    answer:
      "Yes! We offer integrations with popular accounting software, e-commerce platforms, and delivery services. Check the Integrations page or contact support for custom integrations.",
    category: "Features",
    icon: Zap,
  },
];

const faqCategories = ["All", "Billing", "Features", "Credits", "Security"];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateTicketNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `TKT-${dateStr}-${random}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

// ============================================
// COMPONENTS
// ============================================

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<
    TicketStatus,
    { label: string; className: string; icon: React.ElementType }
  > = {
    open: {
      label: "Open",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertCircle,
    },
    in_progress: {
      label: "In Progress",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: RefreshCw,
    },
    waiting_customer: {
      label: "Awaiting Reply",
      className: "bg-purple-50 text-purple-700 border-purple-200",
      icon: Clock,
    },
    waiting_internal: {
      label: "Under Review",
      className: "bg-orange-50 text-orange-700 border-orange-200",
      icon: Clock,
    },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
    },
    closed: {
      label: "Closed",
      className: "bg-gray-50 text-gray-600 border-gray-200",
      icon: XCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-50 text-gray-500 border-gray-200",
      icon: XCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config: Record<
    TicketPriority,
    { label: string; className: string; dot: string }
  > = {
    low: { label: "Low", className: "text-gray-600", dot: "bg-gray-400" },
    medium: { label: "Medium", className: "text-blue-600", dot: "bg-blue-500" },
    high: { label: "High", className: "text-orange-600", dot: "bg-orange-500" },
    urgent: { label: "Urgent", className: "text-red-600", dot: "bg-red-500" },
  };

  const { label, className, dot } = config[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function TicketCard({
  ticket,
  onClick,
  isSelected,
}: {
  ticket: SupportTicket;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const categoryEmoji: Record<TicketCategory, string> = {
    billing: "💳",
    technical: "🔧",
    feature_request: "💡",
    bug_report: "🐛",
    account: "👤",
    integration: "🔗",
    general: "💬",
    urgent: "🚨",
  };

  return (
    <div
      onClick={onClick}
      className={`group p-4 cursor-pointer transition-all border-b last:border-b-0 ${
        isSelected
          ? "bg-violet-50 border-l-4 border-l-violet-500"
          : "hover:bg-gray-50 border-l-4 border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{categoryEmoji[ticket.category]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
            {ticket.subject}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
            {ticket.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <PriorityBadge priority={ticket.priority} />
            <span>·</span>
            <span>{formatRelativeTime(ticket.updated_at)}</span>
            {ticket.assigned_admin && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  {ticket.assigned_admin.name.split(" ")[0]}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isLastCustomer,
}: {
  message: TicketMessage;
  isLastCustomer?: boolean;
}) {
  const isCustomer = message.sender_type === "customer";
  const isSystem = message.sender_type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-gray-100 text-gray-500 text-xs px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          {message.message}
        </div>
      </div>
    );
  }

  const senderName = isCustomer
    ? message.user_name || "You"
    : message.admin?.name || "Support Team";

  return (
    <div className={`flex gap-3 ${isCustomer ? "flex-row-reverse" : ""} mb-4`}>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg ${
          isCustomer
            ? "bg-gradient-to-br from-violet-500 to-purple-600"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        }`}
      >
        {isCustomer ? "You".charAt(0) : "S"}
      </div>
      <div className={`max-w-[75%] ${isCustomer ? "text-right" : ""}`}>
        <div
          className={`flex items-center gap-2 mb-1.5 ${isCustomer ? "justify-end" : ""}`}
        >
          <span className="font-medium text-sm text-gray-900">
            {senderName}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.created_at)}
          </span>
        </div>
        <div
          className={`p-4 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${
            isCustomer
              ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-md"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
          }`}
        >
          {message.message}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div
            className={`mt-2 flex flex-wrap gap-2 ${isCustomer ? "justify-end" : ""}`}
          >
            {message.attachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Paperclip className="w-3 h-3" />
                {att.name}
              </a>
            ))}
          </div>
        )}
        {isLastCustomer && isCustomer && (
          <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-400">
            <CheckCircle2 className="w-3 h-3" />
            Sent
          </div>
        )}
      </div>
    </div>
  );
}

function QuickContactCard({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  color: string;
}) {
  return (
    <a
      href={action}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
    >
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <span className="text-sm font-medium text-violet-600 group-hover:text-violet-700 flex items-center gap-1">
        {actionLabel}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </span>
    </a>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SupportPage() {
  // State
  const [activeTab, setActiveTab] = useState<"tickets" | "faq" | "contact">(
    "tickets",
  );
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [faqCategory, setFaqCategory] = useState("All");
  const [newMessage, setNewMessage] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">(
    "all",
  );
  const [newTicketForm, setNewTicketForm] = useState<NewTicketForm>({
    subject: "",
    category: "general",
    priority: "medium",
    description: "",
  });
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user and tenant
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || "" });

        // Get tenant ID from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_tenant_id")
          .eq("id", user.id)
          .single();

        if (profile?.current_tenant_id) {
          setTenantId(profile.current_tenant_id);
        } else {
          // Fallback: try to get from users table
          const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

          if (userData?.tenant_id) {
            setTenantId(userData.tenant_id);
          }
        }
      }
      setIsLoading(false);
    };
    getUser();
  }, []);

  // Fetch tickets
  useEffect(() => {
    if (!tenantId) return;

    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from("support_tickets")
          .select(
            `
            *,
            assigned_admin:admin_users!support_tickets_assigned_to_fkey(id, name, avatar_url)
          `,
          )
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      }
    };

    fetchTickets();

    // Real-time subscription
    const subscription = supabase
      .channel("support_tickets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchTickets();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tenantId]);

  // Fetch messages
  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("support_ticket_messages")
          .select(`*, admin:admin_users(name, avatar_url)`)
          .eq("ticket_id", selectedTicket.id)
          .eq("is_internal", false)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`ticket_messages_${selectedTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_ticket_messages",
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        () => {
          fetchMessages();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedTicket]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create ticket
  const handleCreateTicket = async () => {
    if (
      !user ||
      !tenantId ||
      !newTicketForm.subject.trim() ||
      !newTicketForm.description.trim()
    ) {
      return;
    }

    setIsCreating(true);
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          ticket_number: generateTicketNumber(),
          tenant_id: tenantId,
          user_id: user.id,
          user_email: user.email,
          subject: newTicketForm.subject.trim(),
          description: newTicketForm.description.trim(),
          category: newTicketForm.category,
          priority: newTicketForm.priority,
          status: "open",
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        sender_type: "customer",
        user_email: user.email,
        message: newTicketForm.description.trim(),
      });

      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        sender_type: "system",
        message:
          "Ticket created. Our support team typically responds within 2 hours.",
      });

      setNewTicketForm({
        subject: "",
        category: "general",
        priority: "medium",
        description: "",
      });
      setShowNewTicket(false);

      // Refresh tickets
      const { data: updatedTickets } = await supabase
        .from("support_tickets")
        .select(
          `*, assigned_admin:admin_users!support_tickets_assigned_to_fkey(id, name, avatar_url)`,
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      setTickets(updatedTickets || []);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert("Failed to create ticket. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!selectedTicket || !user || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_type: "customer",
        user_email: user.email,
        message: newMessage.trim(),
      });

      if (selectedTicket.status === "waiting_customer") {
        await supabase
          .from("support_tickets")
          .update({ status: "open", updated_at: new Date().toISOString() })
          .eq("id", selectedTicket.id);
      } else {
        await supabase
          .from("support_tickets")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", selectedTicket.id);
      }

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Filtered data
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "open") {
      return [
        "open",
        "in_progress",
        "waiting_customer",
        "waiting_internal",
      ].includes(t.status);
    }
    if (statusFilter === "resolved") {
      return ["resolved", "closed"].includes(t.status);
    }
    return true;
  });

  const filteredFAQ = faqItems.filter((item) => {
    const matchesCategory =
      faqCategory === "All" || item.category === faqCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Stats
  const openCount = tickets.filter((t) =>
    ["open", "in_progress", "waiting_internal"].includes(t.status),
  ).length;
  const awaitingCount = tickets.filter(
    (t) => t.status === "waiting_customer",
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  // ==========================================
  // TICKET DETAIL VIEW
  // ==========================================
  if (selectedTicket) {
    const canReply = !["closed", "cancelled", "resolved"].includes(
      selectedTicket.status,
    );
    const lastCustomerMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.sender_type === "customer");

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedTicket(null)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tickets
        </button>

        {/* Ticket Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                    {selectedTicket.ticket_number}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                  <PriorityBadge priority={selectedTicket.priority} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedTicket.subject}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {selectedTicket.category.replace("_", " ")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Created {formatDate(selectedTicket.created_at)}
                  </span>
                  {selectedTicket.assigned_admin && (
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      {selectedTicket.assigned_admin.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedTicket.sla_breached && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                This ticket has exceeded the expected response time. We
                apologize and will prioritize your request.
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="bg-gradient-to-b from-gray-50 to-white">
            {isLoadingMessages ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading conversation...</p>
              </div>
            ) : (
              <div className="p-6 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 py-12">
                    No messages yet.
                  </p>
                ) : (
                  messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isLastCustomer={
                        message.sender_type === "customer" &&
                        index === messages.length - 1 - lastCustomerMessageIndex
                      }
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Reply Input */}
          {canReply ? (
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-sm"
                    disabled={isSending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-400">
                        Press Ctrl+Enter to send
                      </span>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">
                  This ticket has been {selectedTicket.status}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setShowNewTicket(true);
                }}
                className="text-violet-600 hover:text-violet-700 font-medium text-sm"
              >
                Create a new ticket if you need further assistance →
              </button>
            </div>
          )}
        </div>

        {/* Satisfaction Rating (for resolved tickets) */}
        {selectedTicket.status === "resolved" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <Star className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">
              How was your experience?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Your feedback helps us improve
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center justify-center text-lg"
                >
                  {rating <= 2
                    ? "😞"
                    : rating === 3
                      ? "😐"
                      : rating === 4
                        ? "😊"
                        : "😍"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // MAIN LIST VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNC0yIDAtNCAwLTQgMi00IDItNCAyLTQgNC0yIDQtMiAyLTQgNC0yIDQgMCA0LTIgNC0yIDQgMCAyLTIgNGgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <HeadphonesIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Support Center</h1>
          </div>
          <p className="text-violet-100 mb-6">
            We're here to help you succeed with Warehouse
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowNewTicket(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Avg response: 2 hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Open</p>
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Awaiting Reply</p>
              <p className="text-2xl font-bold text-gray-900">
                {awaitingCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {resolvedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          {
            id: "tickets",
            label: "My Tickets",
            icon: MessageSquare,
            count: tickets.length,
          },
          { id: "faq", label: "FAQ", icon: HelpCircle },
          { id: "contact", label: "Contact Us", icon: Phone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white text-violet-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? "bg-violet-100 text-violet-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filter:</span>
              {["all", "open", "resolved"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter as typeof statusFilter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === filter
                      ? "bg-violet-100 text-violet-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {filteredTickets.length} ticket
              {filteredTickets.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-3" />
              <p className="text-gray-500">Loading your tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-violet-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                {statusFilter === "all"
                  ? "No tickets yet"
                  : `No ${statusFilter} tickets`}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {statusFilter === "all"
                  ? "Have a question or need help? Create a ticket and our team will assist you."
                  : `You don't have any ${statusFilter} tickets at the moment.`}
              </p>
              {statusFilter === "all" && (
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200"
                >
                  Create Your First Ticket
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          {/* Search & Categories */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                    faqCategory === cat
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQ.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No matching questions found</p>
              </div>
            ) : (
              filteredFAQ.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedFaq === item.id;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border transition-all ${
                      isExpanded
                        ? "border-violet-200 shadow-lg"
                        : "border-gray-100 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedFaq(isExpanded ? null : item.id)
                      }
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isExpanded ? "bg-violet-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isExpanded ? "text-violet-600" : "text-gray-500"}`}
                        />
                      </div>
                      <span className="flex-1 font-medium text-gray-900">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5">
                        <div className="pl-14 text-gray-600 text-sm leading-relaxed">
                          {item.answer}
                        </div>
                        <div className="pl-14 mt-4 flex items-center gap-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            {item.category}
                          </span>
                          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors">
                            <ThumbsUp className="w-3 h-3" />
                            Helpful?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Still Need Help */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-6 text-center">
            <HeadphonesIcon className="w-12 h-12 text-violet-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Can't find what you're looking for?
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Our support team is ready to help
            </p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="space-y-6">
          {/* Quick Contact Options */}
          <div className="grid sm:grid-cols-3 gap-4">
            <QuickContactCard
              icon={MessageCircle}
              title="WhatsApp"
              description="Chat with us instantly"
              action="https://wa.me/233200000000"
              actionLabel="Start Chat"
              color="bg-gradient-to-br from-emerald-500 to-green-600"
            />
            <QuickContactCard
              icon={Mail}
              title="Email"
              description="Get a response within 24h"
              action="mailto:support@warehouse.com"
              actionLabel="Send Email"
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <QuickContactCard
              icon={Phone}
              title="Phone"
              description="Mon-Fri, 9AM-6PM GMT"
              action="tel:+233200000000"
              actionLabel="Call Now"
              color="bg-gradient-to-br from-violet-500 to-purple-600"
            />
          </div>

          {/* Support Hours */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-600" />
              Support Hours
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium text-gray-900">
                  9:00 AM - 6:00 PM
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium text-gray-900">
                  10:00 AM - 2:00 PM
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium text-gray-500">Closed</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-emerald-700">Emergency Support</span>
                <span className="font-medium text-emerald-700">
                  24/7 for Pro plans
                </span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">
              Helpful Resources
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <a
                href="#"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <BookOpen className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                    Documentation
                  </p>
                  <p className="text-xs text-gray-500">
                    Detailed guides & tutorials
                  </p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <FileText className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                    API Reference
                  </p>
                  <p className="text-xs text-gray-500">For developers</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <Star className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                    What's New
                  </p>
                  <p className="text-xs text-gray-500">
                    Latest features & updates
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Create Ticket CTA */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white text-center">
            <h3 className="font-semibold text-xl mb-2">
              Need personalized help?
            </h3>
            <p className="text-violet-100 mb-4">
              Create a support ticket and we'll get back to you ASAP
            </p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="px-6 py-3 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg"
            >
              Create Support Ticket
            </button>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Create Support Ticket
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  We typically respond within 2 hours
                </p>
              </div>
              <button
                onClick={() => setShowNewTicket(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) =>
                    setNewTicketForm({
                      ...newTicketForm,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        category: e.target.value as TicketCategory,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="general">💬 General</option>
                    <option value="technical">🔧 Technical Issue</option>
                    <option value="billing">💳 Billing</option>
                    <option value="feature_request">💡 Feature Request</option>
                    <option value="bug_report">🐛 Bug Report</option>
                    <option value="account">👤 Account</option>
                    <option value="integration">🔗 Integration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) =>
                      setNewTicketForm({
                        ...newTicketForm,
                        priority: e.target.value as TicketPriority,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newTicketForm.description}
                  onChange={(e) =>
                    setNewTicketForm({
                      ...newTicketForm,
                      description: e.target.value,
                    })
                  }
                  rows={5}
                  placeholder="Please describe your issue in detail. Include any relevant information like steps to reproduce, error messages, etc."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Quick Tip</p>
                  <p>
                    Check our FAQ section first - your question might already be
                    answered there!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowNewTicket(false)}
                disabled={isCreating}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={
                  isCreating ||
                  !newTicketForm.subject.trim() ||
                  !newTicketForm.description.trim()
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportPage;
