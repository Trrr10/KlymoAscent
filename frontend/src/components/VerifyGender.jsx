<input
  type="file"
  accept="image/*"
  capture="user"
  disabled
/>
export default function VerifyGender({ onNext }) {
  return (
    <div>
      <h2>Live Verification</h2>
      <p>We will access your camera once</p>

      <button onClick={onNext}>Verify</button>
    </div>
  );
}
