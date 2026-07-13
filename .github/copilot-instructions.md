# FitAI Copilot Instructions

## Project Type
Next.js 15 AI fashion technology website (App Router, TypeScript, TailwindCSS, Framer Motion)

## Architecture
- All pages live in `src/app/`
- All components in `src/components/`
- Design tokens and animations defined in `src/app/globals.css`
- Color palette: neon green (#00ff9d), luxury pink (#ff6eb4), charcoal (#0a0a0f), ice blue (#00c4ff)

## Development Conventions
- All interactive components use `"use client"` directive
- Framer Motion `useInView` for scroll-triggered animations with `once: true`
- Custom CSS classes: `.glass`, `.glass-green`, `.glass-pink`, `.btn-primary`, `.btn-secondary`, `.gradient-text-green`, `.gradient-text-pink`, `.gradient-text-hero`, `.card-hover`, `.blob`
- Blob orbs for ambient lighting: `.blob.orb-green`, `.blob.orb-pink`, `.blob.orb-blue`
- Section spacing via `.section-pad` class (120px vertical padding)

## Run
```bash
npm run dev   # http://localhost:3000
npm run build
```
