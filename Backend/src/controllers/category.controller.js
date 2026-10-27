const mongoose = require('mongoose');
const Category = require('../models/category.model');
const Product = require('../models/product.model');

// Create category
async function createCategory(req, res) {
    try {
        const { name } = req.body;

        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const trimmedName = name.trim().toLowerCase();
        const existingCategory = await Category.findOne({ name: trimmedName });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({ name: trimmedName });

        return res.status(201).json({
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        console.error('Create category error:', error.message);
        return res.status(500).json({ message: 'Failed to create category' });
    }
}

// Get all categories
async function getAllCategories(req, res) {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        return res.status(200).json({
            message: 'Categories fetched successfully',
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch categories' });
    }
}

// Get category by ID
async function getCategoryById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findById(id).lean();
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        return res.status(200).json({
            message: 'Category fetched successfully',
            category
        });
    } catch (error) {
        console.error('Get category error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch category' });
    }
}

// Update category
async function updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Valid category name is required' });
        }

        const trimmedName = name.trim().toLowerCase();
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const existingCategory = await Category.findOne({
            name: trimmedName,
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: trimmedName },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: 'Category updated successfully',
            updatedCategory
        });
    } catch (error) {
        console.error('Update category error:', error.message);
        return res.status(500).json({ message: 'Failed to update category' });
    }
}

// Delete category
async function deleteCategory(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Prevent deletion if products depend on this category
        const productsCount = await Product.countDocuments({ category: id });
        if (productsCount > 0) {
            return res.status(409).json({
                message: 'Cannot delete category that is currently assigned to existing products'
            });
        }

        const deletedCategory = await Category.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Category deleted successfully',
            deletedCategory
        });
    } catch (error) {
        console.error('Delete category error:', error.message);
        return res.status(500).json({ message: 'Failed to delete category' });
    }
}

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
