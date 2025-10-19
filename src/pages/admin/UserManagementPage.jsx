import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, User, Briefcase, CheckCircle, Clock, Edit, Trash2, Eye, Loader, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import InitialsAvatar from '../../components/common/InitialsAvatar';
import UserDetailModal from '../../components/admin/UserDetailModal';
import { useUserManagement } from '../../hooks/admin/useUserManagement';
import { useToast } from '../../hooks/common';

const UserTableRow = ({ user, onView, onEdit, onDelete, openDropdownId, onToggleDropdown }) => {
  const isOpen = openDropdownId === user.id;

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Briefcase className="w-4 h-4 text-red-600" />;
      case 'employer': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'job_seeker': return <User className="w-4 h-4 text-green-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColors = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'employer': return 'bg-blue-100 text-blue-700';
      case 'job_seeker': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    onToggleDropdown(user.id);
  };

  const handleViewUser = () => {
    onView(user);
    onToggleDropdown(null);
  };

  const handleEditUser = () => {
    onEdit(user);
    onToggleDropdown(null);
  };

  const handleDeleteUser = () => {
    onDelete(user);
    onToggleDropdown(null);
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <InitialsAvatar user={user} size="md" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColors(user.user_type)}`}>
          {getRoleIcon(user.user_type)}
          <span className="ml-1.5">{user.user_type.replace('_', ' ')}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1.5">
          <Badge variant={user.onboarding_complete ? 'success' : 'default'} size="sm" className="w-fit">
            <Clock className="w-3 h-3 mr-1.5" />
            Onboarding {user.onboarding_complete ? 'Complete' : 'Pending'}
          </Badge>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <span>{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
          <span className="text-xs">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <Button variant="ghost" size="sm" onClick={handleToggleDropdown} className="dropdown-container">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
        {isOpen && (
          <div className="dropdown-container absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
            <div className="py-1">
              <button onClick={handleViewUser} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Eye className="w-4 h-4 mr-3" /> View Profile
              </button>
              <button onClick={handleEditUser} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Edit className="w-4 h-4 mr-3" /> Edit User
              </button>
              <button onClick={handleDeleteUser} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-3" /> Delete User
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, user, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{user?.full_name}</span>? 
            This action cannot be undone and will permanently remove the user from the system.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  const { t } = useTranslation('employer');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [shouldOpenInEditMode, setShouldOpenInEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { users, loading, error, updateUser, deleteUser } = useUserManagement();
  const { success: showSuccess, error: showError } = useToast();

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShouldOpenInEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShouldOpenInEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      showSuccess(`User "${userToDelete.full_name}" has been successfully deleted.`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      showError(`Failed to delete user: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleToggleDropdown = (userId) => {
    setOpenDropdownId(openDropdownId === userId ? null : userId);
  };

  const handleClickOutside = () => {
    setOpenDropdownId(null);
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutsideDropdown = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideDropdown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    };
  }, [openDropdownId]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter(user => {
        if (roleFilter !== 'all' && user.user_type !== roleFilter) {
          return false;
        }
        if (searchTerm && !user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      });
  }, [users, searchTerm, roleFilter]);

  // Calculate user statistics
  const userStats = useMemo(() => {
    if (!users) return { total: 0, admin: 0, employer: 0, job_seeker: 0 };
    
    return users.reduce((stats, user) => {
      stats.total++;
      stats[user.user_type] = (stats[user.user_type] || 0) + 1;
      return stats;
    }, { total: 0, admin: 0, employer: 0, job_seeker: 0 });
  }, [users]);

  // Get sample users for each category to display profile pictures
  const sampleUsers = useMemo(() => {
    if (!users) return { admin: null, employer: null, job_seeker: null };
    
    return {
      admin: users.find(user => user.user_type === 'admin'),
      employer: users.find(user => user.user_type === 'employer'),
      job_seeker: users.find(user => user.user_type === 'job_seeker')
    };
  }, [users]);



  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users across the platform.</p>
          </div>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <InitialsAvatar 
                  user={sampleUsers.admin} 
                  size="lg" 
                  className="border-2 border-red-200"
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.admin}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <InitialsAvatar 
                  user={sampleUsers.employer} 
                  size="lg" 
                  className="border-2 border-blue-200"
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Employers</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.employer}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <InitialsAvatar 
                  user={sampleUsers.job_seeker} 
                  size="lg" 
                  className="border-2 border-green-200"
                />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Job Seekers</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.job_seeker}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search users by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="employer">Employer</option>
              <option value="job_seeker">Job Seeker</option>
            </select>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Joined
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <Loader className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-4 text-lg text-gray-600">Loading Users...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <div className="flex flex-col justify-center items-center text-red-600">
                      <AlertTriangle className="w-8 h-8" />
                      <span className="ml-4 text-lg mt-2">Error fetching users.</span>
                      <p className="text-sm">{error.message}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <UserTableRow 
                      key={user.id} 
                      user={user} 
                      onView={handleViewUser}
                      onEdit={handleEditUser}
                      onDelete={handleDeleteUser}
                      openDropdownId={openDropdownId}
                      onToggleDropdown={handleToggleDropdown}
                    />
                  ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    <p className="text-lg text-gray-600">No users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UserDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={updateUser}
        initialEditMode={shouldOpenInEditMode}
      />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        user={userToDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default UserManagementPage;
