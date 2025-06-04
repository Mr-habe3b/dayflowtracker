
# DayFlow Tracker

DayFlow Tracker is a Next.js web application designed to help users meticulously log their daily activities on an hourly basis. It offers features for categorizing activities, setting priorities, and leveraging AI-powered insights for generating summary reports and professional growth suggestions. The application uses Genkit with Google's Gemini model for its AI capabilities and stores data locally in the browser.

## Features

*   **Hourly Activity Logging**: Track activities for each hour of the day.
*   **Date Navigation**: View and log activities for any selected date. Data is saved per day.
*   **Customizable Categories**: Define personalized activity categories with unique names and icons (from `lucide-react`).
*   **Activity Prioritization**: Assign 'High', 'Medium', or 'Low' priority to tasks.
*   **AI-Powered Activity Suggestions**: Receive real-time activity description suggestions as you type, powered by Gemini.
*   **Aggregated Daily Stats**: Visualize time spent on each category with a bar chart.
*   **AI Daily Summary Report**: Get an AI-generated summary of the day's activities, highlighting key tasks based on priority and description.
*   **Downloadable CSV Reports**:
    *   Download a comprehensive daily report in CSV format.
    *   Includes:
        *   Detailed hourly activity log.
        *   Time allocation summary (data for creating graphs in Excel/Sheets).
        *   AI-generated "Professional Growth Report".
        *   AI-generated "Improvement Suggestions".
*   **Dynamic UI**: Live clock displaying current day, date, and time.
*   **Responsive Design**: User-friendly interface on desktop and mobile devices.
*   **Local Data Persistence**: All activity logs and category settings are saved in the browser's localStorage, organized by date for activities.

## Tech Stack

*   **Frontend**:
    *   Next.js 15 (App Router)
    *   React 18
    *   TypeScript
*   **UI Components**:
    *   ShadCN UI
    *   Lucide Icons
*   **Styling**:
    *   Tailwind CSS
*   **AI Integration**:
    *   Genkit
    *   Google Gemini (via `@genkit-ai/googleai`)
*   **Charting**:
    *   Recharts
*   **Date Management**:
    *   `date-fns`
*   **State Management**: React Hooks (useState, useEffect, useCallback)
*   **Linting/Formatting**: ESLint, Prettier (as per Next.js defaults)

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Environment Variables

This project uses Genkit with the Google AI plugin, which typically requires a Google API key for accessing services like the Gemini API.

1.  Create a `.env` file in the root of the project:
    ```bash
    touch .env
    ```
2.  Add your Google API key to the `.env` file. This key is necessary for the AI features to work.
    ```env
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
    ```
    You can obtain an API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  Clone the repository (or if you're starting from these files, ensure you're in the project root).
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application

The application consists of two main parts: the Next.js frontend and the Genkit AI flows. Both need to be running for full functionality.

1.  **Start the Next.js Development Server**:
    Open a terminal and run:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.

2.  **Start the Genkit Development Server**:
    Open another terminal and run:
    ```bash
    npm run genkit:dev
    # or for auto-reloading on changes to flow files:
    npm run genkit:watch
    ```
    This starts the Genkit development environment, making the AI flows available to the Next.js application. By default, it might run a UI on `http://localhost:4000` for inspecting flows.

### Building for Production

1.  Build the Next.js application:
    ```bash
    npm run build
    ```
2.  Start the Next.js production server:
    ```bash
    npm run start
    ```
    Note: For a production deployment, ensure your Genkit flows are also deployed and accessible by your Next.js backend. The current setup is primarily for local development. `apphosting.yaml` suggests deployment on Firebase App Hosting, which would handle running the Next.js app. Genkit flows might need separate deployment or integration depending on the hosting strategy.

## Project Structure

*   `src/`
    *   `app/`: Next.js App Router pages and layouts.
        *   `page.tsx`: Main application page.
        *   `layout.tsx`: Root layout.
        *   `globals.css`: Global styles and Tailwind CSS theme.
    *   `components/`: Reusable React components.
        *   `dayflow/`: Components specific to the DayFlow Tracker functionality (DayView, CategoryManager, etc.).
        *   `ui/`: ShadCN UI components.
    *   `ai/`: Genkit AI integration.
        *   `flows/`: Definitions for AI flows (e.g., report generation, activity suggestions).
        *   `genkit.ts`: Genkit global instance initialization.
        *   `dev.ts`: Genkit development server entry point.
    *   `hooks/`: Custom React hooks (e.g., `useToast`, `useIsMobile`).
    *   `lib/`: Utility functions (e.g., `cn` for classnames).
    *   `types/`: TypeScript type definitions (e.g., `dayflow.ts`).
*   `public/`: Static assets.
*   `package.json`: Project dependencies and scripts.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.ts`: Next.js configuration.
*   `tsconfig.json`: TypeScript configuration.
*   `apphosting.yaml`: Firebase App Hosting configuration.
*   `.env`: Environment variables (needs to be created locally).

## AI Flows

The application utilizes several Genkit flows:

1.  **`src/ai/flows/suggest-activity-flow.ts`**:
    *   Provides real-time activity suggestions as the user types in the activity description field.
    *   Takes current input and optionally the hour of the day as context.

2.  **`src/ai/flows/generate-summary-report.ts`**:
    *   Generates a daily summary report based on the logged activities.
    *   Highlights key activities and identifies top important tasks based on priority.

3.  **`src/ai/flows/generate-professional-growth-report.ts`**:
    *   Analyzes daily activities to provide a professional growth report.
    *   Offers actionable suggestions for improving productivity, time management, or skill balance.

## LocalStorage Usage

*   **Categories**: User-defined categories are stored under the key `dayflow_categories`.
*   **Activity Logs**: Daily activities are stored under keys prefixed with `dayflow_activities_`, followed by the date in `yyyy-MM-dd` format (e.g., `dayflow_activities_2023-10-27`). Each day's log is stored as a separate entry.

This structure allows for easy retrieval of data for specific dates and persistence of user preferences across sessions.
