import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import Onboarding from "./pages/Onboarding";

function App() {
  useEffect(() => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }
    console.log("Device ID:", deviceId);
  }, []);

  return (
    <BrowserRouter>
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
