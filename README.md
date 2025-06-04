
# DayFlow Tracker

**Project Owner/Creator:** [Your Name / Your Organization Name Here]

DayFlow Tracker is a Next.js web application designed to help users meticulously log their daily activities on an hourly basis. It offers features for categorizing activities, setting priorities, and leveraging AI-powered insights for generating summary reports and professional growth suggestions. The application uses Genkit with Google's Gemini model for its AI capabilities and stores data locally in the browser.

## 1. Introduction

This document provides a comprehensive overview of the DayFlow Tracker application, including its features, technical architecture, setup instructions, and usage guidelines.

## 2. Features

*   **Hourly Activity Logging**: Track activities for each hour of the day.
*   **Date Navigation**: View and log activities for any selected date. Data is saved per day.
*   **Customizable Categories**: Define personalized activity categories with unique names and icons (from `lucide-react`).
*   **Activity Prioritization**: Assign 'High', 'Medium', or 'Low' priority to tasks.
*   **AI-Powered Activity Suggestions**: Receive real-time activity description suggestions as you type, powered by Gemini.
*   **Aggregated Daily Stats**: Visualize time spent on each category with a bar chart.
*   **AI Daily Summary Report**: Get an AI-generated summary of the day's activities, highlighting key tasks based on priority and description.
*   **Downloadable CSV Reports**:
    *   Download a comprehensive daily report in CSV format for the selected day.
    *   Includes:
        *   Detailed hourly activity log.
        *   Time allocation summary (data for creating graphs in Excel/Sheets).
        *   AI-generated "Professional Growth Report".
        *   AI-generated "Improvement Suggestions".
*   **Dynamic UI**: Live clock displaying current day, date, and time.
*   **Responsive Design**: User-friendly interface on desktop and mobile devices.
*   **Local Data Persistence**: All activity logs and category settings are saved in the browser's localStorage, organized by date for activities.

## 3. Technical Stack

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

## 4. Getting Started

### 4.1. Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### 4.2. Environment Variables

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

### 4.3. Installation

1.  Clone the repository (or if you're starting from these files, ensure you're in the project root).
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### 4.4. Running the Application

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

## 5. Building for Production

1.  Build the Next.js application:
    ```bash
    npm run build
    ```
2.  Start the Next.js production server:
    ```bash
    npm run start
    ```
    Note: For a production deployment, ensure your Genkit flows are also deployed and accessible by your Next.js backend. The current setup is primarily for local development. `apphosting.yaml` suggests deployment on Firebase App Hosting, which would handle running the Next.js app. Genkit flows might need separate deployment or integration depending on the hosting strategy.

## 6. Project Structure

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

## 7. AI Flows

The application utilizes several Genkit flows for its intelligent features:

### 7.1. `src/ai/flows/suggest-activity-flow.ts`
*   **Purpose**: Provides real-time activity suggestions as the user types in the activity description field.
*   **Input**: Current user input string and optionally the hour of the day (0-23).
*   **Output**: An array of 3-5 relevant activity string suggestions.
*   **Behavior**: Called on-the-fly to assist with faster and more consistent activity logging.

### 7.2. `src/ai/flows/generate-summary-report.ts`
*   **Purpose**: Generates a daily summary report based on the logged activities for a specific day.
*   **Input**: JSON string of the day's activities, including hour, description, category, and priority.
*   **Output**: A string containing a narrative summary, highlighting key activities and up to 5 top important tasks based on priority.
*   **Behavior**: Used to provide a quick overview of the day's accomplishments and focus areas.

### 7.3. `src/ai/flows/generate-professional-growth-report.ts`
*   **Purpose**: Analyzes daily activities to provide a professional growth report and actionable improvement suggestions.
*   **Input**: JSON string of the day's activities.
*   **Output**: An object containing:
    *   `professionalGrowthReport`: Text analyzing productive patterns or skill development areas.
    *   `improvementSuggestions`: Actionable tips for productivity, time management, or skill balance.
*   **Behavior**: This flow is invoked when the user requests to download the comprehensive daily CSV report, enriching it with personalized insights.

## 8. LocalStorage Usage

The application uses the browser's `localStorage` for data persistence, ensuring user data is saved across sessions without requiring a backend database for this version.

*   **Categories**:
    *   **Key**: `dayflow_categories`
    *   **Data**: An array of user-defined `Category` objects.
    *   **Scope**: Global for the application.
*   **Activity Logs**:
    *   **Key**: `dayflow_activities_YYYY-MM-DD` (e.g., `dayflow_activities_2023-10-27`)
    *   **Data**: An array of `ActivityLog` objects for the specified date.
    *   **Scope**: Each day's log is stored as a separate entry, allowing users to navigate and manage activities for different dates.

This local storage strategy allows for easy retrieval of data for specific dates and persistence of user preferences.

## 9. Converting to PDF

This Markdown document (`README.md`) can be easily converted to a PDF file using various tools, such as:
*   Pandoc (a universal document converter).
*   Online Markdown to PDF converters.
*   Extensions within code editors like Visual Studio Code.

This allows for a professionally formatted document suitable for corporate distribution.
