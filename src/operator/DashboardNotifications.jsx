import React from 'react';
import { FaBell, FaExclamationTriangle } from 'react-icons/fa';

export default function DashboardNotifications({ notifications, onDismiss, onMarkAllRead, showToast, toastMsg, setShowToast }) {
  return (
    <>
      {/* Toast/Snackbar Feedback */}
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{zIndex:9999, minWidth: '220px'}} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header bg-primary text-white">
            <strong className="me-auto">Info</strong>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowToast(false)} aria-label="Close"></button>
          </div>
          <div className="toast-body">{toastMsg}</div>
        </div>
      )}
      {/* Notifications/Alerts Area */}
      {notifications.length > 0 && (
        <div className="mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light d-flex align-items-center">
              <FaBell className="me-2 text-warning" />
              <span className="fw-bold">Notifications</span>
              <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={onMarkAllRead} aria-label="Mark all as read">Mark all as read</button>
            </div>
            <ul className="list-group list-group-flush">
              {notifications.map(n => (
                <li key={n.id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <span className="me-3">
                      {n.type === 'warning' ? <FaExclamationTriangle className="text-warning" title="Warning" /> : <FaBell className="text-info" title="Info" />}
                    </span>
                    <span>{n.message}</span>
                    <span className="text-muted small ms-3">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary ms-2" aria-label="Dismiss notification" onClick={() => onDismiss(n.id)}>&times;</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
} 