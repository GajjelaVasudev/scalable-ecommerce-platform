const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');

async function createOrder(req, res){
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();
    //in every operation dont return in between of transaction abort transaction and end it before u return
    try{
     
        //get cart items
        const cart = await Cart.findOne({user: userId})
                               .populate('items.product', 'name price stock status')
                               .session(session);

        if(!cart || cart.items.length === 0){
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json({message: 'Cart is empty'});
        }

        //check products if available and also its status
        for(const item of cart.items){
            const product = await Product.findById(item.product._id).session(session);
            if(!product){
                await session.abortTransaction();
                await session.endSession();
                return res.status(404).json({message: 'Product not found'});
            }
            if(product.stock < item.quantity){
                await session.abortTransaction();
                await session.endSession();
                return res.status(400).json({message: 'Product is out of stock'});
            }
            //also check if product is active
            if(product.status !== 'active'){
                await session.abortTransaction();
                await session.endSession();
                return res.status(400).json({message: 'Product is not active'});
            }
        }

        //calculate total using product not carts total amount 
        let totalAmount = 0;
        const orderItems = [];
        for(const item of cart.items){
            totalAmount += item.product.price * item.quantity;
            orderItems.push({
                product: item.product._id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            });
        }

        //create order
        const [order] = await Order.create([
            {
                user: userId,
                items: orderItems,
                totalAmount,
                shippingAddress: req.body.shippingAddress,
                paymentStatus: 'unpaid'
            }
        ], {session});

        //update stock
        for(const item of cart.items){
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product._id,
                    stock: { $gte: item.quantity }
                },
                {
                    $inc: { stock: -item.quantity }
                },
                {
                    session,
                    new: true
                }
            );

            if (!updatedProduct) {
                throw new Error('Insufficient stock');
            }   
        }

        //clear cart
        await Cart.findByIdAndUpdate(cart._id, {items: []})
                  .session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({message: 'Order created successfully', order});

    }
    catch(error){
        await session.abortTransaction();
        await session.endSession();
        return res.status(500).json({message: 'Failed to create order'});
    }


}

module.exports = {createOrder};