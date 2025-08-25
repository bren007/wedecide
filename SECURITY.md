# Security & Data Handling Architecture for WeDecide

This document provides an overview of the security architecture and data handling principles for the WeDecide platform, intended for Chief Information Security Officers (CISOs) and security architects in public sector and multilateral organizations.

## Guiding Principles

The security of sensitive decision-making data is the highest priority. Our architecture is founded on the principle of "secure by design," ensuring that data is protected at every stage of its lifecycle. We leverage modern, server-centric web technologies to minimize the client-side attack surface and ensure that all critical operations and data processing occur within a trusted server environment.

## 1. Core Technical Architecture

The platform is built on a modern, secure-by-default technical stack:

*   **Framework**: **Next.js 15 (App Router)** is used, which enables a server-centric model. By default, components are **React Server Components**, meaning they render on the server and send non-interactive HTML to the client. This dramatically reduces the amount of JavaScript and application logic exposed in the browser.
*   **Server Actions**: All data mutations (e.g., submitting a proposal, approving a decision) are handled via Next.js Server Actions. These are RPC-style calls that execute securely on the server, meaning the client never has direct access to the database or business logic.

## 2. Data Handling and Storage

*   **Prototype Data**: In this prototype, data is stored in-memory (`src/lib/data.ts`) for demonstration purposes.
*   **Production Data Strategy**: In a production environment, this would be replaced by a secure, scalable database like **Google Cloud Firestore**. Access to data in Firestore would be governed by **Firebase Security Rules**, a powerful, server-side rules engine that allows for granular, attribute-based access control. For example, a rule could state that a user can only view a decision if they are part of the designated `governanceLevel` for that decision.

## 3. Generative AI Integration (Genkit)

The security of AI interactions is paramount, especially when processing sensitive proposal backgrounds.

*   **Server-Side Execution**: All generative AI features are powered by **Genkit**, which runs exclusively on the server. AI `flows` are defined and executed as server-side functions.
*   **No Client-Side LLM Calls**: The client-side application **never** makes direct calls to any Large Language Model (LLM) or AI API. The React components invoke Server Actions, which in turn securely call the Genkit flows on the backend.
*   **Data Flow**: When a user requests an "Intelligent Assessment," the flow is as follows:
    1.  The client invokes a Server Action, passing only the ID of the decision to be assessed.
    2.  The server action retrieves the decision data from the database.
    3.  The server-side Genkit flow sends the proposal's background text to the configured LLM.
    4.  The LLM's response is processed by the Genkit flow on the server.
    5.  The final, structured output is returned to the client.
*   **Benefit**: This architecture ensures that sensitive proposal data is never exposed to the client's browser and that API keys for AI services are securely stored and used only on the server.

## 4. Authentication and Authorization

*   **Prototype Status**: The current prototype does not have user authentication implemented.
*   **Production Strategy**: A production deployment would integrate a robust authentication solution like **Firebase Authentication**, which supports federated identity providers (e.g., Entra ID/Azure AD, Okta), single sign-on (SSO), and multi-factor authentication (MFA).
*   **Role-Based Access Control (RBAC)**: Once authenticated, user authorization would be managed through a combination of Firebase Security Rules and application logic to implement RBAC. This would ensure that users can only perform actions (e.g., `approveForMeeting`) and view data appropriate to their role (e.g., Submitter, Secretariat, Decision-Maker).

## 5. Deployment and Infrastructure

The application is designed to be deployed on **Firebase App Hosting**, a secure, managed environment running on Google Cloud infrastructure. This provides numerous platform-level security benefits, including protection against DDoS attacks, managed TLS certificates, and a globally distributed content delivery network (CDN).

## Summary for the CISO

| Concern | Architectural Mitigation |
| :--- | :--- |
| **Data Exposure** | **Server-Centric Model**: Sensitive logic and data access are confined to the server. The client receives pre-rendered HTML and makes secure RPC-style calls (Server Actions). |
| **Database Security**| **Firestore + Security Rules**: In production, data access is controlled by granular, server-enforced rules, not by application-level checks. |
| **AI Data Privacy** | **Server-Side AI Flows**: Sensitive proposal data sent to LLMs is handled exclusively on the backend via Genkit. No direct client-to-AI communication. |
| **Unauthorized Access**| **Firebase Auth + RBAC**: Production-level authentication and role-based access control would ensure users only access data and functions they are permitted to. |
| **Infrastructure Security**| **Managed Cloud Platform**: Deployed on Firebase/Google Cloud, benefiting from platform-level security, compliance (e.g., SOC 2, ISO 27001), and resilience. |

This prototype demonstrates a modern, secure architecture suitable for handling sensitive public sector information. A full production deployment would build on this strong foundation with enterprise-standard practices such as security audits, penetration testing, and comprehensive logging and monitoring.