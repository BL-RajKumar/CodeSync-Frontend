# CodeSync Frontend

CodeSync is a real-time collaborative code editing and execution platform. This is the frontend repository, built using modern web technologies to provide a premium, interactive developer experience.

## Tech Stack

* **Framework:** [React 19](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Routing:** [React Router](https://reactrouter.com/)
* **Code Editor:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (`@monaco-editor/react`)
* **Real-time Communication:** [Socket.IO Client](https://socket.io/)
* **Icons:** [Lucide React](https://lucide.dev/)

---

## Features

* **Real-time Collaboration:** Edit code simultaneously with other users via WebSockets, featuring remote cursor tracking, user name tags, and active room participant listing.
* **Intelligent Code Editor:** Syntax highlighting, autocomplete, and advanced editing features powered by Monaco Editor with overflow tooltip rendering safety.
* **Code Execution:** Sandboxed code runner to execute code in multiple programming languages directly from the editor panel.
* **Dynamic Theme Toggling:** Seamless transition between dark and light modes, complete with custom Royal Purple (`#7c3aed`) button styling overrides in light mode for the Sandbox and Collab controls.
* **Responsive Logo Branding:** Officially integrated logo branding across navigation headers with shadow glow enhancements for dark backgrounds, plus corresponding favicon tab identification.
* **Language Chips:** Built-in helper component rendering custom SVG brand icons for React, Node.js, Python, Java, Go, Ruby, C++, and HTML5 within dashboard and explore project cards.
* **Authentication:** Secure user login and registration system utilizing HTTP-only cookie-based authentication credentials.
* **Admin Dashboard:** Console for user management, monitoring active collaborative sessions, viewing system jobs, and sending platform-wide real-time broadcasts.

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables. Create a `.env` file in the root of the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   *(Update this URL when deploying to point to your live backend server).*

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## Deployment Instructions

When deploying to a platform like **Render**, **Vercel**, or **Netlify**:

1. Ensure the Build Command is set to: `npm run build`
2. Ensure the Publish/Out Directory is set to: `dist`
3. Add the `VITE_API_URL` environment variable to your deployment dashboard.
4. **Important:** Because this is a React Single Page Application (SPA), you must configure URL rewrites to prevent 404 errors on browser refreshes.
   * **On Render:** Add a Rewrite rule for `/*` -> `/index.html`.
   * **On Vercel:** Add a `vercel.json` file with `rewrites` pointing `/(.*)` to `/index.html`.
