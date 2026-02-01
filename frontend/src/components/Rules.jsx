export default function Rules({ onAccept }) {
  return (
    <div className="step">
      <h1>Privacy & Safety</h1>
      <p className="subtitle">
        Your privacy matters. Please review before continuing.
      </p>

      <ul className="rules">
        <li>🔒 No email or phone required</li>
        <li>📷 Live camera only (no uploads)</li>
        <li>🗑 Images deleted instantly</li>
        <li>🚫 No data shared with third parties</li>
      </ul>


      <button onClick={onAccept}>I Agree</button>

    </div>
  );
}
