import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

// Types for the training system
export interface TrainingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: "click" | "type" | "observe";
  validation?: () => boolean;
  celebration?: boolean;
}

export interface TrainingLesson {
  id: string;
  title: string;
  description: string;
  emoji: string;
  duration: string;
  steps: TrainingStep[];
  quiz?: QuizQuestion[];
}

export interface TrainingModule {
  id: string;
  number: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  lessons: TrainingLesson[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  emoji?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt?: Date;
  requirement: string;
}

export interface UserProgress {
  completedLessons: string[];
  completedModules: string[];
  currentModule?: string;
  currentLesson?: string;
  currentStep: number;
  xpPoints: number;
  streak: number;
  lastActivityDate?: string;
  achievements: string[];
  quizScores: Record<string, number>;
}

interface TrainingContextType {
  progress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
  isTrainingActive: boolean;
  currentModule: TrainingModule | null;
  currentLesson: TrainingLesson | null;
  currentStepIndex: number;
  startTraining: (moduleId: string, lessonId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeLesson: () => void;
  exitTraining: () => void;
  modules: TrainingModule[];
  getModuleProgress: (moduleId: string) => number;
  isLessonCompleted: (lessonId: string) => boolean;
  achievements: Achievement[];
  unlockAchievement: (achievementId: string) => void;
  addXP: (points: number) => void;
  updateStreak: () => void;
  showSpotlight: boolean;
  setShowSpotlight: (show: boolean) => void;
}

const TrainingContext = createContext<TrainingContextType | undefined>(
  undefined,
);

// Vendor Portal Training Modules - All modules are UNLOCKED (no restrictions)
const TRAINING_MODULES: TrainingModule[] = [
  // Phase 1: Getting Started
  {
    id: "module-1-1",
    number: "1.1",
    title: "Getting Started",
    description:
      "Welcome aboard! Learn to navigate your new superpower - the Warehouse POS system.",
    emoji: "🚀",
    color: "from-blue-500 to-cyan-500",
    difficulty: "beginner",
    estimatedTime: "15-20 min",
    lessons: [
      {
        id: "lesson-1-1-1",
        title: "Welcome to Warehouse! 🎉",
        description:
          "Let's take a quick tour of your new business command center",
        emoji: "👋",
        duration: "3 min",
        steps: [
          {
            id: "step-1",
            title: "Hey there, superstar! 🌟",
            description:
              "Welcome to Warehouse - your all-in-one business management tool! I'm your friendly guide, and I'm SO excited to show you around. Ready for an adventure?",
            position: "center",
            celebration: true,
          },
          {
            id: "step-2",
            title: "Your Command Center 🎮",
            description:
              "This is your Dashboard - think of it as mission control for your business. You can see everything important at a glance: today's sales, popular products, and how your business is doing!",
            position: "center",
          },
          {
            id: "step-3",
            title: "The Magic Menu ✨",
            description:
              "The sidebar is like a treasure map to all the cool features. Click any icon to explore different parts of your business kingdom!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Quick Stats Rock! 📊",
            description:
              "Stats cards show you the important stuff - how much you've sold today, your total products, happy customers, and more. It updates in real-time like magic!",
            position: "center",
          },
          {
            id: "step-5",
            title: "You're a Natural! 🏆",
            description:
              "Amazing! You just completed your first lesson. See? That wasn't scary at all! You earned 50 XP points. Ready for the next adventure?",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question:
              "Where can you see all your important business stats at a glance?",
            options: [
              "The Settings page",
              "The Dashboard",
              "The Products page",
              "The Reports page",
            ],
            correctAnswer: 1,
            explanation:
              "The Dashboard is your command center - it shows all the important stuff like sales, products, and customers!",
            emoji: "🎯",
          },
        ],
      },
      {
        id: "lesson-1-1-2",
        title: "Navigation Ninja 🥷",
        description: "Master the art of moving around the app like a pro",
        emoji: "🧭",
        duration: "4 min",
        steps: [
          {
            id: "step-1",
            title: "Time to Level Up! 🎯",
            description:
              "Now let's learn to navigate like a ninja! Knowing where everything is will make you super fast.",
            position: "center",
          },
          {
            id: "step-2",
            title: "The Sidebar 📱",
            description:
              "Your navigation menu! Each icon represents a different area: Dashboard, POS, Inventory, Customers, and more!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Expandable Menus 📂",
            description:
              "Some menu items have sub-menus. Click to expand and see more options!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Quick Search 🔍",
            description:
              "Press Ctrl+K (or Cmd+K on Mac) to open quick search. Find anything instantly!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Navigation Master! 🏆",
            description: "You can now navigate like a pro! 50 more XP earned!",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "What's the keyboard shortcut for quick search?",
            options: ["Ctrl+S", "Ctrl+F", "Ctrl+K", "Ctrl+P"],
            correctAnswer: 2,
            explanation:
              "Ctrl+K (or Cmd+K on Mac) opens the quick search to find anything fast!",
            emoji: "⌨️",
          },
        ],
      },
    ],
  },

  // Phase 1: Module 1.2 - Inventory Basics
  {
    id: "module-1-2",
    number: "1.2",
    title: "Inventory Basics",
    description:
      "Learn to manage your products like a boss! Add, edit, and organize your inventory.",
    emoji: "📦",
    color: "from-emerald-500 to-teal-500",
    difficulty: "beginner",
    estimatedTime: "20-25 min",
    lessons: [
      {
        id: "lesson-1-2-1",
        title: "Adding Products 🛍️",
        description: "Learn to add your first product to the system",
        emoji: "➕",
        duration: "6 min",
        steps: [
          {
            id: "step-1",
            title: "Time to Stock Up! 📦",
            description:
              "Your store needs products! Let's learn how to add them to your inventory.",
            position: "center",
          },
          {
            id: "step-2",
            title: "Go to Products 🛍️",
            description: "Navigate to Inventory → Products in the sidebar!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Click Add Product ➕",
            description: "Click the 'Add Product' button to start creating!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Product Details 📝",
            description:
              "Fill in: Name, SKU, Category, Price, and Cost. The more details, the better!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Set Stock Quantity 📊",
            description:
              "Enter how many units you have. This updates automatically as you sell!",
            position: "center",
          },
          {
            id: "step-6",
            title: "Product Pro! 🎉",
            description:
              "You can now add products! Your inventory journey has begun! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "What information is essential when adding a product?",
            options: [
              "Just the name",
              "Name, price, and stock quantity",
              "Only the barcode",
              "The supplier email",
            ],
            correctAnswer: 1,
            explanation:
              "At minimum, you need the product name, selling price, and how many you have in stock!",
            emoji: "📋",
          },
        ],
      },
      {
        id: "lesson-1-2-2",
        title: "Categories & Organization 📁",
        description: "Keep your products organized for easy finding",
        emoji: "🗂️",
        duration: "5 min",
        steps: [
          {
            id: "step-1",
            title: "Organization is Key! 🗂️",
            description:
              "Categories help you find products fast. Let's organize!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Create Categories 📁",
            description:
              "Go to Inventory → Categories to create and manage product groups!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Assign Products 🏷️",
            description:
              "When adding products, select their category. You can change it anytime!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Organized Pro! 🎉",
            description:
              "Your products are now organized! Finding things will be a breeze! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why are categories important?",
            options: [
              "They're not important",
              "They help organize products for faster finding",
              "They change the price",
              "They're required by law",
            ],
            correctAnswer: 1,
            explanation:
              "Categories make it easy to find products quickly, especially during busy sales!",
            emoji: "📂",
          },
        ],
      },
    ],
  },

  // Phase 1: Module 1.3 - POS Basics
  {
    id: "module-1-3",
    number: "1.3",
    title: "POS Basics",
    description:
      "Master the Point of Sale! Process sales, apply discounts, and handle payments.",
    emoji: "💰",
    color: "from-violet-500 to-purple-500",
    difficulty: "beginner",
    estimatedTime: "25-30 min",
    lessons: [
      {
        id: "lesson-1-3-1",
        title: "Your First Sale 🛒",
        description: "Learn to process a sale from start to finish",
        emoji: "💳",
        duration: "8 min",
        steps: [
          {
            id: "step-1",
            title: "Let's Make Money! 💰",
            description:
              "The moment you've been waiting for - let's process your first sale!",
            position: "center",
            celebration: true,
          },
          {
            id: "step-2",
            title: "Open the POS 🖥️",
            description:
              "Click POS in the sidebar to open the point of sale screen!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Add Items to Cart 🛒",
            description:
              "Click products to add them, or scan barcodes. The cart updates in real-time!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Select Customer (Optional) 👤",
            description:
              "Click 'Add Customer' to track who's buying. Great for loyalty programs!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Checkout Time! 💳",
            description:
              "Click 'Checkout' when ready. Choose payment method and complete the sale!",
            position: "center",
          },
          {
            id: "step-6",
            title: "Print or Send Receipt 🧾",
            description:
              "Print a receipt or send via WhatsApp. Customers love digital receipts!",
            position: "center",
          },
          {
            id: "step-7",
            title: "Ka-ching! 🎉",
            description:
              "Congratulations! You just made your first sale! +100 XP for this big milestone!",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "What's the benefit of adding a customer to a sale?",
            options: [
              "It's required",
              "Tracks purchase history and enables loyalty rewards",
              "It makes checkout slower",
              "No benefit",
            ],
            correctAnswer: 1,
            explanation:
              "Adding customers lets you track their purchases and reward loyal shoppers!",
            emoji: "👥",
          },
        ],
      },
      {
        id: "lesson-1-3-2",
        title: "Discounts & Coupons 🏷️",
        description: "Apply discounts like a pro",
        emoji: "💸",
        duration: "5 min",
        steps: [
          {
            id: "step-1",
            title: "Everyone Loves Discounts! 🏷️",
            description:
              "Let's learn to apply discounts and make customers happy!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Item Discounts 🛍️",
            description:
              "Click on an item in cart, then 'Add Discount' for item-specific discounts!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Cart Discounts 🛒",
            description:
              "Apply discount to entire cart using the discount button at checkout!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Percentage vs Fixed 💯",
            description:
              "Choose percentage (10% off) or fixed amount (₵5 off). Both work great!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Discount Master! 🎉",
            description:
              "You can now apply discounts! Use them wisely to boost sales! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "What's the difference between item and cart discounts?",
            options: [
              "No difference",
              "Item discount applies to one product, cart discount to entire purchase",
              "Cart discounts don't exist",
              "Item discounts are always better",
            ],
            correctAnswer: 1,
            explanation:
              "Item discounts affect one product, cart discounts affect the whole purchase!",
            emoji: "🏷️",
          },
        ],
      },
    ],
  },

  // Phase 2: Customer Management
  {
    id: "module-2-1",
    number: "2.1",
    title: "Customer Management",
    description:
      "Build relationships that last! Learn to manage customer data and track purchase history.",
    emoji: "👥",
    color: "from-orange-500 to-amber-500",
    difficulty: "beginner",
    estimatedTime: "20-25 min",
    lessons: [
      {
        id: "lesson-2-1-1",
        title: "Adding Customers 👤",
        description: "Create customer profiles for better service",
        emoji: "➕",
        duration: "6 min",
        steps: [
          {
            id: "step-1",
            title: "Know Your Customers! 👥",
            description:
              "Customer data helps you serve better and build loyalty. Let's add some customers!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Go to Customers 📇",
            description:
              "Click Customers in the sidebar to see your customer list!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Add New Customer ➕",
            description: "Click 'Add Customer' to create a new profile!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Enter Details 📝",
            description:
              "Add name, phone, email, and address. Phone is most important for WhatsApp!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Customer Pro! 🎉",
            description:
              "Great job! You can now manage customers like a pro! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why is the phone number important for customers?",
            options: [
              "It's not important",
              "For WhatsApp receipts and notifications",
              "For cold calling",
              "Legal requirement",
            ],
            correctAnswer: 1,
            explanation:
              "Phone numbers enable WhatsApp receipts and promotional messages!",
            emoji: "📱",
          },
        ],
      },
    ],
  },

  // Phase 2: Sales & Orders
  {
    id: "module-2-2",
    number: "2.2",
    title: "Sales & Orders",
    description:
      "Deep dive into sales history, orders, and understanding your business performance.",
    emoji: "📈",
    color: "from-cyan-500 to-blue-500",
    difficulty: "intermediate",
    estimatedTime: "20-25 min",
    lessons: [
      {
        id: "lesson-2-2-1",
        title: "Sales History 📊",
        description: "Track and analyze your sales",
        emoji: "📈",
        duration: "6 min",
        steps: [
          {
            id: "step-1",
            title: "Knowledge is Power! 📊",
            description:
              "Understanding your sales history helps you make better decisions!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Sales Page 📋",
            description:
              "Go to Sales in the sidebar to see all your transactions!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Filter Sales 🔍",
            description:
              "Filter by date, payment method, or customer to find specific sales!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Sale Details 📄",
            description:
              "Click any sale to see full details - items, payment, receipt!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Sales Analyst! 🎉",
            description: "You can now track your sales like a data pro! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "How can you find sales from a specific customer?",
            options: [
              "You can't",
              "Filter by customer name in sales history",
              "Ask the customer",
              "Check your memory",
            ],
            correctAnswer: 1,
            explanation:
              "Use the filter feature to search by customer name and see their purchase history!",
            emoji: "🔍",
          },
        ],
      },
    ],
  },

  // Phase 3: Advanced Inventory
  {
    id: "module-3-1",
    number: "3.1",
    title: "Stock Management",
    description:
      "Master stock levels, adjustments, and keeping your inventory accurate.",
    emoji: "📊",
    color: "from-rose-500 to-pink-500",
    difficulty: "intermediate",
    estimatedTime: "25-30 min",
    lessons: [
      {
        id: "lesson-3-1-1",
        title: "Stock Levels 📈",
        description: "Monitor and manage your stock quantities",
        emoji: "📊",
        duration: "8 min",
        steps: [
          {
            id: "step-1",
            title: "Stock is Gold! 📊",
            description:
              "Accurate stock levels prevent overselling and lost sales. Let's master this!",
            position: "center",
          },
          {
            id: "step-2",
            title: "View Stock 📦",
            description:
              "In Products, see current stock for each item. Green = good, Red = low!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Stock Adjustments ✏️",
            description:
              "Go to Inventory → Adjustments to correct stock counts manually!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Adjustment Reasons 📝",
            description:
              "Always add a reason: Damaged, Stolen, Found, Count correction. It's for accountability!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Stock Expert! 🎉",
            description:
              "You now understand stock management! Keep those numbers accurate! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question:
              "Why should you always add a reason for stock adjustments?",
            options: [
              "It's optional",
              "For accountability and tracking why stock changed",
              "The system requires it",
              "To make reports longer",
            ],
            correctAnswer: 1,
            explanation:
              "Reasons help you understand patterns - too many 'damaged'? Check your storage!",
            emoji: "📝",
          },
        ],
      },
    ],
  },

  // Phase 4: Suppliers
  {
    id: "module-4-1",
    number: "4.1",
    title: "Supplier Management",
    description:
      "Build your vendor network! Add suppliers and track who supplies what.",
    emoji: "🏭",
    color: "from-indigo-500 to-violet-500",
    difficulty: "intermediate",
    estimatedTime: "20-25 min",
    lessons: [
      {
        id: "lesson-4-1-1",
        title: "Adding Suppliers 🏭",
        description: "Create supplier profiles for ordering",
        emoji: "➕",
        duration: "6 min",
        steps: [
          {
            id: "step-1",
            title: "Your Supply Chain! 🏭",
            description:
              "Good supplier relationships = good business. Let's manage them!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Suppliers Page 📋",
            description:
              "Go to Suppliers in the sidebar to see your vendor list!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Add Supplier ➕",
            description: "Click 'Add Supplier' to create a new vendor profile!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Supplier Details 📝",
            description:
              "Add company name, contact person, phone, email, and address!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Supplier Pro! 🎉",
            description: "Your supplier network is growing! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why track suppliers in the system?",
            options: [
              "Not necessary",
              "To know who supplies what and reorder easily",
              "Just for fun",
              "Legal requirement",
            ],
            correctAnswer: 1,
            explanation:
              "Supplier records make reordering easy and help track product sources!",
            emoji: "📦",
          },
        ],
      },
    ],
  },

  // Phase 5: Payments
  {
    id: "module-5-1",
    number: "5.1",
    title: "Payment Processing",
    description:
      "Master all payment methods - cash, card, mobile money, and more!",
    emoji: "💳",
    color: "from-emerald-500 to-green-500",
    difficulty: "intermediate",
    estimatedTime: "20-25 min",
    lessons: [
      {
        id: "lesson-5-1-1",
        title: "Payment Methods 💰",
        description: "Handle different payment types",
        emoji: "💳",
        duration: "8 min",
        steps: [
          {
            id: "step-1",
            title: "Money Matters! 💰",
            description: "Let's learn all the ways customers can pay you!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Cash Payments 💵",
            description:
              "The classic! Enter amount tendered, system calculates change automatically!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Mobile Money 📱",
            description:
              "Accept MTN MoMo, Vodafone Cash, AirtelTigo Money - all integrated!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Card Payments 💳",
            description:
              "Debit and credit cards accepted. Connect your payment terminal!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Split Payments 🔀",
            description:
              "Customer wants to pay half cash, half MoMo? No problem - split it!",
            position: "center",
          },
          {
            id: "step-6",
            title: "Payment Expert! 🎉",
            description: "You can now handle any payment method! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Can a customer pay with multiple payment methods?",
            options: [
              "No, only one method per sale",
              "Yes, you can split payments between methods",
              "Only for large purchases",
              "Only with manager approval",
            ],
            correctAnswer: 1,
            explanation:
              "Split payments let customers pay however works best for them!",
            emoji: "🔀",
          },
        ],
      },
    ],
  },

  // Phase 6: Delivery
  {
    id: "module-6-1",
    number: "6.1",
    title: "Delivery Management",
    description:
      "Set up delivery zones, manage riders, and track deliveries in real-time!",
    emoji: "🚚",
    color: "from-blue-500 to-indigo-500",
    difficulty: "intermediate",
    estimatedTime: "25-30 min",
    lessons: [
      {
        id: "lesson-6-1-1",
        title: "Delivery Setup 🚚",
        description: "Configure delivery for your business",
        emoji: "📍",
        duration: "8 min",
        steps: [
          {
            id: "step-1",
            title: "Deliver the Goods! 🚚",
            description: "Customers want delivery? Let's set it up!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Delivery Settings ⚙️",
            description: "Go to Delivery → Zones to set up delivery areas!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Create Zones 📍",
            description:
              "Define delivery zones with different fees. Closer = cheaper!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Add Riders 🏍️",
            description:
              "Add your delivery riders with their contact info and assign zones!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Delivery Pro! 🎉",
            description:
              "Delivery is set up! Start offering delivery to customers! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why create different delivery zones?",
            options: [
              "Not necessary",
              "To charge appropriate fees based on distance",
              "Just for organization",
              "Legal requirement",
            ],
            correctAnswer: 1,
            explanation:
              "Zones let you charge fair delivery fees - further distances cost more!",
            emoji: "📍",
          },
        ],
      },
    ],
  },

  // Phase 7: Marketing
  {
    id: "module-7-1",
    number: "7.1",
    title: "Loyalty Programs",
    description:
      "Build customer loyalty with points, rewards, and special perks!",
    emoji: "⭐",
    color: "from-amber-500 to-yellow-500",
    difficulty: "intermediate",
    estimatedTime: "20-25 min",
    lessons: [
      {
        id: "lesson-7-1-1",
        title: "Creating Loyalty Program 🎯",
        description: "Set up a program that keeps customers coming back",
        emoji: "⭐",
        duration: "10 min",
        steps: [
          {
            id: "step-1",
            title: "Loyalty = Growth! ⭐",
            description:
              "Loyal customers spend more and refer friends. Let's reward them!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Loyalty Settings 🎯",
            description: "Go to Marketing → Loyalty to configure your program!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Points System 🏆",
            description:
              "Set how many points per currency spent. Example: 1 point per ₵1!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Rewards 🎁",
            description:
              "Create rewards customers can redeem with points - discounts, free items!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Loyalty Master! 🎉",
            description:
              "Your loyalty program is ready! Watch customers keep coming back! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why are loyalty programs effective?",
            options: [
              "They're not effective",
              "They reward repeat purchases and increase customer retention",
              "Customers don't care about points",
              "Only big businesses need them",
            ],
            correctAnswer: 1,
            explanation:
              "Loyalty programs make customers feel valued and encourage repeat business!",
            emoji: "💝",
          },
        ],
      },
    ],
  },

  // Phase 8: Reports
  {
    id: "module-8-1",
    number: "8.1",
    title: "Sales Reports",
    description:
      "Generate reports to understand your sales performance and trends!",
    emoji: "📊",
    color: "from-violet-500 to-purple-500",
    difficulty: "advanced",
    estimatedTime: "25-30 min",
    lessons: [
      {
        id: "lesson-8-1-1",
        title: "Daily Sales Report 📈",
        description: "Track your daily performance",
        emoji: "📅",
        duration: "8 min",
        steps: [
          {
            id: "step-1",
            title: "Data-Driven Decisions! 📊",
            description:
              "Reports help you understand what's working. Let's dive in!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Reports Section 📋",
            description:
              "Go to Reports in the sidebar to see all available reports!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Sales Report 📈",
            description:
              "Click Sales Report to see revenue, transactions, and trends!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Date Range 📅",
            description:
              "Filter by date - today, this week, this month, or custom range!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Export Data 📤",
            description:
              "Export reports to Excel or PDF for accounting and analysis!",
            position: "center",
          },
          {
            id: "step-6",
            title: "Report Expert! 🎉",
            description: "You can now generate reports like a pro! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why export reports to Excel?",
            options: [
              "Not useful",
              "For deeper analysis and sharing with accountants",
              "Excel is old fashioned",
              "Only for tax purposes",
            ],
            correctAnswer: 1,
            explanation:
              "Excel exports let you do custom analysis and share with your accountant!",
            emoji: "📊",
          },
        ],
      },
    ],
  },

  // Phase 9: Staff Management
  {
    id: "module-9-1",
    number: "9.1",
    title: "Staff Management",
    description: "Manage your team, set roles, and control permissions!",
    emoji: "👥",
    color: "from-rose-500 to-red-500",
    difficulty: "advanced",
    estimatedTime: "25-30 min",
    lessons: [
      {
        id: "lesson-9-1-1",
        title: "Adding Staff 👤",
        description: "Add team members to your system",
        emoji: "➕",
        duration: "8 min",
        steps: [
          {
            id: "step-1",
            title: "Build Your Team! 👥",
            description:
              "Growing business means growing team. Let's add staff members!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Settings → Users ⚙️",
            description: "Go to Settings → Users to manage your team!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Add User ➕",
            description: "Click 'Add User' to create a new staff account!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Set Role 🎭",
            description:
              "Choose their role: Cashier, Manager, or custom. This controls what they can do!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Team Leader! 🎉",
            description: "You can now manage your team! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Why assign different roles to staff?",
            options: [
              "Roles don't matter",
              "To control what each person can access and do",
              "Just for titles",
              "Everyone should have full access",
            ],
            correctAnswer: 1,
            explanation:
              "Roles protect your business - cashiers shouldn't change prices or delete products!",
            emoji: "🔐",
          },
        ],
      },
    ],
  },

  // Phase 10: Subscription
  {
    id: "module-10-1",
    number: "10.1",
    title: "Subscription Management",
    description:
      "Understand your plan, manage billing, and get the most from Warehouse POS!",
    emoji: "💎",
    color: "from-indigo-500 to-blue-500",
    difficulty: "beginner",
    estimatedTime: "15-20 min",
    lessons: [
      {
        id: "lesson-10-1-1",
        title: "Your Subscription 📋",
        description: "Understand your plan and features",
        emoji: "💎",
        duration: "5 min",
        steps: [
          {
            id: "step-1",
            title: "Know Your Plan! 💎",
            description:
              "Let's understand your subscription and available features!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Subscription Page 📋",
            description:
              "Go to your account settings to see subscription details!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Plan Features ✨",
            description:
              "See what's included in your plan - products, users, features!",
            position: "center",
          },
          {
            id: "step-4",
            title: "Upgrade Options ⬆️",
            description:
              "Need more? See upgrade options for additional features!",
            position: "center",
          },
          {
            id: "step-5",
            title: "Plan Pro! 🎉",
            description: "You understand your subscription! +50 XP",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "Where can you see your subscription details?",
            options: [
              "On the dashboard",
              "In account/subscription settings",
              "In reports",
              "It's hidden",
            ],
            correctAnswer: 1,
            explanation:
              "Account settings show your current plan, usage, and upgrade options!",
            emoji: "📋",
          },
        ],
      },
      {
        id: "lesson-10-1-2",
        title: "Getting Help 🆘",
        description: "Find answers and contact support",
        emoji: "❓",
        duration: "5 min",
        steps: [
          {
            id: "step-1",
            title: "Help is Here! 🆘",
            description: "Need assistance? Let's learn where to find help!",
            position: "center",
          },
          {
            id: "step-2",
            title: "Help Center 📚",
            description: "Browse articles and guides for common questions!",
            position: "center",
          },
          {
            id: "step-3",
            title: "Contact Support 💬",
            description:
              "Can't find an answer? Contact our support team via chat or email!",
            position: "center",
          },
          {
            id: "step-4",
            title: "WhatsApp Support 📱",
            description: "Message us on WhatsApp for quick help!",
            position: "center",
          },
          {
            id: "step-5",
            title: "🎉 TRAINING COMPLETE! 🎉",
            description:
              "Congratulations! You've completed the training! You're now ready to run your business like a pro! 🚀",
            position: "center",
            celebration: true,
          },
        ],
        quiz: [
          {
            id: "q1",
            question: "What's the best first step when you need help?",
            options: [
              "Give up",
              "Check the Help Center for articles",
              "Delete the app",
              "Call randomly",
            ],
            correctAnswer: 1,
            explanation:
              "The Help Center has answers to most questions - it's the fastest way to find solutions!",
            emoji: "📚",
          },
        ],
      },
    ],
  },
];

// Achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Complete your first training lesson",
    emoji: "👣",
    requirement: "Complete 1 lesson",
  },
  {
    id: "quick-learner",
    title: "Quick Learner",
    description: "Complete 5 lessons",
    emoji: "📚",
    requirement: "Complete 5 lessons",
  },
  {
    id: "module-master",
    title: "Module Master",
    description: "Complete your first full module",
    emoji: "🎓",
    requirement: "Complete 1 module",
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    description: "Get 100% on a quiz",
    emoji: "💯",
    requirement: "Score 100% on any quiz",
  },
  {
    id: "training-champion",
    title: "Training Champion",
    description: "Complete all training modules",
    emoji: "🏆",
    requirement: "Complete all modules",
  },
  {
    id: "warehouse-master",
    title: "Warehouse Master",
    description: "Complete ALL training - you're a true expert!",
    emoji: "👑",
    requirement: "Complete all phases",
  },
];

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  completedModules: [],
  currentStep: 0,
  xpPoints: 0,
  streak: 0,
  achievements: [],
  quizScores: {},
};

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [currentModule, setCurrentModule] = useState<TrainingModule | null>(
    null,
  );
  const [currentLesson, setCurrentLesson] = useState<TrainingLesson | null>(
    null,
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Load progress from Supabase on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);

          // Try to load from Supabase
          const { data, error } = await supabase
            .from("user_training_progress")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (data && !error) {
            setProgress({
              completedLessons: data.completed_lessons || [],
              completedModules: data.completed_modules || [],
              currentModule: data.current_module,
              currentLesson: data.current_lesson,
              currentStep: data.current_step || 0,
              xpPoints: data.xp_points || 0,
              streak: data.streak || 0,
              lastActivityDate: data.last_activity_date,
              achievements: data.achievements || [],
              quizScores: data.quiz_scores || {},
            });
          } else {
            // Fall back to localStorage for existing users
            const saved = localStorage.getItem("vendor-training-progress");
            if (saved) {
              const localProgress = JSON.parse(saved);
              setProgress(localProgress);
              // Migrate localStorage data to Supabase
              await saveToSupabase(user.id, localProgress);
            }
          }
        } else {
          // No user - use localStorage only
          const saved = localStorage.getItem("vendor-training-progress");
          if (saved) {
            setProgress(JSON.parse(saved));
          }
        }
      } catch (error) {
        console.error("Error loading training progress:", error);
        // Fall back to localStorage
        const saved = localStorage.getItem("vendor-training-progress");
        if (saved) {
          setProgress(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Save to Supabase function
  const saveToSupabase = useCallback(
    async (uid: string, data: UserProgress) => {
      try {
        const { error } = await supabase.from("user_training_progress").upsert(
          {
            user_id: uid,
            completed_lessons: data.completedLessons,
            completed_modules: data.completedModules,
            current_module: data.currentModule,
            current_lesson: data.currentLesson,
            current_step: data.currentStep,
            xp_points: data.xpPoints,
            streak: data.streak,
            last_activity_date: data.lastActivityDate,
            achievements: data.achievements,
            quiz_scores: data.quizScores,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error) {
          console.error("Error saving to Supabase:", error);
        }
      } catch (error) {
        console.error("Error saving training progress:", error);
      }
    },
    [],
  );

  // Persist progress to both localStorage and Supabase
  useEffect(() => {
    if (isLoading) return;

    // Always save to localStorage as backup
    localStorage.setItem("vendor-training-progress", JSON.stringify(progress));

    // Save to Supabase if user is logged in
    if (userId) {
      saveToSupabase(userId, progress);
    }
  }, [progress, userId, isLoading, saveToSupabase]);

  const updateProgress = (updates: Partial<UserProgress>) => {
    setProgress((prev) => ({ ...prev, ...updates }));
  };

  const startTraining = (moduleId: string, lessonId: string) => {
    const module = TRAINING_MODULES.find((m) => m.id === moduleId);
    if (!module) return;

    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    setCurrentModule(module);
    setCurrentLesson(lesson);
    setCurrentStepIndex(0);
    setIsTrainingActive(true);
    setShowSpotlight(true);

    updateProgress({
      currentModule: moduleId,
      currentLesson: lessonId,
    });
  };

  const nextStep = () => {
    if (!currentLesson) return;

    if (currentStepIndex < currentLesson.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const completeLesson = () => {
    if (!currentLesson || !currentModule) return;

    const newCompletedLessons = [
      ...new Set([...progress.completedLessons, currentLesson.id]),
    ];

    // Check if all lessons in module are complete
    const allLessonsComplete = currentModule.lessons.every((l) =>
      newCompletedLessons.includes(l.id),
    );

    const newCompletedModules = allLessonsComplete
      ? [...new Set([...progress.completedModules, currentModule.id])]
      : progress.completedModules;

    // Award XP
    const xpEarned = 50;

    updateProgress({
      completedLessons: newCompletedLessons,
      completedModules: newCompletedModules,
      xpPoints: progress.xpPoints + xpEarned,
    });

    // Check achievements
    if (newCompletedLessons.length === 1) {
      unlockAchievement("first-steps");
    }
    if (newCompletedLessons.length >= 5) {
      unlockAchievement("quick-learner");
    }
    if (newCompletedModules.length === 1) {
      unlockAchievement("module-master");
    }
    if (newCompletedModules.length === TRAINING_MODULES.length) {
      unlockAchievement("training-champion");
      unlockAchievement("warehouse-master");
    }
  };

  const exitTraining = () => {
    setIsTrainingActive(false);
    setCurrentModule(null);
    setCurrentLesson(null);
    setCurrentStepIndex(0);
    setShowSpotlight(false);
  };

  const getModuleProgress = (moduleId: string): number => {
    const module = TRAINING_MODULES.find((m) => m.id === moduleId);
    if (!module) return 0;

    const completedInModule = module.lessons.filter((l) =>
      progress.completedLessons.includes(l.id),
    ).length;

    return Math.round((completedInModule / module.lessons.length) * 100);
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return progress.completedLessons.includes(lessonId);
  };

  const unlockAchievement = (achievementId: string) => {
    if (!progress.achievements.includes(achievementId)) {
      updateProgress({
        achievements: [...progress.achievements, achievementId],
      });
    }
  };

  const addXP = (points: number) => {
    updateProgress({ xpPoints: progress.xpPoints + points });
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastActivity = progress.lastActivityDate;

    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActivity === yesterday.toDateString()) {
        updateProgress({
          streak: progress.streak + 1,
          lastActivityDate: today,
        });
      } else {
        updateProgress({
          streak: 1,
          lastActivityDate: today,
        });
      }
    }
  };

  const value: TrainingContextType = {
    progress,
    updateProgress,
    isTrainingActive,
    currentModule,
    currentLesson,
    currentStepIndex,
    startTraining,
    nextStep,
    previousStep,
    completeLesson,
    exitTraining,
    modules: TRAINING_MODULES,
    getModuleProgress,
    isLessonCompleted,
    achievements: ACHIEVEMENTS,
    unlockAchievement,
    addXP,
    updateStreak,
    showSpotlight,
    setShowSpotlight,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error("useTraining must be used within a TrainingProvider");
  }
  return context;
}

export { TRAINING_MODULES, ACHIEVEMENTS };
