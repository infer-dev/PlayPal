# PlayPal

PlayPal is a responsive Next.js demo for parent-approved outdoor play. It includes child, parent, and trusted-adult preview roles, sample sessions and spaces, mission/game discovery, approval interactions, notifications, and reward updates.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and add credentials only for services you have configured.
3. Run `npm install`, then `npm run dev`, and open http://localhost:3000.

The current experience is **demo-only**. Demo role switching and actions are simulated in browser state and are not authentication or authorization. It does not connect to Supabase, Google Maps, push notifications, adult identity review, or device GPS. All places, approvals, people, verification labels, and notifications are sample data. Never use the demo for real children or real-world supervision.

Role switching is automatically hidden in production builds unless `NEXT_PUBLIC_DEMO_MODE=true` is explicitly set for a presentation deployment. This switch does not turn demo behavior into production authorization.

## Supabase foundation

`supabase/migrations/001_playpal.sql` contains the initial relational model, constraints, indexes, RLS policies, and server-side write boundary. Apply it to a separate development Supabase project only after reviewing the policies. Before production, implement and audit server-side RPCs or Edge Functions for child enrollment, independent guardian approval, trusted adult review, session state transitions, event notifications, and idempotent reward issuance. The UI alone is not an enforcement boundary. Store service-role keys only on the server. Adult verification requires a human review process; a database status field or demo label is not verification.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS, Lucide icons
- Supabase migration starter (not connected in demo)
- Explore includes an OpenStreetMap view centered on Pitampura, Delhi; the family check-in remains simulated

## Safety and privacy notes

- The map shows a neighborhood, not a child's device location. A child-controlled check-in shares only the sample neighborhood in browser state.
- No live GPS, background tracking, or location data collection is provided. No chat, public child search, or child photography is provided.
- The sample map and session status do not represent verified safety, availability, or supervision.
- Real use requires a legal/privacy review, guardian consent, robust identity review, audited authorization, retention limits, and operational safety processes.
