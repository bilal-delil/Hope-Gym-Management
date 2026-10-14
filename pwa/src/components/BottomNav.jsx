import { NavLink } from 'react-router-dom';
import {
  IconCheckIn,
  IconClasses,
  IconHome,
  IconPayments,
  IconProfile,
} from './icons';

const tabs = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/classes', label: 'Classes', icon: IconClasses },
  { to: '/check-in', label: 'Check-in', icon: IconCheckIn },
  { to: '/payments', label: 'Payments', icon: IconPayments },
  { to: '/profile', label: 'Profile', icon: IconProfile },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' is-active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span className="bottom-nav__icon">
                <Icon active={isActive} />
              </span>
              <span className="bottom-nav__label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
