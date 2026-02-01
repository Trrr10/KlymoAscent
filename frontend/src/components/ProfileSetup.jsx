import { useState } from "react";

export default function ProfileSetup({ gender, onDone }) {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");

  const submit = () => {
    const profile = { nickname, bio };
    localStorage.setItem("profile", JSON.stringify(profile));
    onDone(profile);
  };

  return (
    <div>
      <h2>Create Profile</h2>
      <p>Verified as: {gender}</p>

      <input
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <textarea
        placeholder="Short bio (max 80 chars)"
        maxLength={80}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <button onClick={submit}>Finish</button>
    </div>
  );
}
