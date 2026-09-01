import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, resolveImageUrl } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { UserCheck, UserX, Mail } from 'lucide-react';

export const ManageUsers = () => {
  const { toggleUserStatus } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const keywordQuery = searchTerm ? `?keyword=${searchTerm}` : '';
      const data = await apiRequest(`/admin/users${keywordQuery}`);
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching global users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const handleToggleBlock = async (userId) => {
    const res = await toggleUserStatus(userId);
    if (res.success) {
      // Reload user list or toggle status locally
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: res.user.isBlocked } : u));
    } else {
      alert(res.message || 'Action failed.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">User Management</h1>
            <p className="text-xs font-semibold text-slate-400">Review customer and owner registrations, audit account statuses, and manage platform access controls</p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="border border-slate-100 p-0 overflow-hidden" hoverable={false}>
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-400">Loading user database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600 border-collapse font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Profile</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Role Type</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6 text-right">Lock Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img 
                          src={u.avatar ? resolveImageUrl(u.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                          alt={u.name} 
                          className="w-8 h-8 rounded-full object-cover border" 
                          onError={(e) => {
                            e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
                          }}
                        />
                        <span className="font-bold text-slate-800">{u.name}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          {u.email}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={u.role === 'owner' ? 'secondary' : 'primary'} className="uppercase">
                            {u.role}
                          </Badge>
                          {u.role === 'owner' && u.company && (
                            <span className="text-[10px] text-slate-400 font-bold block whitespace-nowrap">
                              🏢 {u.company}
                            </span>
                          )}
                          {u.phone && (
                            <span className="text-[10px] text-slate-400 font-bold block whitespace-nowrap">
                              📞 {u.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">{u.joinedDate?.split('T')[0]}</td>
                      <td className="py-4 px-6">
                        {u.isBlocked ? (
                          <Badge variant="danger">Blocked</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`
                              font-bold duration-150 py-1.5 px-3
                              ${u.isBlocked 
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' 
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                              }
                            `}
                            onClick={() => handleToggleBlock(u._id)}
                          >
                            {u.isBlocked ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5 shrink-0" />
                                Block
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
