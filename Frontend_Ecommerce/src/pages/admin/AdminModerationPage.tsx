import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, XCircle, AlertTriangle, Eye, ShieldCheck, Users, UserCheck } from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { User } from '../../types';
import { formatDate } from '../../utils/format';

interface ModerationItem {
  id: string;
  productName: string;
  merchant: string;
  category: string;
  flagReason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const AdminModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'users'>('moderation');

  // Moderation state
  const [items, setItems] = useState<ModerationItem[]>([
    {
      id: 'MOD-1082',
      productName: 'SoundPulse Studio Pro Headphones',
      merchant: 'OmniAudio Direct',
      category: 'Electronics',
      flagReason: 'New product submission - Audio hardware verification',
      status: 'approved',
    },
    {
      id: 'MOD-1085',
      productName: 'Titanium Smart Health Ring Gen 3',
      merchant: 'Aura Biometrics',
      category: 'Electronics / Wearables',
      flagReason: 'Medical device disclaimer check required',
      status: 'pending',
    },
    {
      id: 'MOD-1089',
      productName: 'Artisan Stoneware Dining Set',
      merchant: 'Kala Artisan Living',
      category: 'Home & Living',
      flagReason: 'Fragile packaging verification compliant',
      status: 'approved',
    },
  ]);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userUpdatingId, setUserUpdatingId] = useState<string | null>(null);

  const loadUsers = () => {
    setIsUsersLoading(true);
    api.auth
      .getUsers({ limit: 50 })
      .then((res) => {
        if (res?.users && res.users.length > 0) {
          setUsers(res.users);
        } else {
          setUsers([
            { _id: 'u_admin', username: 'admin', email: 'admin@omizon.in', role: 'admin', createdAt: new Date().toISOString() },
            { _id: 'u_seller', username: 'seller_apex', email: 'seller@apextech.in', role: 'seller', createdAt: new Date().toISOString() },
            { _id: 'u_buyer', username: 'buyer_rahul', email: 'rahul@gmail.com', role: 'buyer', createdAt: new Date().toISOString() },
          ]);
        }
      })
      .catch(() => {
        setUsers([
          { _id: 'u_admin', username: 'admin', email: 'admin@omizon.in', role: 'admin', createdAt: new Date().toISOString() },
          { _id: 'u_seller', username: 'seller_apex', email: 'seller@apextech.in', role: 'seller', createdAt: new Date().toISOString() },
          { _id: 'u_buyer', username: 'buyer_rahul', email: 'rahul@gmail.com', role: 'buyer', createdAt: new Date().toISOString() },
        ]);
      })
      .finally(() => setIsUsersLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUserUpdatingId(userId);
    try {
      await api.auth.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole as any } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setUserUpdatingId(null);
    }
  };

  const columns: Column<ModerationItem>[] = [
    {
      header: 'Queue Ticket',
      accessorKey: 'id',
      cell: (row) => <span className="font-mono font-bold text-xs text-electric-violet">{row.id}</span>,
    },
    {
      header: 'Listing Name',
      accessorKey: 'productName',
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-ink dark:text-text-dark-primary">{row.productName}</p>
          <span className="text-[10px] text-ink-subtle">Category: {row.category}</span>
        </div>
      ),
    },
    {
      header: 'Merchant Owner',
      accessorKey: 'merchant',
    },
    {
      header: 'Audit Note / Policy Check',
      accessorKey: 'flagReason',
      cell: (row) => <span className="text-[11px] text-ink-muted">{row.flagReason}</span>,
    },
    {
      header: 'Governance Status',
      align: 'center',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'approved'
              ? 'success'
              : row.status === 'rejected'
              ? 'error'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Moderation Decision',
      align: 'right',
      cell: (row) =>
        row.status === 'pending' ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction(row.id, 'approved')}
              className="h-8 text-xs font-bold"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction(row.id, 'rejected')}
              className="h-8 text-xs font-bold"
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-ink-muted font-semibold capitalize">{row.status}</span>
        ),
    },
  ];

  const userColumns: Column<User>[] = [
    {
      header: 'User / Identity',
      accessorKey: 'username',
      cell: (row) => (
        <div>
          <span className="font-bold text-xs text-ink dark:text-text-dark-primary block">{row.username}</span>
          <span className="text-[11px] text-ink-subtle">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      align: 'center',
      cell: (row) => (
        <Badge
          variant={
            row.role === 'admin'
              ? 'primary'
              : row.role === 'seller'
              ? 'warning'
              : 'neutral'
          }
        >
          {row.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Registered',
      accessorKey: 'createdAt',
      cell: (row) => <span className="text-xs text-ink-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Role Governance',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.role !== 'seller' && (
            <Button
              variant="outline"
              size="sm"
              isLoading={userUpdatingId === row._id}
              onClick={() => handleRoleChange(row._id, 'seller')}
              className="h-7 text-[11px] px-2"
            >
              Set Seller
            </Button>
          )}
          {row.role !== 'buyer' && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={userUpdatingId === row._id}
              onClick={() => handleRoleChange(row._id, 'buyer')}
              className="h-7 text-[11px] px-2 text-ink-muted"
            >
              Set Buyer
            </Button>
          )}
          {row.role !== 'admin' && (
            <Button
              variant="outline"
              size="sm"
              isLoading={userUpdatingId === row._id}
              onClick={() => handleRoleChange(row._id, 'admin')}
              className="h-7 text-[11px] px-2 text-purple-700 dark:text-purple-300"
            >
              Grant Admin
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Platform Moderation & User Governance
          </h1>
          <p className="text-xs text-ink-muted">
            Review merchant listing submissions, trademark checks, and manage buyer/seller role permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'moderation' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('moderation')}
            icon={<FileCheck className="w-4 h-4" />}
          >
            Catalog Moderation
          </Button>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('users')}
            icon={<Users className="w-4 h-4" />}
          >
            Users & Roles
          </Button>
        </div>
      </div>

      {activeTab === 'moderation' ? (
        <DataTable
          columns={columns}
          data={items}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <DataTable
          columns={userColumns}
          data={users}
          isLoading={isUsersLoading}
          keyExtractor={(user) => user._id}
        />
      )}
    </div>
  );
};

export default AdminModerationPage;

