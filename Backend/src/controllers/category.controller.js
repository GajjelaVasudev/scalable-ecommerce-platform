const Category = require('../models/category.model');


//create category

async function createCategory(req, res){
    const {name} = req.body;

    if(!name){
        return res.status(400).json({message: 'Category name is required'});
    }

    const existingCategory = await Category.findOne({name: name.toLowerCase()});
    //lower case here because in model we are storing in lower case 

    if(existingCategory){
        return res.status(400).json({message: 'Category already exists'});
    }

    const category = await Category.create({name});

    return res.status(201).json({message: 'Category created successfully', category});
}

//getall categories

async function getAllCategories(req, res){
    const categories = await Category.find();
    return res.status(200).json({message: 'Categories fetched successfully', categories});
}

//getbyid

async function getCategoryById(req, res){
    const {id} = req.params;
    const category = await Category.findById(id);
    if(!category){
        return res.status(404).json({message: 'Category not found'});
    }
    return res.status(200).json({message: 'Category fetched successfully', category});
}

//updatecategory

async function updateCategory(req, res){
    const {id} = req.params;
    const {name} = req.body;
    const category = await Category.findById(id);
    if(!category){
        return res.status(404).json({message: 'Category not found'});
    }
    const existingCategory = await Category.findOne({name: name.toLowerCase(),
        _id: { $ne: id }
    });
    if(existingCategory){
        return res.status(400).json({message: 'Category already exists'});
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, {name}, {
        new: true,
        runValidators: true
    });
    return res.status(200).json({message: 'Category updated successfully', updatedCategory});
}

//deletecategory

async function deleteCategory(req, res){
    const {id} = req.params;
    const category = await Category.findById(id);
    if(!category){
        return res.status(404).json({message: 'Category not found'});
    }
    const deletedCategory = await Category.findByIdAndDelete(id);
    return res.status(200).json({message: 'Category deleted successfully', deletedCategory});
}


module.exports = {createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory};
