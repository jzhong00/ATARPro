import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// import Header from './common/Header'; // Remove Header import
import { Session } from '@supabase/supabase-js'; // Import Session type

// Define props for LandingPage
interface LandingPageProps {
  session: Session | null;
}

const LandingPage: React.FC<LandingPageProps> = (/*{ session }*/) => {
  // const navigate = useNavigate(); // No longer needed here
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const openLightbox = (imageSrc: string) => {
    setLightboxImage(imageSrc);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = ''; // Restore scrolling
  };

  return (
    <div className="">

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 sm:px-10 bg-gradient-to-br from-blue-50 to-blue-200">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12">
              <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
                Accurate ATAR Predictions for Queensland Students
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Fast, data-driven ATAR prediction tool specifically designed for Queensland's unique education system.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Or, try our simplified <Link to="/guest-calculator" className="text-blue-700 hover:text-blue-800 hover:underline font-medium">Free ATAR Calculator</Link> instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#learn-more" className="bg-white border border-blue-200 hover:bg-gray-50 text-blue-600 text-center font-medium py-3 px-8 rounded-lg transition-colors duration-300">
                  Learn More
                </a>
              </div>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0">
              <div className="bg-white rounded-lg shadow-md p-2 py-4 border border-gray-200">
                <img 
                  src="/images/Single_Student_Screenshot.avif" 
                  alt="ATAR Calculator Interface" 
                  className="rounded-md w-full cursor-pointer"
                  onClick={() => openLightbox('/images/Single_Student_Screenshot.avif')}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Screenshots Section */}
      <section id="learn-more" className="py-16 px-6 sm:px-10 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-blue-800 mb-12">Simple. Fast. Accurate.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Single Student Calculator */}
            <div 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-2 py-4 bg-blue-50 border-b border-blue-100 h-60 flex items-center justify-center">
                <img 
                  src="/images/Single_Student_Screenshot.avif" 
                  alt="Single Student Calculator" 
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  onClick={() => openLightbox('/images/Single_Student_Screenshot.avif')}
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Single Student Calculator</h3>
                <p className="text-gray-600">Enter results to instantly predict a student's ATAR.</p>
              </div>
            </div>
            
            {/* Cohort Calculator */}
            <div 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-2 py-4 bg-blue-50 border-b border-blue-100 h-60 flex items-center justify-center">
                <img 
                  src="/images/CohortCalculator1.avif" 
                  alt="Cohort Calculator" 
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  onClick={() => openLightbox('/images/CohortCalculator1.avif')}
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Cohort Calculator</h3>
                <p className="text-gray-600">Upload whole cohorts and export professional reports.</p>
              </div>
            </div>
            
            {/* SET Planning Calculator */}
            <div 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-2 py-4 bg-blue-50 border-b border-blue-100 h-60 flex items-center justify-center">
                <img 
                  src="/images/SetPlanningCalculator.avif" 
                  alt="SET Planning Calculator" 
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  onClick={() => openLightbox('/images/SetPlanningCalculator.avif')}
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">SET Planning Calculator</h3>
                <p className="text-gray-600">Estimate ATAR ranges based on student self-assessment.</p>
              </div>
            </div>
            
            {/* Scaling Graphs */}
            <div 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-2 py-4 bg-blue-50 border-b border-blue-100 h-60 flex items-center justify-center">
                <img 
                  src="/images/ScalingGraphs.avif" 
                  alt="Scaling Graphs" 
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  onClick={() => openLightbox('/images/ScalingGraphs.avif')}
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Scaling Graphs</h3>
                <p className="text-gray-600">Visualise how raw scores scale across subjects and years.</p>
              </div>
            </div>
            
            {/* Equivalent Subject Calculator */}
            <div 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-2 py-4 bg-blue-50 border-b border-blue-100 h-60 flex items-center justify-center">
                <img 
                  src="/images/EquivalentSubjectCalculator.avif" 
                  alt="Equivalent Subject Calculator"
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  onClick={() => openLightbox('/images/EquivalentSubjectCalculator.avif')}
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Equivalent Subject Calculator</h3>
                <p className="text-gray-600">Compare subject scaling to make smarter choices.</p>
              </div>
            </div>
            
            {/* PDF Reports */}
            <div 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-2 py-4 bg-blue-50 border-b border-blue-100 h-60 flex items-center justify-center">
                <img 
                  src="/images/Printout_example.avif" 
                  alt="PDF Export Example"
                  className="w-full h-full object-contain cursor-pointer rounded-lg"
                  onClick={() => openLightbox('/images/Printout_example.avif')}
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">PDF Reports</h3>
                <p className="text-gray-600">Export a polished PDF with subject results and ATAR predictions for sharing or printing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button 
              className="absolute -top-12 right-0 text-white bg-blue-700 hover:bg-blue-800 rounded-full p-2"
              onClick={closeLightbox}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={lightboxImage} 
              alt="Enlarged view" 
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
            />
          </div>
        </div>
      )}

      {/* Video Section */}
      <section className="py-16 px-6 sm:px-10 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-blue-800 mb-6">How It Works</h2>
          <p className="text-gray-600 mb-8">Watch this 1-minute explainer to see how ATAR Predictions QLD can help you plan your academic journey.</p>
          
          <div className="bg-white rounded-lg shadow-md p-2 py-4 mb-10 border border-gray-200">
            <div className="w-full h-0 pb-[56.25%] relative bg-gray-50 rounded-md flex items-center justify-center">
              {/* Placeholder for video - in production, replace with actual video embed */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 text-blue-500 mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.75.75 0 010 1.32l-5.5 3.25a.75.75 0 01-1.16-.626v-6.5a.75.75 0 011.16-.626l5.5 3.25z" />
                </svg>
                <p className="text-gray-500">1-minute explainer video</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 sm:px-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Calculate Your ATAR?</h2>
          <p className="text-blue-100 mb-8">Get accurate ATAR calculations for your entire cohort instantly.</p>
          <Link
            to="/auth?view=sign_up"
            className="inline-block bg-white text-blue-700 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer - kept minimal */}
      <footer className="py-8 px-6 sm:px-10 bg-blue-800 border-t border-blue-700">
        <div className="container mx-auto">
          <p className="text-sm text-center text-white">© {new Date().getFullYear()} ATAR Predictions QLD</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 