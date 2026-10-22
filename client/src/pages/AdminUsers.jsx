import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users, Search, ChevronLeft, Shield, User, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';
import { Spinner } from '../components/common/Loader';
import UserAvatar from '../components/common/UserAvatar';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    setLoading(true);
    api
      .get(`/admin/users?search=${encodeURIComponent(search)}`)
      .then((res) => {
        setUsers(res.data.data.users);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.put(`/admin/users/${id}/toggle-status`);
      toast.success(res.data.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  return (
    <div className="admin-users container py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <Link to="/admin" className="text-muted small text-decoration-none d-flex align-items-center gap-1 mb-1 hover-white">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-heading text-white fs-2 mb-0">Audience & User Accounts</h1>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 mb-4">
        <div className="position-relative" style={{ maxWidth: '400px' }}>
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
          <input
            type="text"
            className="form-control bg-dark text-light border-secondary ps-5 py-2"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading users..." />
      ) : (
        <div className="glass-panel p-3 table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
            <thead>
              <tr className="border-secondary text-muted small text-uppercase">
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Status</th>
                <th className="text-end">Toggle Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-secondary">
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <UserAvatar user={u} size={38} showBorder={false} />
                      <div>
                        <div className="fw-bold text-white small">{u.name}</div>
                        <div className="text-muted small">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted small">{u.phone || '—'}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === 'admin' ? 'bg-danger' : 'bg-secondary'
                      } text-uppercase px-2 py-1`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="text-muted small">
                    {new Date(u.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.isActive ? 'bg-success' : 'bg-dark border border-secondary text-muted'
                      } text-uppercase px-2 py-1`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className={`btn btn-sm ${
                        u.isActive ? 'btn-outline-warning' : 'btn-outline-success'
                      } px-3`}
                      onClick={() => handleToggleStatus(u._id, u.isActive)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

