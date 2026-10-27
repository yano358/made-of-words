import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/vt323";
import "@fontsource/jetbrains-mono/700.css";
import "./App.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
