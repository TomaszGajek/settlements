# Settlements

[![Status](https://img.shields.io/badge/status-in_development-yellow.svg)](https://github.com/your-username/settlements)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A web-based MVP (Minimum Viable Product) application designed for simple and effective home budget management.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

---

## Project Description

**Settlements** allows users to manually record their monthly income and expenses, categorize them, and visualize the data to gain a better understanding of their financial situation. The target audience is individuals looking for an intuitive, straightforward tool for tracking their finances without the complexity of advanced features. The application is built on the Supabase platform and features a dark-theme UI designed for desktop use.

## Tech Stack

### Frontend
- **Framework**: [Astro 5](https://astro.build/)
- **UI Library**: [React 19](https://react.dev/) for interactive components
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Shadcn/ui](https://ui.shadcn.com/)

### Backend
- **Platform**: [Supabase](https://supabase.io/)
  - PostgreSQL Database
  - Authentication
  - Backend-as-a-Service (BaaS)

### CI/CD & Hosting
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Hosting**: [DigitalOcean](https://www.digitalocean.com/) (via Docker)

## Getting Started Locally

Follow these instructions to set up the project on your local machine.

### Prerequisites

- **Node.js**: Version `22.14.0` (it's recommended to use [nvm](https://github.com/nvm-sh/nvm)).
- **npm**: Should be installed with Node.js.
- **Supabase Account**: You'll need a Supabase project to get your API keys.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/settlements.git
    cd settlements
    ```

2.  **Set up the correct Node.js version (optional, if you use nvm):**
    ```sh
    nvm use
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```
    Then, add your Supabase project URL and Anon Key to the `.env` file:
    ```
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application should now be running at `http://localhost:4321`.

## Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`
  - Starts the application in development mode.

- `npm run build`
  - Builds the application for production to the `dist/` folder.

- `npm run preview`
  - Runs a local server to preview the production build.

- `npm run lint`
  - Lints the codebase for potential errors and style issues.

- `npm run lint:fix`
  - Automatically fixes linting issues.

- `npm run format`
  - Formats the code using Prettier.

## Project Scope

### Key Features (MVP)

- **Authentication**: User registration, login, password reset, and account deletion.
- **Dashboard**: A central view of financial data for the current month, with navigation to other months/years.
- **Summary Cards**: Quick summaries for total "Income", "Expenses", and "Balance".
- **Visualizations**: A bar chart visualizing daily income and expenses.
- **Transaction Management**: Add, edit, and delete transactions through a modal.
- **Category Management**: Add, edit, and delete custom income/expense categories.
- **Infinite Scroll**: Seamlessly load more transactions as you scroll.
- **UI/UX**: A clean, dark-mode interface designed for desktop, with toast notifications and loading indicators.

### Out of Scope (For Now)

- Mobile apps and responsive design.
- Multi-currency support.
- Data import/export features (e.g., from/to CSV).
- Advanced reporting, filtering, and transaction searching.
- A user onboarding tutorial.
- Bulk operations (e.g., mass-deleting transactions).

## Project Status

This project is currently in the **Minimum Viable Product (MVP) development phase**. New features are being implemented, and existing ones are subject to change.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
