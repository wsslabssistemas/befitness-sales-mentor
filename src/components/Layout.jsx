import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationProvider from './NotificationProvider';
import OverdueEmailChecker from './OverdueEmailChecker';

export default function Layout() {
  return (
    <>
      <NotificationProvider />
      <OverdueEmailChecker />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </>
  );
}