import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { User, Mail, Phone, Lock, Shield, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { updateUserProfile } from '../redux/slices/authSlice';
import api from '../api/axios';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="profile-page container py-5">
      <div className="row g-4 justify-content-center">
        {/* User Card */}
        <div className="col-lg-4">
          <div className="glass-panel p-4 text-center">
            <div className="position-relative d-inline-block mb-3">
              <img
                src={
                  profileData.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                }
                alt={user?.name}
                className="rounded-circle border border-3 border-danger shadow"
                style={{ width: '110px', height: '110px', objectFit: 'cover' }}
              />
              {user?.role === 'admin' && (
                <span
                  className="position-absolute bottom-0 end-0 badge bg-danger p-1 rounded-circle"
                  title="Administrator"
                >
                  <Shield size={16} />
                </span>
              )}
            </div>

            <h3 className="font-heading text-white fs-4 mb-1">{user?.name}</h3>
            <p className="text-muted small mb-2">{user?.email}</p>
            <span className="badge bg-dark border border-secondary text-uppercase px-2 py-1 small">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="col-lg-8">
          {/* Profile Form */}
          <div className="glass-panel p-4 mb-4">
            <h4 className="font-heading text-white fs-5 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              Personal Information
            </h4>
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="text-muted small fw-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-sm-6">
                  <label className="text-muted small fw-semibold mb-1">Email (Registered)</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-muted border-secondary py-2"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="col-sm-6">
                  <label className="text-muted small fw-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>

                <div className="col-sm-6">
                  <label className="text-muted small fw-semibold mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={profileData.avatar}
                    onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="text-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn btn-cinema btn-sm px-4 fw-bold"
                >
                  {updatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-panel p-4">
            <h4 className="font-heading text-white fs-5 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              Security & Password
            </h4>
            <form onSubmit={handlePasswordSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-sm-4">
                  <label className="text-muted small fw-semibold mb-1">Current Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-sm-4">
                  <label className="text-muted small fw-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-sm-4">
                  <label className="text-muted small fw-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="text-end">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="btn btn-outline-cinema btn-sm px-4 fw-bold"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

