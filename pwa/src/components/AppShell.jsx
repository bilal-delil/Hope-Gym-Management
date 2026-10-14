import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="app-frame">
      <div className="app-glow" aria-hidden="true" />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
