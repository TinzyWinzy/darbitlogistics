import React, { useState, useEffect, useCallback } from 'react';
import { deliveryApi } from '../services/api'; // Correct the import
import { usePushNotifications } from '../services/usePushNotifications';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'operator',
  });
  const { isSubscribed, subscribeToPush, error: pushError } = usePushNotifications();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await deliveryApi.admin.getAllUsers();
      setUsers(fetchedUsers);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      setError('Username and password are required.');
      return;
    }
    try {
      await deliveryApi.admin.createUser(newUser);
      setNewUser({ username: '', password: '', role: 'operator' }); // Reset form
      fetchUsers(); // Refresh user list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deliveryApi.admin.deleteUser(userId);
        fetchUsers(); // Refresh user list
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user.');
        console.error(err);
      }
    }
  };

  return (
    <div className="container mt-4">
      {/* Internal Use Only Banner */}
      <div className="bg-warning text-dark text-center py-1 small fw-bold mb-3" style={{ letterSpacing: '1px', borderRadius: '0.5rem' }}>
        INTERNAL USE ONLY
      </div>
      <h2>Admin Dashboard: User Management</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {pushError && <div className="alert alert-danger">Push Notification Error: {pushError.message}</div>}

      <div className="card mb-4">
        <div className="card-header">
          Settings
        </div>
        <div className="card-body">
          <button 
            className="btn btn-info"
            onClick={subscribeToPush}
            disabled={isSubscribed}
          >
            {isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          Create New User
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateUser}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <select
                  name="role"
                  className="form-select"
                  value={newUser.role}
                  onChange={handleInputChange}
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-md-1">
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          Existing Users
        </div>
        <div className="card-body">
          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-muted small mt-5">
        For support: <a href="mailto:info@morres.com" style={{ color: '#1F2120' }}>info@morres.com</a> | <a href="tel:+263242303123" style={{ color: '#1F2120' }}>+263 242 303 123</a>
        <br />
        <span className="text-danger">For authorized personnel only.</span>
      </div>
    </div>
  );
};

export default AdminDashboard; 