import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="nav">
      <Link to="/" className="brand">
        <img src="/logo.png" alt="CrestUp logo" className="brand-logo" />
        <span>CrestUp</span>
      </Link>
      <div className="nav-links">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Home
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Courses
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Dashboard
        </NavLink>
      </div>
    </nav>
  );
}
