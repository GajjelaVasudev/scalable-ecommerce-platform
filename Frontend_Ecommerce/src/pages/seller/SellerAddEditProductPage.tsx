import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Layers,
  Upload,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../services/api';
import { Category, Product } from '../../types';
import { Button } from '../../components/ui/Button';

export const SellerAddEditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch categories
  useEffect(() => {
    api.categories
      .list()
      .then((res) => {
        if (res?.categories && res.categories.length > 0) {
          setCategories(res.categories);
          if (!category) setCategory(res.categories[0]._id);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch categories:', err.message);
        // Fallback demo categories
        const mockCats = [
          { _id: '671fc0000000000000000001', name: 'Electronics' },
          { _id: '671fc0000000000000000002', name: 'Home Living' },
          { _id: '671fc0000000000000000003', name: 'Grocery & Essentials' },
          { _id: '671fc0000000000000000004', name: 'Beauty & Personal Care' },
        ];
        setCategories(mockCats);
        setCategory(mockCats[0]._id);
      });
  }, []);

  // Fetch existing product if in edit mode
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.products
      .getById(id)
      .then((res) => {
        if (res?.product) {
          const p = res.product;
          setName(p.name);
          setDescription(p.description);
          setPrice(String(p.price));
          setStock(String(p.stock));
          setImage(p.image);
          const catId = typeof p.category === 'object' ? p.category._id : p.category;
          setCategory(catId);
        }
      })
      .catch((err) => {
        setErrorMessage('Failed to load product details: ' + err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !description.trim() || !price || !stock || !category || !image.trim()) {
      setErrorMessage('All fields are required.');
      return;
    }

    const numPrice = Number(price);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('Price must be a non-negative number.');
      return;
    }

    if (!Number.isInteger(numStock) || numStock < 0) {
      setErrorMessage('Stock must be a non-negative integer.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await api.products.update(id, {
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          stock: numStock,
          category,
          image: image.trim(),
        });
        setSuccessMessage('Product updated successfully!');
      } else {
        await api.products.create({
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          stock: numStock,
          category,
          image: image.trim(),
        });
        setSuccessMessage('Product created successfully and inventory record initialized!');
      }

      setTimeout(() => {
        navigate('/seller/products');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please verify fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* 1. Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/seller/products"
          className="p-2 rounded-xl bg-white dark:bg-obsidian-surface-1 border border-lavender-mist dark:border-obsidian-border text-ink dark:text-text-dark-primary hover:bg-porcelain transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-text-dark-primary tracking-tight">
            {isEditMode ? 'Edit Product Details' : 'Add New Marketplace Product'}
          </h1>
          <p className="text-xs text-ink-muted">
            Configure metadata, pricing, inventory allocations, and image assets
          </p>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-semantic-error flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-semantic-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-obsidian-surface-1 p-6 sm:p-8 rounded-2xl border border-lavender-mist dark:border-obsidian-border shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Product Name */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SoundPulse Studio Pro ANC Headphones"
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Marketplace Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet font-semibold"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Base Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Price in INR (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 24999"
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet font-mono"
            />
          </div>

          {/* Initial Stock */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Total Stock Quantity *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="e.g. 50"
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet font-mono"
            />
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Primary Image URL *
            </label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
            />
          </div>

          {/* Image Preview Box */}
          <div className="sm:col-span-2 flex items-center gap-4 p-4 rounded-xl bg-porcelain dark:bg-obsidian-surface-2 border border-lavender-mist dark:border-obsidian-border">
            <div className="w-16 h-16 rounded-lg bg-white dark:bg-obsidian-surface-1 border border-lavender-mist dark:border-obsidian-border flex items-center justify-center overflow-hidden shrink-0">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <ImageIcon className="w-6 h-6 text-outline" />
              )}
            </div>
            <div className="text-xs text-ink-muted leading-relaxed">
              <span className="font-bold text-ink dark:text-text-dark-primary">Asset Guidelines:</span> Use minimum 800x800 square images with clean white or neutral backdrops for optimal multi-category catalog rendering.
            </div>
          </div>

          {/* Description */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink dark:text-text-dark-primary">
              Product Overview & Specifications *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete specifications, key features, and warranty details..."
              className="bg-porcelain dark:bg-obsidian-surface-2 text-xs p-3 rounded-xl border border-lavender-mist dark:border-obsidian-border outline-none focus:ring-1 focus:ring-electric-violet"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-lavender-mist dark:border-obsidian-border">
          <Link to="/seller/products">
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="shadow-md shadow-electric-violet/20 font-bold"
          >
            {isEditMode ? 'Save Changes' : 'Publish to Marketplace'}
          </Button>
        </div>
      </form>
    </div>
  );
};

