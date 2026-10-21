import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="d-inline-flex p-4 rounded-circle bg-danger bg-opacity-10 text-danger mb-3">
        <Film size={64} />
      </div>
      <h1 className="font-display display-1 text-white fw-bold mb-2">404</h1>
      <h2 className="font-heading text-white fs-3 mb-2">Scene Not Found</h2>
      <p className="text-muted small mb-4" style={{ maxWidth: '420px' }}>
        The reel you are looking for has been cut from the final film or moved to another theatre.
      </p>
      <Link to="/" className="btn btn-cinema d-inline-flex align-items-center gap-2 px-4 py-2">
        <Home size={18} /> Return to Homepage
      </Link>
    </div>
  );
};

export default NotFound;

