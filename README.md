# WeDecide - Decision Management Prototype

This is a Next.js starter project for "WeDecide," a prototype application designed to streamline and enhance strategic decision-making processes within organizations.

## Functional Architecture & Core Decision Flow

The prototype is designed to validate a core workflow for structured decision-making, enhanced by AI-powered support tools. The primary user flow is as follows:

1.  **Submission:** A user submits a decision proposal through a structured form. They provide a title, background information, the type of decision sought (Approve, Endorse, Note), and link it to a predefined strategic objective. The prototype also signals the future capability to upload a source document directly.

2.  **Secretariat Review (Vetting):** The submitted proposal appears on the Secretariat Dashboard. A secretariat member can then navigate to a dedicated review page for that proposal.

3.  **AI-Powered Vetting:** On the review page, the secretariat has access to "Intelligent Vetting" tools. These AI-driven features can generate a list of targeted questions to assess the proposal's completeness, clarity, and strategic alignment, ensuring it is "decision-ready."

4.  **Scheduling:** Once the proposal is deemed ready, the secretariat can approve it for a meeting, which changes its status to "Scheduled for Meeting."

5.  **Meeting Agenda:** All scheduled proposals appear on the "Meeting Agenda" page. This view is the central hub for decision-makers during a meeting.

6.  **AI-Powered Decision Support:** During the meeting, decision-makers can use "Decision Support" tools:
    *   **Intelligent Summary:** Generates a concise summary of the proposal's background and its alignment with strategic objectives.
    *   **Intelligent Exploration:** Generates strategic questions (e.g., "What if?", "So What?") to facilitate a deep and robust discussion, uncovering risks, assumptions, and next steps.

7.  **Decision & Recording:** The decision outcome (e.g., Approved, Endorsed, Not Approved) is recorded directly on the agenda item.

8.  **Archive:** Once a decision is made, it moves from the active agenda to the "Past Decisions" page, creating a persistent, auditable record.

## Technical Architecture

The prototype is built on a modern, server-centric web stack, leveraging the strengths of Next.js and integrated AI capabilities through Genkit.

*   **Framework:** **Next.js 15** using the **App Router**. This provides a robust foundation with server-side rendering (SSR), Server Components, and a clear project structure.

*   **Language:** **TypeScript** is used throughout the project for type safety, improved developer experience, and code quality.

*   **UI Components:** **ShadCN/UI** provides a set of beautifully designed and accessible components, built on top of Radix UI and Tailwind CSS. This allows for rapid development of a polished and consistent user interface.

*   **Styling:** **Tailwind CSS** is used for all styling. It's a utility-first CSS framework that allows for building custom designs directly in the markup without writing custom CSS. The theme is configured in `src/app/globals.css`.

*   **AI Integration (Genkit):** All generative AI features are powered by **Genkit**.
    *   **Flows:** Genkit `flows` are defined in `src/ai/flows/`. These are server-side functions that orchestrate calls to Large Language Models (LLMs) to perform specific tasks like summarization or question generation.
    *   **Prompts:** Each flow uses a `prompt` that is carefully engineered to provide the LLM with the right context and instructions to produce structured, high-quality output. Zod schemas are used to define the expected input and output shapes, ensuring reliable data flow.
    *   **Server Actions:** The frontend components (e.g., `IntelligentExploration`) are React Server Components that invoke these Genkit flows directly using Next.js **Server Actions**, keeping the client-side bundle small and the interaction seamless.

*   **Data Handling:** For this prototype, data is stored in-memory in `src/lib/data.ts`. In a production application, this would be replaced with a robust database system (e.g., Firestore). Data fetching and mutations are handled through async functions and Server Actions.
