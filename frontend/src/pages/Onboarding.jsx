import { useState } from "react";
import Rules from "../components/Rules";
import VerifyGender from "../components/VerifyGender";
import ProfileSetup from "../components/ProfileSetup";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState(null);

  return (
    <>
      {step === 0 && <Rules onAccept={() => setStep(1)} />}
      {step === 1 && (
        <VerifyGender
          onVerified={(g) => {
            setGender(g);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <ProfileSetup
          gender={gender}
          onDone={(profile) => {
            console.log("FINAL DATA:", {
              deviceId: localStorage.getItem("deviceId"),
              gender,
              profile,
            });
          }}
        />
      )}
    </>
  );
}
