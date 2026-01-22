/**
 * Application Entry Point.
 * 
 * Mounts the React application to the DOM root.
 * Imports global styles and i18n configuration.
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);
