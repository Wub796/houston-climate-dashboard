# Orbital Watch — Real-Time Satellite & Debris Tracker

**Congressional App Challenge Submission**
**District:** TX-101912
**Developer:** Benjamin Wu

## The Problem

There are **6,000+ active satellites** and **27,000+ pieces of tracked debris** orbiting Earth right now. 
Every day, this number grows — and so does the risk of catastrophic collision. The **Kessler Syndrome** 
describes a chain-reaction scenario where one collision triggers a cascade, permanently destroying entire 
orbital shells that GPS, weather forecasting, and national security depend on.

**Houston has more at stake than almost any other city in America:**
- NASA Johnson Space Center monitors every crewed mission from here
- The energy sector relies on satellite communications for offshore operations
- Emergency weather systems protecting the Gulf Coast run through orbital infrastructure

## The Solution

Orbital Watch lets anyone — student, voter, or lawmaker — see the crisis in real time.

- 🌍 **Live 3D globe** powered by CesiumJS with real orbital propagation
- 📡 **6,000+ satellites** tracked using live TLE data from CelesTrak
- 🗑️ **Space debris** visualized separately from active payloads
- 📍 **ZIP code flyover** — enter any US ZIP to see what's overhead right now
- 📚 **Educational drawer** explaining Kessler Syndrome and what Congress can do

## Live Demo

🔗 [https://houston-climate-dashboard.vercel.app/](https://houston-climate-dashboard.vercel.app/)

## Tech Stack

- **Next.js 15** + TypeScript
- **CesiumJS** + Resium for 3D globe rendering
- **satellite.js** for real-time orbital propagation (SGP4 model)
- **Tailwind CSS** + Framer Motion for UI
- **Vercel** for deployment

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Data Sources

- [CelesTrak](https://celestrak.org) — live Two-Line Element (TLE) sets
- [Zippopotam.us](https://zippopotam.us) — ZIP code geocoding