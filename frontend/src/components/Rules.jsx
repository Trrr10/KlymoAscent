export default function Rules({ onAccept }) {
  return (
    <div>
      <h1>Privacy & Rules</h1>
      <ul>
        <li>No email or phone required</li>
        <li>Live camera access only</li>
        <li>Images are deleted immediately</li>
      </ul>

      <button onClick={onAccept}>I Agree</button>
    </div>
  );
}
