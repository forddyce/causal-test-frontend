import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./assets/tailwind.css";
import "./assets/index.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
