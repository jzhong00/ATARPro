import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../common/Header';
// import Footer from '../common/Footer'; // Optional: Add if you have a Footer component
import { Session } from '@supabase/supabase-js';

interface PublicLayoutProps {
  session: Session | null; 
  hideHeaderAuthButtons?: boolean;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ session, hideHeaderAuthButtons = false }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Use the common Header, pass down the prop */}
      <Header session={session} showNavLinks={false} hideAuthButtons={hideHeaderAuthButtons} /> 
      <main className="flex-grow container mx-auto px-4 py-4"> {/* Added basic main styling */}
        <Outlet /> {/* Renders the matched child route component (LandingPage or Guest Calculator) */}
      </main>
      {/* <Footer /> */} {/* Optional: Add a common public footer */}
    </div>
  );
};

export default PublicLayout; 