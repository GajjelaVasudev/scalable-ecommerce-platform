import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Package, Check, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { INITIAL_PRODUCTS } from '../../services/mockData';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = () => {
    setIsLoading(true);
    api.products
      .list({ limit: 50 })
      .then((res) => {
        if (res?.products && res.products.length > 0) {
          setProducts(res.products);
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
      })
      .catch(() => {
        setProducts(INITIAL_PRODUCTS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also remove the linked inventory record.`)) {
      return;
    }
    try {
      await api.products.delete(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      alert('Product deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete product. Products with active orders or reservations cannot be deleted.');
    }
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      accessorKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-porcelain dark:bg-obsidian-surface-2 p-1 border border-lavender-mist dark:border-obsidian-border shrink-0 overflow-hidden">
            <img src={row.image} alt={row.name} className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <div className="min-w-0 max-w-xs">
            <p className="text-xs font-bold text-ink dark:text-text-dark-primary truncate">{row.name}</p>
            <span className="text-[10px] text-ink-subtle uppercase">
              {typeof row.category === 'object' ? row.category.name : row.category}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessorKey: 'price',
      align: 'right',
      cell: (row) => <span className="font-extrabold tabular-nums">{formatCurrency(row.price)}</span>,
    },
    {
      header: 'Available Stock',
      accessorKey: 'stock',
      align: 'center',
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.stock <= 5 ? 'text-semantic-warning' : 'text-ink dark:text-text-dark-primary'
          }`}
        >
          {row.stock} units
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => (
        <Badge variant={row.stock > 0 ? 'success' : 'error'}>
          {row.stock > 0 ? 'Active' : 'Stockout'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/products/${row._id}`} target="_blank" title="View PDP">
            <button className="p-1.5 text-ink-muted hover:text-electric-violet rounded-lg hover:bg-porcelain transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </Link>
          <Link to={`/seller/products/${row._id}/edit`} title="Edit Product">
            <button className="p-1.5 text-ink-muted hover:text-electric-violet rounded-lg hover:bg-porcelain transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row._id, row.name)}
            title="Delete Product"
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
            Product Catalog Management
          </h1>
          <p className="text-xs text-ink-muted">
            Manage product listings, inventory sync, pricing, and live catalog states
          </p>
        </div>
        <Link to="/seller/products/new">
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Add New Product
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(item) => item._id}
        isLoading={isLoading}
      />
    </div>
  );
};

