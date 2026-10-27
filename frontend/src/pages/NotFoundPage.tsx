import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-crimson-600/20 text-crimson-500 mx-auto flex items-center justify-center">
        <Film className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white">404 - Page Not Found</h1>
      <p className="text-sm text-cinema-400 max-w-sm mx-auto">
        The cinematic scene you're looking for seems to have been cut from the final reel.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-semibold rounded-xl text-xs transition"
      >
        <Home className="w-4 h-4" />
        Return to Home
      </Link>
    </div>
  );
};
