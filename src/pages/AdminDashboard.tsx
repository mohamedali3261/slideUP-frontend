import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Loader2, Shield, Users, ArrowLeft, LogOut,
  Crown, Presentation, Settings,
} from 'lucide-react';
import { getAllUsers, getPresentationsByUser } from '@/lib/storage';

const AdminDashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [totalPresentations, setTotalPresentations] = useState(0);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      const allUsers = getAllUsers();
      setUsers(allUsers);
      let totalPres = 0;
      allUsers.forEach(u => {
        totalPres += getPresentationsByUser(u.id).length;
      });
      setTotalPresentations(totalPres);
    }
  }, [user]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleGoBack} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}</h1>
                <p className="text-xs text-slate-400">{language === 'ar' ? `مرحباً ${user.username}` : `Welcome ${user.username}`}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'خروج' : 'Logout'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</span>
            </div>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Presentation className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-slate-400">{language === 'ar' ? 'إجمالي العروض' : 'Total Presentations'}</span>
            </div>
            <p className="text-3xl font-bold">{totalPresentations}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">{language === 'ar' ? 'المديرين' : 'Admins'}</span>
            </div>
            <p className="text-3xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {language === 'ar' ? 'المستخدمون' : 'Users'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left p-4">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="text-left p-4">{language === 'ar' ? 'الدور' : 'Role'}</th>
                  <th className="text-left p-4">{language === 'ar' ? 'العروض' : 'Presentations'}</th>
                  <th className="text-left p-4">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-600 text-slate-300'}`}>
                        {u.role === 'admin' ? (language === 'ar' ? 'مدير' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'User')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{getPresentationsByUser(u.id).length}</td>
                    <td className="p-4 text-slate-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      {language === 'ar' ? 'لا يوجد مستخدمون' : 'No users yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
