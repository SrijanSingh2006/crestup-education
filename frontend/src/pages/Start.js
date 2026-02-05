import { Link } from "react-router-dom";

export default function Start() {
  return (
    <div className="container">
      <section className="start">
        <div className="start-card">
          <div className="start-brand">
            <span className="start-letter">C</span>
            <span className="start-type">RESTUP</span>
          </div>
          <p className="eyebrow">CrestUp Education</p>
          <h1>Welcome! Ready to learn smarter?</h1>
          <p className="muted">
            Choose how you want to continue. You can login to your account or
            create a new one in seconds.
          </p>
          <div className="start-actions">
            <Link className="btn primary" to="/login">
              Login
            </Link>
            <Link className="btn ghost" to="/signup">
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
