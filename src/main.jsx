import "./brand.css";
import React from 'react';import{createRoot}from'react-dom/client';import'leaflet/dist/leaflet.css';import'./index.css';import'./i18n';import App from'./App';createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

// Hide the in-page startup emblem after React has rendered.
window.addEventListener("load", () => {
  const splash = document.getElementById("heritage-startup");
  if (splash) {
    splash.classList.add("is-ready");
    window.setTimeout(() => splash.remove(), 350);
  }
});