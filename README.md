# សៀវភៅបញ្ជី (Sievphov Banchy) - Notebook Money Management App

> **Sievphov Banchy (សៀវភៅបញ្ជី)** is a modern, responsive, and secure customer ledger and debt notebook web application built for Cambodian business owners and individuals.

Designed with the **ROM LATEX** aesthetic color system, bilingual Khmer/English support, offline single-file portability, multi-device sync, and cloud authentication.

---

## 🌟 Key Features

1. **ROM LATEX Design Palette & Visual Tokens**
   - **Light Mode**: Warm scholarly parchment (`#f7f5f1`), stone charcoal (`#1c1917`), and deep slate navy (`#1f3d5c`).
   - **Dark Mode**: Obsidian slate (`#121417`), luminous ice-blue (`#9ec5e8`), and charcoal cards (`#1a1e23`).
   - High-contrast, accessible, and elegant typography using **Kantumruy Pro**.

2. **Customer & Ledger Management**
   - Track customer profiles, contact info, Telegram, address, dates, and balance ledger.
   - Built-in Cambodian village selector (ចំបក់ស, គោកដូង, ស្វាយ, តាហុក, ធិបតី, ជួយចក្រី, ឈូក, ត្រីញ័រ, ធ្វាស, ត្រពាំងព្រីង) with custom address support.
   - Comprehensive status tracking: Active (សកម្ម), Pending (រង់ចាំ), Debt / ជំពាក់, Completed (រួចរាល់), Inactive (អសកម្ម).
   - Filter by status, category, village, and search by customer name/phone.

3. **Customer Authentication & Multi-Device Cloud Sync**
   - User Sign Up and Sign In system with isolated personal data per `user_id`.
   - Automatic background synchronization across laptop, desktop, mobile, and tablet.
   - Built-in Central Storage API + support for direct **Supabase PostgreSQL** cloud connection with Row Level Security (RLS).
   - Local vault fallback for seamless offline operation.

4. **Interactive Notes & Timeline**
   - Customer-linked notes and standalone pinned memo cards.
   - Filter by categories and search note contents.

5. **Data Backup & Universal Single-File Portability**
   - Export/import full JSON data backups.
   - Export Cambodian customer ledger reports directly to Excel / CSV.
   - Single-file standalone `app.html` for 1-click double-click launch on any computer without needing a local web server.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation & Development
```bash
# Install dependencies
npm install

# Run Vite dev server with hot reload
npm run dev
```

### Production Build
```bash
# Build production bundle and generate standalone app.html
npm run build

# Preview production build
npm run preview
```

---

## 🛠️ Technology Stack
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + ROM LATEX Theme Tokens
- **Icons**: Lucide React
- **Build Tool**: Vite 8 + `vite-plugin-singlefile`
- **Database / Auth**: Supabase JS + Central Cloud API + LocalStorage Vault

---

## 📄 License
MIT License.
