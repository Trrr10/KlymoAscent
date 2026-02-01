import { useEffect } from "react";
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
    <div style={{ padding: "20px" }}>
      <Onboarding />
    </div>
  );
}

export default App;