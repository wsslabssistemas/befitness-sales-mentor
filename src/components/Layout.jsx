import { Outlet } from 'react-router-dom';
import InstallPWABanner from '@/components/InstallPWABanner';
import Sidebar from './Sidebar';
import NotificationProvider from './NotificationProvider';

export default function Layout() {
  return (
    <>
      <NotificationProvider />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <InstallPWABanner />
    </>
  );
}