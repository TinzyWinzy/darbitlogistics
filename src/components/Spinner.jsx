import React from 'react';

const Spinner = () => (
  <div className="d-flex justify-content-center align-items-center py-4">
    <div className="spinner-border" style={{ color: '#D2691E' }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default Spinner; 