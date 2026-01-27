# 🏪 WarehousePOS

> A modern, reliable Point of Sale and Inventory Management system for African businesses.

---

## 📋 Project Status

| Phase | Status | Target |
|-------|--------|--------|
| Planning | ✅ Complete | Jan 2026 |
| Phase 1: Foundation | 🔄 Starting | Feb 2026 |
| Phase 2: Inventory | ⏳ Planned | Feb 2026 |
| Phase 3: POS | ⏳ Planned | Mar 2026 |
| Phase 4: Customers & Sales | ⏳ Planned | Mar 2026 |
| Phase 5: Offline & Polish | ⏳ Planned | Apr 2026 |

---

## 🗂️ Project Structure

```
WarehousePOS/
├── apps/
│   ├── marketing/      # Marketing website (DONE)
│   └── pos/            # Main POS app (TODO)
├── supabase/
│   ├── migrations/     # Database schema
│   └── functions/      # Edge functions
└── docs/
    ├── REBUILD_PLAN.md              # Complete build plan
    └── LESSONS_LEARNED_AND_CAUTIONS.md  # What to avoid
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account

### Marketing Website

```bash
cd apps/marketing
npm install
npm run dev
```

### POS Application

*Coming soon after Phase 1 setup*

---

## 📚 Documentation

- [Rebuild Plan](./docs/REBUILD_PLAN.md) - Complete roadmap and architecture
- [Lessons Learned](./docs/LESSONS_LEARNED_AND_CAUTIONS.md) - Mistakes to avoid

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | TailwindCSS, Shadcn/ui |
| State | TanStack Query, Zustand |
| Offline | Dexie.js (IndexedDB) |
| Backend | Supabase (PostgreSQL) |
| Payments | Paystack |
| SMS | mNotify |

---

## 📝 License

Proprietary - All rights reserved.

---

Built with ❤️ for African businesses.
