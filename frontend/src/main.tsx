import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "18px",
            background: "rgba(10, 19, 26, 0.96)",
            color: "#f3f7f9",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
