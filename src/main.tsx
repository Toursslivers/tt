import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.scss";
import "./util/handleError";
import "./util/setupServiceWorkerVite";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
