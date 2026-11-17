import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Trash2, Eye, Plus, Search } from 'lucide-react';
import { api } from '../../services/api';
import { INITIAL_PRODUCTS } from '../../services/mockData';
import { Product } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/format';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.products
      .list({ limit: 100 })
      .then((res) => {
        if (res?.products && res.products.length > 0) {
          setProducts(res.products);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`[Admin Override] Confirm deletion of "${name}"?`)) return;
    try {
      await api.products.delete(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      alert('Product deleted successfully by platform administrator.');
    } catch (err: any) {
      alert(err.message || 'Deletion failed. Check for active orders or active reservations.');
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Product>[] = [
    {
      header: 'Product / SKU',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-porcelain dark:bg-obsidian-surface-2 p-1 border border-lavender-mist dark:border-obsidian-border shrink-0 overflow-hidden">
            <img src={row.image} alt={row.name} className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <div className="min-w-0 max-w-sm">
            <p className="text-xs font-bold text-ink dark:text-text-dark-primary truncate">{row.name}</p>
            <p className="text-[10px] text-ink-subtle">
              Seller: {typeof row.seller === 'object' ? row.seller?.username : row.seller || 'Verified Merchant'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (row) => (
        <span className="text-xs text-ink-muted">
          {typeof row.category === 'object' ? row.category.name : row.category}
        </span>
      ),
    },
    {
      header: 'Price',
      accessorKey: 'price',
      align: 'right',
      cell: (row) => <span className="font-extrabold tabular-nums text-xs">{formatCurrency(row.price)}</span>,
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      align: 'center',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-ink dark:text-text-dark-primary">
          {row.stock}
        </span>
      ),
    },
    {
      header: 'Catalog Status',
      align: 'center',
      cell: (row) => (
        <Badge variant={row.stock > 0 ? 'success' : 'error'}>
          {row.stock > 0 ? 'Published' : 'Depleted'}
        </Badge>
      ),
    },
    {
      header: 'Admin Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/products/${row._id}`} target="_blank" title="Inspect Listing">
            <button className="p-1.5 text-ink-muted hover:text-electric-violet rounded-lg hover:bg-porcelain transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row._id, row.name)}
            title="Admin Delete"
            className="p-1.5 text-error hover:text-red-700 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            Platform-Wide Product Catalog
          </h1>
          <p className="text-xs text-ink-muted">
            Cross-merchant catalog inspection, compliance takedown controls, and inventory audits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog..."
              className="bg-white dark:bg-obsidian-surface-1 text-xs p-2.5 pl-8 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet w-60"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item._id}
        isLoading={isLoading}
      />
    </div>
  );
};

