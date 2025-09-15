# Open Pages

A minimal, production-ready web app for health profile sharing. Users create public health/biohacking profiles with shareable URLs to showcase their stacks, protocols, and wellness journeys.

## 🚀 Project Overview

**App Name:** Open Pages  
**Domain:** TBD (considering MyStack.co, ShowMy.health, etc.)  
**Purpose:** Public health/biohacking profile sharing platform

## ✨ Core Features (4-Cut Delivery)

- **Cut 1:** Profile creation + public view (`/u/[slug]`)
- **Cut 2:** Stack items (supplements, devices, etc.)
- **Cut 3:** Protocols (routines) + file uploads  
- **Cut 4:** Polish + monetization hooks

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Supabase (Auth, Postgres, Storage) with RLS
- **Styling:** Tailwind CSS (clean, minimal styling)
- **Deployment:** Vercel
- **Icons:** Lucide React

## 📊 Data Model

- `profiles`: slug, display_name, bio, avatar_url, public
- `stack_items`: name, dose, timing, brand, notes, public
- `protocols`: name, details, frequency, public  
- `uploads`: file_url, title, description, public
- `user_usage`: track limits for freemium model

## 🎨 Design Principles

- **"Digital Granite" aesthetic:** clean, structured, premium
- Content-first design with generous white space
- Typography-focused, minimal colors
- Mobile-optimized web app (no native app)

## 💰 Business Model

- **Freemium:** Free tier with limits, Pro tier ($9/month) unlimited
- **Future:** Discovery platform, AI integration

## 🏗 Project Structure

```
open-pages/
├── app/
│   ├── u/[slug]/          # Public profile pages
│   ├── dash/              # User dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable UI components
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── types.ts           # TypeScript types
└── public/                # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd open-pages
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Set up Supabase database:**
   ```sql
   -- Run the SQL schema in your Supabase SQL editor
   -- (Schema will be provided in database/ folder)
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 📝 Development Roadmap

### Phase 1: Foundation ✅
- [x] Next.js 14 setup with TypeScript
- [x] Supabase integration
- [x] Basic folder structure
- [x] TypeScript types
- [x] Environment configuration

### Phase 2: Core Features (Next)
- [ ] Authentication system
- [ ] Profile creation/editing
- [ ] Public profile pages
- [ ] Stack items management
- [ ] Basic UI components

### Phase 3: Advanced Features
- [ ] Protocols system
- [ ] File uploads
- [ ] User dashboard
- [ ] Freemium limits

### Phase 4: Polish & Launch
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Error handling
- [ ] Analytics integration

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the health optimization community.
