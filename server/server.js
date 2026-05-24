import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Fallback DB Directory
const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

const PRODUCTS_FILE = path.join(DB_DIR, 'products.json');
const ORDERS_FILE = path.join(DB_DIR, 'orders.json');
const NEWSLETTER_FILE = path.join(DB_DIR, 'newsletter.json');

// Helper to read JSON DB
const readJsonDB = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Helper to write JSON DB
const writeJsonDB = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Default seeded products
const defaultProducts = [
    {
        _id: 'prod_1',
        name: 'Obsidian Heavyweight Tee',
        price: 120,
        material: '320GSM Long-Staple Egyptian Cotton',
        image: '/logo_tee_mockup.png'
    },
    {
        _id: 'prod_2',
        name: 'Normandy Linen Shirt',
        price: 160,
        material: 'Pure Normandy Linen-Cotton Weave',
        image: '/logo_tag_mockup.png'
    },
    {
        _id: 'prod_3',
        name: 'Okayama Selvedge Denim',
        price: 220,
        material: 'Raw Selvedge Denim on Vintage Looms',
        image: '/logo_concept_seam.png'
    },
    {
        _id: 'prod_4',
        name: 'Sage Terry Hoodie',
        price: 190,
        material: '380GSM Organic Terry Fleece',
        image: '/logo_concept_dots.png'
    },
    {
        _id: 'prod_5',
        name: 'Bronze Cashmere Coat',
        price: 380,
        material: 'Brushed Italian Cashmere Blend',
        image: '/logo_concept_fold.png'
    },
    {
        _id: 'prod_6',
        name: 'Bronze Sculptural Hanger',
        price: 80,
        material: 'Solid Engraved Bronze Boutique Hardware',
        image: '/logo_concept_hanger.png'
    }
];

// State variables for Database Mode
let isMongo = false;

// Mongoose Schemas (MongoDB mode)
const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    material: String,
    image: String
});

const OrderSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    items: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number
    }],
    total: Number,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const NewsletterSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});

let Product, Order, Newsletter;

// Connect to MongoDB with 3s Timeout
console.log('Attempting to connect to MongoDB...');
try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thelogoless', {
        serverSelectionTimeoutMS: 3000
    });
    console.log('Successfully connected to MongoDB.');
    isMongo = true;
    
    // Register Mongoose models
    Product = mongoose.model('Product', ProductSchema);
    Order = mongoose.model('Order', OrderSchema);
    Newsletter = mongoose.model('Newsletter', NewsletterSchema);
    
    // Seed MongoDB if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
        console.log('Seeding default products to MongoDB...');
        await Product.insertMany(defaultProducts);
        console.log('Seeding completed.');
    }
} catch (err) {
    console.warn('MongoDB connection failed. Switching to Local JSON File database mode.');
    isMongo = false;
    
    // Seed Local File DB if empty
    if (!fs.existsSync(PRODUCTS_FILE) || readJsonDB(PRODUCTS_FILE).length === 0) {
        console.log('Seeding default products to Local JSON File...');
        writeJsonDB(PRODUCTS_FILE, defaultProducts);
        console.log('Local seeding completed.');
    }
}

/* ==========================================================================
   API ROUTE HANDLERS
   ========================================================================== */

// 1. Get Products
app.get('/api/products', async (req, res) => {
    try {
        if (isMongo) {
            const dbProducts = await Product.find({});
            return res.json(dbProducts);
        } else {
            const fileProducts = readJsonDB(PRODUCTS_FILE);
            return res.json(fileProducts);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

// 2. Submit Checkout Order
app.post('/api/checkout', async (req, res) => {
    const { customerName, customerEmail, items, total } = req.body;
    
    if (!customerName || !customerEmail || !items || items.length === 0 || !total) {
        return res.status(400).json({ error: 'Missing required order details' });
    }

    try {
        if (isMongo) {
            const newOrder = new Order({
                customerName,
                customerEmail,
                items,
                total
            });
            await newOrder.save();
            return res.json({ success: true, orderId: newOrder._id, message: 'Order submitted to MongoDB successfully' });
        } else {
            const orders = readJsonDB(ORDERS_FILE);
            const newOrder = {
                _id: 'ord_' + Math.random().toString(36).substr(2, 9),
                customerName,
                customerEmail,
                items,
                total,
                status: 'Pending',
                createdAt: new Date()
            };
            orders.push(newOrder);
            writeJsonDB(ORDERS_FILE, orders);
            return res.json({ success: true, orderId: newOrder._id, message: 'Order submitted to Local JSON Database successfully' });
        }
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Failed to process checkout' });
    }
});

// 3. Newsletter Subscription
app.post('/api/newsletter', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    try {
        if (isMongo) {
            const existing = await Newsletter.findOne({ email });
            if (existing) {
                return res.json({ success: true, message: 'Already subscribed.' });
            }
            const sub = new Newsletter({ email });
            await sub.save();
            return res.json({ success: true, message: 'Subscribed in MongoDB.' });
        } else {
            const subs = readJsonDB(NEWSLETTER_FILE);
            const exists = subs.find(s => s.email === email);
            if (exists) {
                return res.json({ success: true, message: 'Already subscribed.' });
            }
            subs.push({ email, subscribedAt: new Date() });
            writeJsonDB(NEWSLETTER_FILE, subs);
            return res.json({ success: true, message: 'Subscribed in Local JSON Database.' });
        }
    } catch (error) {
        console.error('Newsletter error:', error);
        res.status(500).json({ error: 'Failed to subscribe email' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${isMongo ? 'MongoDB' : 'Local File'} database mode.`);
});
