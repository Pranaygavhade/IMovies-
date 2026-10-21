import React from 'react';

export const MovieCardSkeleton = () => {
  return (
    <div className="col-xl-3 col-lg-4 col-sm-6 mb-4">
      <div className="glass-card p-2 h-100">
        <div className="skeleton-box mb-3" style={{ aspectRatio: '2/3', width: '100%' }}></div>
        <div className="skeleton-box mb-2" style={{ height: '22px', width: '75%' }}></div>
        <div className="skeleton-box mb-3" style={{ height: '16px', width: '45%' }}></div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="skeleton-box" style={{ height: '20px', width: '30%' }}></div>
          <div className="skeleton-box" style={{ height: '34px', width: '40%' }}></div>
        </div>
      </div>
    </div>
  );
};

export const Spinner = ({ text = 'Loading...' }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5">
      <div className="spinner-border text-danger mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted small">{text}</p>
    </div>
  );
};
