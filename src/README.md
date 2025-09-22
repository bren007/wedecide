# WeDecide - The Decision Intelligence Platform

This is a Next.js prototype for "WeDecide," which is aiming to become the **Decision Intelligence Platform** for **Public Sector and Multilateral Organizations.**

## Functional Architecture & Core Decision Flow

The prototype is architected around a core workflow that transforms decision-making from a series of disconnected meetings into a structured, auditable, and intelligent process.

1.  **Decision Preparation (AI-Augmented):** A user prepares a decision proposal. This is the starting point where AI significantly accelerates the workflow.
    *   **Generative Scaffolding:** For users starting from a blank page, they can select a document type (e.g., "Business Case," "Policy Paper") and provide a core idea. The AI then generates a comprehensive, best-practice draft document, complete with appropriate sections and boilerplate content, turning months of work into minutes.
    *   **Intelligent Ingestion:** For users with an existing document, they can upload it for analysis. The AI assesses the document, identifies its type, and generates improved content (Title, Background, Decision Sought) and pre-vetting feedback, ensuring the proposal is well-structured before it even enters the formal process.
    *   **Structured Submission:** The user then populates the final submission form (assisted by the AI's suggestions) and links the proposal to a strategic objective from a visual gallery, immediately grounding it in a strategic context.

2.  **Secretariat Review (Vetting):** The submitted proposal appears on the Secretariat Dashboard. A key performance indicator on this dashboard is **"Awaiting Update,"** which shows how many proposals have been sent back to submitters for improvement. This highlights the secretariat's critical quality control function.

3.  **AI-Powered Vetting:** On the review page for a specific proposal, the secretariat has access to **"Intelligent Vetting"** tools. This AI-driven feature generates a list of targeted questions to assess the proposal's completeness, clarity, and strategic alignment, ensuring it is "decision-ready."

4.  **Scheduling:** Once the proposal is deemed ready, the secretariat can approve it for a meeting, which changes its status to "Scheduled for Meeting."

5.  **Decision Making:** All scheduled proposals appear on the "Decision Making" page, which serves as the central hub for decision-makers.

6.  **AI-Powered Decision Support:** During the meeting, decision-makers can use "Decision Support" tools:
    *   **Intelligent Summary:** Generates a concise summary of the proposal's background and its alignment with strategic objectives, allowing for rapid comprehension.
    *   **Intelligent Exploration:** Generates strategic questions (e.g., "What if?", "So What?") to facilitate a deep and robust discussion, uncovering risks, assumptions, and next steps.

7.  **Decision & Recording:** The decision outcome (e.g., Approved, Endorsed, Not Approved) is recorded directly on the agenda item. The prototype also demonstrates a workflow where a meeting can be recorded, transcribed via speech-to-text, and then summarized by the AI into editable meeting notes before being formally approved and archived.

8.  **Decision Bank:** Once a decision is made, it moves from the active agenda to the **"Decision Bank."** This is more than a static archive; it's a dynamic repository of organizational knowledge, featuring key performance indicators that provide insight into governance effectiveness:
    *   **Decision Cycle Time:** The average number of business days from submission to final decision, measuring organizational velocity.
    *   **Decision Rate:** The ratio of action-oriented decisions to passive notes, highlighting the organization's bias towards action and accountability.

## Technical Architecture

The prototype is built on a modern, server-centric web stack, chosen for its robustness, security, and ability to deliver sophisticated AI-driven user experiences.

*   **Framework:** **Next.js 15** using the **App Router**. This provides a robust foundation with server-side rendering (SSR), Server Components, and a clear project structure suitable for complex applications.

*   **Language:** **TypeScript** is used throughout for type safety, which is critical for building maintainable, enterprise-grade software.

*   **UI Components:** **ShadCN/UI** provides a set of beautifully designed and accessible components, built on top of Radix UI and Tailwind CSS. This allows for the rapid development of a polished and consistent user interface.

*   **Styling:** **Tailwind CSS** is used for all styling, enabling the creation of a custom, professional design system directly within the components.

*   **AI Integration (Genkit):** All generative AI features are powered by **Genkit**, Google's open-source AI framework.
    *   **Flows:** Genkit `flows` are defined in `src/ai/flows/`. These are server-side functions that orchestrate calls to Large Language Models (LLMs) to perform specific tasks like summarization, question generation, or document creation, ensuring all sensitive operations remain on the server.
    *   **Prompts & Schemas:** Each flow uses a `prompt` that is carefully engineered to produce structured, high-quality output. Zod schemas define the expected input and output shapes, ensuring reliable and type-safe data flow between the UI and the AI models.
    *   **Server Actions:** React Server Components invoke these Genkit flows directly using Next.js **Server Actions**, creating a seamless and secure user experience with a minimal client-side footprint.

*   **Data Handling:** For this prototype, data is stored in-memory in `src/lib/data.ts` to simulate a database. In a production environment, this would be replaced with a secure and scalable database system (e.g., Firestore).
