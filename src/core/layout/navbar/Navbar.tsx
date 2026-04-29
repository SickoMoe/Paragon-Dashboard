// src/core/layout/NavBar/NavBar.tsx
import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

type Props = {
  isAuthed?: boolean;
  onLogout?: () => void;
};

const mainLinks: NavItem[] = [
  { to: "/auctions", label: "Auctions" },
  { to: "/messages", label: "Messages" },
  { to: "/users", label: "Users" },
];

export default function NavBar({ isAuthed = false, onLogout }: Props) {
  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div className="nav-left">
          <Link className="nav-brand" to="/">
            <span className="nav-brand__text">Paragon</span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {mainLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link--active" : ""}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="nav-right">
          {!isAuthed ? (
            <div className="nav-auth">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "nav-btn--active" : ""}`
                }
              >
                Log in
              </NavLink>
            </div>
          ) : (
            <div className="nav-auth">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `nav-btn ${isActive ? "nav-btn--active" : ""}`
                }
              >
                Account
              </NavLink>

              <button
                type="button"
                className="nav-btn nav-btn--ghost"
                onClick={onLogout}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}