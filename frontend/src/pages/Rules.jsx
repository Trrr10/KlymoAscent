export default function Rules({ onAccept }) {
  return (
    <div>
      <h2>Privacy & Safety Rules</h2>
      <ul>
        <li>No email or phone required</li>
        <li>Camera used only for live verification</li>
        <li>Image is deleted immediately after verification</li>
        <li>No chat history is stored</li>
      </ul>

      <button onClick={onAccept}>
        I Agree & Continue
      </button>
    </div>
  );
}
