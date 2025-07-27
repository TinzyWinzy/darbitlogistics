import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../services/api';
// import { FaUser, FaCreditCard, FaHistory, FaTrash, FaPlus, FaEdit, FaCheck, FaTimes } from 'react-icons/fa'; // Uncomment if react-icons is available

function Badge({ children, color }) {
  const bg = {
    primary: '#2563eb', // blue
    success: '#16a34a', // green
    warning: '#f59e42',
    danger: '#dc2626',
    gray: '#6b7280',
  }[color] || '#6b7280';
  return (
    <span style={{ background: bg, color: '#fff', borderRadius: '0.5em', padding: '0.2em 0.7em', fontSize: '0.95em', fontWeight: 500, letterSpacing: '0.01em' }}>{children}</span>
  );
}

function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>
      ))}
    </tr>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center text-muted py-4">
      <div style={{ fontSize: '2.5em', opacity: 0.2 }}>🗂️</div>
      <div>{message}</div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString();
}

const TABS = [
  { key: 'users', label: 'Users', icon: '👤' },
  { key: 'billing', label: 'Billing', icon: '💳' },
  { key: 'actions', label: 'Admin Actions', icon: '📜' },
];

const normalizeSubscription = (sub) => ({
  subscription_id: sub.subscription_id || sub.id,
  user_id: sub.user_id,
  username: sub.username || sub.user_id,
  tier: sub.tier,
  status: sub.status,
  deliveries_used: sub.deliveries_used ?? 0,
  sms_used: sub.sms_used ?? 0,
  start_date: sub.start_date,
  end_date: sub.end_date,
  tierDetails: sub.tierDetails || {},
});

const AdminDashboard = () => {
  const [tab, setTab] = useState('users');
  // Users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userError, setUserError] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [createUserError, setCreateUserError] = useState('');
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteUserError, setDeleteUserError] = useState('');
  // Billing
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [subsError, setSubsError] = useState('');
  const [editSubId, setEditSubId] = useState(null);
  const [editSubData, setEditSubData] = useState({ tier: '', status: '' });
  // Logs
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState('');
  // Toast
  const [toast, setToast] = useState(null);
  // Add state to track original subscription when editing
  const [editSubOriginal, setEditSubOriginal] = useState({ tier: '', status: '', end_date: '' });

  // Fetchers
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true); setUserError('');
    try {
      const fetched = await deliveryApi.admin.getAllUsers();
      setUsers(fetched);
    } catch (err) {
      setUserError(err.response?.data?.error || 'Failed to fetch users.');
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoadingSubs(true); setSubsError('');
    try {
      const subs = await deliveryApi.getAllSubscriptions();
      setSubscriptions(subs.map(normalizeSubscription));
    } catch (err) {
      setSubsError(err.response?.data?.error || 'Failed to fetch subscriptions.');
      setSubscriptions([]);
    } finally {
      setIsLoadingSubs(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true); setLogsError('');
    try {
      const logs = await deliveryApi.admin.getLogs();
      setLogs(logs);
    } catch (err) {
      setLogsError('Failed to load logs');
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'billing') fetchSubscriptions();
    if (tab === 'actions') fetchLogs();
  }, [tab, fetchUsers, fetchSubscriptions, fetchLogs]);

  // User creation
  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  const handleCreateUser = async e => {
    e.preventDefault();
    setCreateUserError('');
    if (!newUser.username || !newUser.password) {
      setCreateUserError('Username and password are required.');
      return;
    }
    try {
      await deliveryApi.admin.createUser(newUser);
      setNewUser({ username: '', password: '', role: 'operator' });
      setShowCreateUser(false);
      setToast({ type: 'success', msg: 'User created.' });
      fetchUsers();
    } catch (err) {
      setCreateUserError(err.response?.data?.error || 'Failed to create user.');
    }
  };
  // User delete
  const handleDeleteUser = async userId => {
    setDeleteUserError('');
    setDeleteUserId(userId);
  };
  const confirmDeleteUser = async () => {
    try {
      await deliveryApi.admin.deleteUser(deleteUserId);
      setToast({ type: 'success', msg: 'User deleted.' });
      setDeleteUserId(null);
      fetchUsers();
    } catch (err) {
      setDeleteUserError(err.response?.data?.error || 'Failed to delete user.');
    }
  };
  // Billing edit
  const handleEditSub = sub => {
    setEditSubId(sub.subscription_id);
    setEditSubData({ tier: sub.tier, status: sub.status, end_date: sub.end_date });
    setEditSubOriginal({ tier: sub.tier, status: sub.status, end_date: sub.end_date });
  };
  const handleEditSubChange = e => {
    const { name, value } = e.target;
    setEditSubData(prev => ({ ...prev, [name]: value }));
  };
  const handleSaveSub = async subId => {
    // Only send changed fields
    const payload = {};
    if (editSubData.tier !== editSubOriginal.tier) payload.newTier = editSubData.tier;
    if (editSubData.status !== editSubOriginal.status) payload.newStatus = editSubData.status;
    if (editSubData.end_date !== editSubOriginal.end_date) payload.newEndDate = editSubData.end_date;
    if (Object.keys(payload).length === 0) {
      setToast({ type: 'danger', msg: 'No changes to save.' });
      return;
    }
    try {
      await deliveryApi.updateUserSubscription(subId, payload);
      setEditSubId(null);
      setToast({ type: 'success', msg: 'Subscription updated.' });
      fetchSubscriptions();
    } catch (err) {
      setSubsError(err.response?.data?.error || 'Failed to update subscription.');
    }
  };

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === 'billing') {
      const ids = subscriptions.map(s => s.subscription_id);
      const unique = new Set(ids);
      if (ids.length !== unique.size) {
        // eslint-disable-next-line no-console
        console.warn('Duplicate subscription_id detected in subscriptions:', ids);
      }
    }
  }, [subscriptions, tab]);

  return (
    <div className="container mt-4" style={{ maxWidth: 1100 }}>
      <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
        STRATEGIC OPERATIONS CONSOLE
      </div>
      <h2 className="mb-3">Admin Dashboard</h2>
      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottom: '2px solid #e5e7eb' }}>
        {TABS.map(t => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link d-flex align-items-center${tab === t.key ? ' active' : ''}`}
              style={{ fontWeight: tab === t.key ? 600 : 400, borderBottom: tab === t.key ? '3px solid #2563eb' : 'none', background: 'none' }}
              onClick={() => setTab(t.key)}
            >
              <span style={{ fontSize: '1.2em', marginRight: 6 }}>{t.icon}</span> {t.label}
            </button>
          </li>
        ))}
      </ul>
      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} position-fixed`} style={{ top: 20, right: 20, zIndex: 9999, minWidth: 200 }}>
          {toast.msg}
        </div>
      )}
      {/* USERS TAB */}
      {tab === 'users' && (
        <>
          {userError && <div className="alert alert-danger">{userError}</div>}
          {/* Create User Panel */}
          <div className="card mb-4 shadow-sm rounded-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-bold">Create New User</span>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setShowCreateUser(v => !v)}>
                {/* <FaPlus /> */} {showCreateUser ? 'Hide' : 'Add User'}
              </button>
            </div>
            {showCreateUser && (
              <div className="card-body">
                {createUserError && <div className="alert alert-danger">{createUserError}</div>}
                <form onSubmit={handleCreateUser} className="row g-2 align-items-end">
                  <div className="col-md-4">
                    <input type="text" name="username" className="form-control" placeholder="Username" value={newUser.username} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-4">
                    <input type="password" name="password" className="form-control" placeholder="Password" value={newUser.password} onChange={handleInputChange} required />
                  </div>
                  <div className="col-md-3">
                    <select name="role" className="form-select" value={newUser.role} onChange={handleInputChange}>
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-md-1">
                    <button type="submit" className="btn btn-primary w-100">Create</button>
                  </div>
                </form>
              </div>
            )}
          </div>
          {/* Users Table */}
          <div className="card shadow-sm rounded-3">
            <div className="card-header fw-bold">Existing Users</div>
            <div className="card-body p-0">
              {deleteUserError && <div className="alert alert-danger m-2">{deleteUserError}</div>}
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Created At</th>
                      <th style={{ width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingUsers ? (
                      Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                    ) : users.length === 0 ? (
                      <tr><td colSpan={4}><EmptyState message="No users found. Create your first user!" /></td></tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>
                            <Badge color={user.role === 'admin' ? 'primary' : 'success'}>{user.role}</Badge>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            <button className="btn btn-outline-danger btn-sm" title="Delete User" onClick={() => handleDeleteUser(user.id)}>
                              {/* <FaTrash /> */} 🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Delete Modal */}
          {deleteUserId && (
            <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.2)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button type="button" className="btn-close" onClick={() => setDeleteUserId(null)}></button>
                  </div>
                  <div className="modal-body">
                    Are you sure you want to delete this user? This action cannot be undone.
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setDeleteUserId(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={confirmDeleteUser}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* BILLING TAB */}
      {tab === 'billing' && (
        <div className="card shadow-sm rounded-3">
          <div className="card-header fw-bold">All Subscriptions</div>
          <div className="card-body p-0">
            {subsError && <div className="alert alert-danger m-2">{subsError}</div>}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Username</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Deliveries Used</th>
                    <th>SMS Used</th>
                    <th>Start</th>
                    <th>End</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingSubs ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                  ) : subscriptions.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState message="No subscriptions found." /></td></tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.subscription_id} className={sub.subscription_id % 2 === 0 ? 'table-light' : ''} style={{ transition: 'background 0.2s' }}>
                        <td>{sub.username || sub.user_id}</td>
                        <td>
                          {editSubId === sub.subscription_id ? (
                            <select name="tier" value={editSubData.tier} onChange={handleEditSubChange} className="form-select form-select-sm">
                              <option value="starter">Starter</option>
                              <option value="basic">Basic</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          ) : (
                            <Badge color="primary">{sub.tier}</Badge>
                          )}
                        </td>
                        <td>
                          {editSubId === sub.subscription_id ? (
                            <select name="status" value={editSubData.status} onChange={handleEditSubChange} className="form-select form-select-sm">
                              <option value="active">Active</option>
                              <option value="trial">Trial</option>
                              <option value="expired">Expired</option>
                              <option value="canceled">Canceled</option>
                            </select>
                          ) : (
                            <Badge color={sub.status === 'active' ? 'success' : sub.status === 'trial' ? 'primary' : sub.status === 'expired' ? 'danger' : 'gray'}>{sub.status}</Badge>
                          )}
                        </td>
                        <td>{sub.deliveries_used} / {sub.tierDetails?.maxDeliveries ?? '-'}</td>
                        <td>{sub.sms_used} / {sub.tierDetails?.maxSms ?? '-'}</td>
                        <td>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '-'}</td>
                        <td>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}</td>
                        <td>
                          {editSubId === sub.subscription_id ? (
                            <>
                              <button
                                className="btn btn-success btn-sm me-2"
                                onClick={() => handleSaveSub(sub.subscription_id)}
                                disabled={
                                  editSubData.tier === editSubOriginal.tier &&
                                  editSubData.status === editSubOriginal.status &&
                                  editSubData.end_date === editSubOriginal.end_date
                                }
                              >Save</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setEditSubId(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => handleEditSub(sub)}>Edit</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* LOGS TAB */}
      {tab === 'actions' && (
        <div className="card shadow-sm rounded-3">
          <div className="card-header fw-bold">System Logs</div>
          <div className="card-body">
            {logsError && <div className="alert alert-danger">{logsError}</div>}
            {isLoadingLogs ? (
              <>
                <div className="skeleton mb-2" style={{ height: 18, width: '60%' }} />
                <div className="skeleton mb-2" style={{ height: 18, width: '40%' }} />
                <div className="skeleton mb-2" style={{ height: 18, width: '50%' }} />
              </>
            ) : logs.length === 0 ? (
              <EmptyState message="No recent admin actions." />
            ) : (
              <ul className="list-group">
                {logs.map((log, idx) => (
                  <li key={log.id || `${log.timestamp}-${idx}`} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{/* <FaHistory /> */} 📜 {log.message}</span>
                    <span className="text-muted small">{log.timestamp}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className="text-center text-muted small mt-5">
        For support: <a href="mailto:support@darlogistics.co.zw" style={{ color: '#1F2120' }}>support@darlogistics.co.zw</a> | <a href="tel:+263781334474" style={{ color: '#1F2120' }}>+263 781 334474</a>
        <br />
        <span className="text-danger">For authorized personnel only.</span>
      </div>
      {/* Skeleton CSS */}
      <style>{`
        .skeleton {
          background: linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 37%, #f3f3f3 63%);
          background-size: 400% 100%;
          animation: skeleton-loading 1.2s ease-in-out infinite;
        }
        @keyframes skeleton-loading {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard; 