import { useState } from "react";

export default function ProfileSetup({ gender, onDone }) {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");

  const submit = () => {
    onDone({ nickname, bio });
  };

  return (
    <div className="step">
      <h1>Create Profile</h1>
      <p className="subtitle">Verified as: <b>{gender}</b></p>

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

      <button onClick={submit} disabled={!nickname}>
        Finish Setup
      </button>
    </div>
  );
}
