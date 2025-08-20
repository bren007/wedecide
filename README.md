# WeDecide - Decision Management Prototype

This is a Next.js starter project for "WeDecide," a prototype application designed to streamline and enhance strategic decision-making processes within organizations.

## Functional Architecture & Core Decision Flow

The prototype is designed to validate a core workflow for structured decision-making, enhanced by AI-powered support tools. The primary user flow is as follows:

1.  **Decision Preparation:** A user prepares a decision proposal through a structured form. They provide a title, background information, and select the type of decision sought (Approve, Endorse, Note, Agree, Direct). Crucially, they link the proposal to a strategic objective by selecting from a visual gallery of organizational goals, which immediately grounds the proposal in a strategic context.

2.  **Secretariat Review (Vetting):** The submitted proposal appears on the Secretariat Dashboard. A key metric on this dashboard is "Awaiting Update," which shows how many proposals have been sent back to submitters for improvement, highlighting the secretariat's quality control function.

3.  **AI-Powered Vetting:** On the review page for a specific proposal, the secretariat has access to "Intelligent Vetting" tools. This AI-driven feature can generate a list of targeted questions to assess the proposal's completeness, clarity, and strategic alignment, ensuring it is "decision-ready."

4.  **Scheduling:** Once the proposal is deemed ready, the secretariat can approve it for a meeting, which changes its status to "Scheduled for Meeting."

5.  **Decision Making:** All scheduled proposals appear on the "Decision Making" page, which serves as the central hub for decision-makers during a meeting.

6.  **AI-Powered Decision Support:** During the meeting, decision-makers can use "Decision Support" tools:
    *   **Intelligent Summary:** Generates a concise summary of the proposal's background and its alignment with strategic objectives.
    *   **Intelligent Exploration:** Generates strategic questions (e.g., "What if?", "So What?") to facilitate a deep and robust discussion, uncovering risks, assumptions, and next steps.

7.  **Decision & Recording:** The decision outcome (e.g., Approved, Endorsed, Not Approved) is recorded directly on the agenda item. The prototype also alludes to a workflow where a meeting can be recorded, transcribed via speech-to-text, and then summarized by the AI into editable meeting notes before being formally approved.

8.  **Decision Bank:** Once a decision is made, it moves from the active agenda to the "Decision Bank." This is more than a static archive; it's a dynamic repository of organizational knowledge, featuring key performance indicators like:
    *   **Decision Cycle Time:** The average number of business days from submission to final decision.
    *   **Decision Rate:** The ratio of action-oriented decisions to passive notes, highlighting the organization's bias towards action.

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
