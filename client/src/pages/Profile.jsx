import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  CheckCircle,
  Camera,
  Trash2,
  Upload,
  X,
  MapPin,
  Calendar,
} from 'lucide-react';
import { updateUserProfile, uploadUserAvatar, removeUserAvatar } from '../redux/slices/authSlice';
import UserAvatar from '../components/common/UserAvatar';
import api from '../api/axios';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || 'Bhilai',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Avatar upload & preview state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Handle file selection from local device
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid image type. Please select a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 2MB limit. Please select a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    setUploadingAvatar(true);
    try {
      await dispatch(uploadUserAvatar(formData)).unwrap();
      toast.success('Profile photo updated successfully!');
      handleCancelPreview();
    } catch (err) {
      toast.error(err || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo? Your initials will be displayed instead.')) {
      return;
    }

    setRemovingAvatar(true);
    try {
      await dispatch(removeUserAvatar()).unwrap();
      toast.success('Profile photo removed. Initials avatar restored.');
      handleCancelPreview();
    } catch (err) {
      toast.error(err || 'Failed to remove profile photo');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();
      toast.success('Personal details updated successfully!');
    } catch (err) {
      toast.error(err || 'Failed to update personal details');
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

  // Preview or actual user object for avatar rendering
  const displayedUser = previewUrl
    ? { ...user, avatar: previewUrl }
    : user;

  return (
    <div className="profile-page container py-5">
      <div className="row g-4 justify-content-center">
        {/* Left Column: User Card & Photo Management */}
        <div className="col-lg-4">
          <div className="glass-panel p-4 text-center mb-4">
            {/* Avatar display with initials fallback */}
            <div className="position-relative d-inline-block mb-3">
              <UserAvatar
                user={displayedUser}
                size={114}
                className="shadow-lg"
                showBorder={true}
              />

              {user?.role === 'admin' && (
                <span
                  className="position-absolute bottom-0 end-0 badge bg-danger p-1 rounded-circle shadow"
                  title="Administrator Account"
                  style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Shield size={16} />
                </span>
              )}
            </div>

            {/* Hidden file input for manual upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="d-none"
            />

            <h3 className="font-heading text-white fs-4 mb-1">{user?.name}</h3>
            <p className="text-secondary small mb-3">{user?.email}</p>

            {/* Role & Location Badges */}
            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className="badge bg-dark border border-secondary text-uppercase px-2 py-1 small">
                {user?.role === 'admin' ? '🎬 Admin Director' : '🎟️ Audience Member'}
              </span>
              <span className="badge bg-dark border border-secondary px-2 py-1 small d-inline-flex align-items-center gap-1">
                <MapPin size={12} className="text-danger" /> {user?.city || 'Bhilai'}
              </span>
            </div>

            {/* Photo Action Controls */}
            <div className="d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25">
              {previewUrl ? (
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={uploadingAvatar}
                    className="btn btn-cinema btn-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1"
                  >
                    <CheckCircle size={16} />
                    {uploadingAvatar ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="btn btn-outline-secondary btn-sm text-light"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline-cinema btn-sm d-inline-flex align-items-center justify-content-center gap-2"
                  >
                    <Camera size={16} />
                    <span>{user?.avatar ? 'Change Photo' : 'Upload Profile Photo'}</span>
                  </button>

                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={removingAvatar}
                      className="btn btn-link text-danger text-decoration-none btn-sm d-inline-flex align-items-center justify-content-center gap-1 p-0 mt-1"
                    >
                      <Trash2 size={14} />
                      <span>{removingAvatar ? 'Removing...' : 'Remove Photo (Use Initials)'}</span>
                    </button>
                  )}
                </>
              )}
              <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                Supported: JPG, PNG, WebP (Max 2 MB). No random photos assigned.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="col-lg-8">
          {/* Personal Information Form */}
          <div className="glass-panel p-4 mb-4">
            <h4 className="font-heading text-white fs-5 mb-3 pb-2 border-bottom border-secondary border-opacity-25 d-flex align-items-center gap-2">
              <User size={20} className="text-danger" /> Personal Information
            </h4>
            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="text-light fw-semibold small mb-1">Full Name</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-sm-6">
                  <label className="text-light fw-semibold small mb-1">Email Address (Registered)</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-secondary border-secondary py-2 opacity-75"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="col-sm-6">
                  <label className="text-light fw-semibold small mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control bg-dark text-light border-secondary py-2"
                    placeholder="+91 98271 XXXXX"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>

                <div className="col-sm-6">
                  <label className="text-light fw-semibold small mb-1">Default Cinema Hub</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="text-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn btn-cinema btn-sm px-4 fw-bold"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Personal Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-panel p-4">
            <h4 className="font-heading text-white fs-5 mb-3 pb-2 border-bottom border-secondary border-opacity-25 d-flex align-items-center gap-2">
              <Lock size={20} className="text-danger" /> Security & Password
            </h4>
            <form onSubmit={handlePasswordSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-sm-4">
                  <label className="text-light fw-semibold small mb-1">Current Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="col-sm-4">
                  <label className="text-light fw-semibold small mb-1">New Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Min 6 chars"
                    required
                  />
                </div>

                <div className="col-sm-4">
                  <label className="text-light fw-semibold small mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary py-2"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                    }
                    placeholder="Min 6 chars"
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
                  {updatingPassword ? 'Updating Password...' : 'Update Password'}
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
