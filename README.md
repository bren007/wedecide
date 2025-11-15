# WeDecide Lite

WeDecide Lite is a lightweight, self-service SaaS platform for small teams, clubs, and associations that need to make structured, transparent, and trackable group decisions without bureaucratic complexity.

## Architecture

*   **Front-End:** Next.js with Tailwind CSS & shadcn (Hosted on Vercel).
*   **Authentication & User Identity:** Firebase Authentication.
*   **Data Core & Backend Logic:** Supabase (PostgreSQL Database with RLS).
*   **Security Bridge:** A Firebase Cloud Function acts as a secure bridge to exchange a Firebase User Token for a Supabase-compatible JWT.
*   **LLM/AI Engine:** Gemini API (called from Supabase Edge Functions).
*   **Deployment:** The project is connected to a GitHub repository with decoupled deployment pipelines for the frontend and backend services.
