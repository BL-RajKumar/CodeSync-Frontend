# CodeSync Frontend

CodeSync is a real-time collaborative code editing platform. This is the frontend repository, built using modern web technologies to provide a rich, interactive developer experience.

## Tech Stack

* **Framework:** [React 19](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Routing:** [React Router](https://reactrouter.com/)
* **Code Editor:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (`@monaco-editor/react`)
* **Real-time Communication:** [Socket.IO Client](https://socket.io/)
* **Icons:** [Lucide React](https://lucide.dev/)

## Features

* **Real-time Collaboration:** Edit code simultaneously with other users via WebSockets.
* **Intelligent Code Editor:** Syntax highlighting, autocomplete, and advanced editing features powered by Monaco Editor.
* **Authentication:** Seamless user login and registration system using secure HTTP-only cookies.
* **Admin Dashboard:** Manage users, monitor active collaborative sessions, and broadcast announcements.
* **Responsive UI:** Fully responsive glassmorphism design with an elegant dark mode aesthetic.
* **Code Execution:** Run code directly in the browser using the integrated sandbox UI.

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

## Deployment Instructions

When deploying to a platform like **Render**, **Vercel**, or **Netlify**:

1. Ensure the Build Command is set to: `npm run build`
2. Ensure the Publish Directory is set to: `dist`
3. Add the `VITE_API_URL` environment variable to your deployment dashboard.
4. **Important:** Because this is a React Single Page Application (SPA), you must configure URL rewrites to prevent 404 errors on refresh. 
   * **On Render:** Add a Rewrite rule for `/*` -> `/index.html`.
   * **On Vercel:** Add a `vercel.json` file with `rewrites` pointing `/(.*)` to `/index.html`.
