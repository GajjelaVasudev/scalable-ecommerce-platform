const productModel = require('../models/product.model');

//implement create product here

async function createProduct(req, res) {
    const {name, description, price, stock, category, image} = req.body;

    if(!name || !description || !price || !stock || !category || !image){
        return res.status(400).json({message: 'All fields are required'});
    }

    const product = await productModel.create({name,
         description, 
         price,
         stock, 
         category, 
         image,
         seller: req.user.id
        });


    return res.status(201).json({message: 'Product created successfully', product});
}       

//apply pagination ten products per page
async function getProducts(req, res) {
    //show 10 products per page
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, minprice, maxprice, sort} = req.query;

    const filter = {};
    const sortOption = {};
//category filter
    if(category){
        filter.category = category;
    }

//price filter
   if (minprice || maxprice) {
    filter.price = {};

    if (minprice) {
        filter.price.$gte = Number(minprice);
    }

    if (maxprice) {
        filter.price.$lte = Number(maxprice);
    }
}
//sort filter
if (sort === 'price_asc') {
    sortOption.price = 1;
}

if (sort === 'price_desc') {
    sortOption.price = -1;
}

if (sort === 'newest') {
    sortOption.createdAt = -1;
}


    const products = await productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sortOption);

    const total = await productModel.countDocuments(filter);


    return res.status(200).json({
        message: 'Products fetched successfully',
        products,
        pagination: {
            page,
            limit,
            totalProducts: total,
            totalPages: Math.ceil(total / limit)
        }
    });
}

async function updateProduct(req, res){
    const {id} = req.params;

    const product = await productModel.findById(id);
    
    if(!product){
        return res.status(404).json({message: 'Product not found'});
    }
    if(req.user.id !== product.seller.toString()){
        return res.status(403).json({message: 'Forbidden'});
    }

    const updatedProduct = await productModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    });
    
    return res.status(200).json({message: 'Product updated successfully', updatedProduct});

}

async function deleteProduct(req, res){
    const {id} = req.params;

    const product = await productModel.findById(id);
    
    if(!product){
        return res.status(404).json({message: 'Product not found'});
    }
    if(req.user.id !== product.seller.toString()){
        return res.status(403).json({message: 'Forbidden'});
    }

    const deletedProduct = await productModel.findByIdAndDelete(id);
    
    return res.status(200).json({message: 'Product deleted successfully', deletedProduct});
}

async function getProductById(req, res){
    const {id} = req.params;

    const product = await productModel.findById(id);
    
    if(!product){
        return res.status(404).json({message: 'Product not found'});
    }
    
    return res.status(200).json({message: 'Product fetched successfully', product});
}

module.exports = {createProduct, getProducts, updateProduct, deleteProduct, getProductById};