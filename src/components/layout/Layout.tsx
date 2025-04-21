import { Outlet } from 'react-router-dom';
import Header from '../common/Header';
import { Session } from '@supabase/supabase-js';
import type { Stripe } from '@stripe/stripe-js';
import { UserProfile } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  session: Session | null;
  stripePromise: Promise<Stripe | null>;
  userProfile: UserProfile | null;
  isLoadingAuth: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, session /*, stripePromise, userProfile, isLoadingAuth*/ }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header session={session} />
      <main className="flex-grow container mx-auto p-4 mt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 