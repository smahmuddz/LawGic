
<div style=" align-items: center; gap: 10px;">
  <img src="/public/favicon.png" alt="LawGic Logo" width="48" height="48" />
  <h1 style="margin: 0;">LawGic – AI Legal Aid Chatbot for Bangladesh</h1>
</div>



![React](https://img.shields.io/badge/React-^19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-latest-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-latest-blue?logo=tailwindcss)
![Google Gemini API](https://img.shields.io/badge/Google%20Gemini%20API-v1-green?logo=google)

## Overview

"LawGic" is an AI-powered chatbot designed to provide informational guidance on general Bangladeshi law. It leverages the Google Gemini API to offer clear explanations and aims to make legal information more accessible.

**This tool is intended for educational and informational purposes only and is not a substitute for professional legal advice from a qualified lawyer.**

## Features

-   **Conversational AI:** Engage in natural language conversations about Bangladeshi law.
-   **Specialized Knowledge:** Trained with system instructions to focus on the Constitution of Bangladesh and general national laws.
-   **Source Citation:** Cites relevant articles, sections, or law names where possible.
-   **Google Search Grounding:** Utilizes Google Search to provide up-to-date information and lists source URLs for transparency.
-   **Streaming Responses:** Displays AI responses as they are generated for a smoother user experience.
-   **Disclaimer:** Prominently features a disclaimer stating it's not legal advice.
-   **Responsive Design:** Adapts to various screen sizes for accessibility on different devices.
-   **Error Handling:** Gracefully handles API errors and informs the user.
-   **Loading Indicators:** Provides visual feedback while the AI is processing requests.

## Technologies Used

-   **Frontend:**
    -   React
    -   TypeScript
    -   TailwindCSS
-   **AI & Backend Logic:**
    -   Google Gemini API (`@google/genai` SDK)
        -   Model: `gemini-2.5-flash-preview-04-17`
    -   Google Search (for grounding via Gemini API)
-   **Development Environment:**
    -   ES Modules (via import maps in `index.html`)
    -   Dependencies served via `esm.sh`

## Prerequisites

-   A modern web browser with JavaScript and ES Module support (e.g., Chrome, Firefox, Edge, Safari).
-   A Google Gemini API Key.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

**1. API Key Configuration:**

This application requires a Google Gemini API Key to function.

-   Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   The application's `App.tsx` file expects the API key to be available via `process.env.API_KEY`.
-   **Important for Local Development:**
    Since this is a client-side application served statically, `process.env.API_KEY` as used in Node.js environments won't be directly available in the browser. You have a few options:
    1.  **Modify `App.tsx` (for local testing only):**
        Temporarily replace `const apiKey = process.env.API_KEY;` in `App.tsx` with your actual API key:
        ```javascript
        const apiKey = "YOUR_GEMINI_API_KEY_HERE";
        ```
        **WARNING:** Do NOT commit your API key to any version control system (like Git) if you do this. This method is only for quick local testing.
    2.  **Environment Setup (Advanced):** If you are using a more complex local server setup that can inject environment variables into your static files or JavaScript, configure it to make `API_KEY` available.
    3.  **Build Step (Not currently configured):** In a typical production setup, a build tool (like Vite or Webpack) would replace `process.env.API_KEY` with an actual key at build time. This project currently does not have such a build step.

**Security Note:** Embedding your API key directly in frontend code makes it publicly visible. For production deployments, consider proxying requests through a secure backend server that handles authentication with the Gemini API.

**2. Clone the Repository (Optional):**

```bash
git clone <repository-url>
cd <repository-directory>
