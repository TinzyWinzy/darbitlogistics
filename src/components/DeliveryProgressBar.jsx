import React from 'react';

const DELIVERY_STATUS_STEPS = [
  'Pending',
  'At Mine',
  'In Transit',
  'At Border',
  'At Port',
  'At Port of Destination',
  'At Warehouse',
  'Delivered',
  'Cancelled'
];

const DeliveryProgressBar = ({ status }) => {
  const idx = DELIVERY_STATUS_STEPS.indexOf(status);
  const percent = idx === -1 ? 0 : Math.round((idx / (DELIVERY_STATUS_STEPS.length - 1)) * 100);
  let barColor = '#1F2120';
  if (status === 'Delivered') barColor = '#198754';
  else if (status === 'Cancelled') barColor = '#dc3545';
  return (
    <div className="progress" style={{ height: 8, background: '#f3ede7', marginBottom: 6 }} title={`Status: ${status} (${idx + 1}/${DELIVERY_STATUS_STEPS.length})`}>
      <div
        className="progress-bar"
        role="progressbar"
        style={{ width: `${percent}%`, backgroundColor: barColor, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
      </div>
    </div>
  );
};

export default DeliveryProgressBar; 