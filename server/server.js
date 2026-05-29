import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'dev-secret-change-before-production';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
}

const PRODUCTS_FILE = path.join(DB_DIR, 'products.json');
const ORDERS_FILE = path.join(DB_DIR, 'orders.json');
const NEWSLETTER_FILE = path.join(DB_DIR, 'newsletter.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const CARTS_FILE = path.join(DB_DIR, 'carts.json');

const readJsonDB = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const raw = fs.readFileSync(filePath, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
};

const writeJsonDB = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const createId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

const getMailTransport = () => {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) return null;

    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass }
        });
    }

    return nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: { user, pass }
    });
};

const formatOrderLines = (order) => {
    return (order.items || [])
        .map((item) => `${item.quantity} x ${item.name}${item.size ? ` (${item.size})` : ''} - ₹${item.price * item.quantity}`)
        .join('\n');
};

const generateOrderEmailHTML = (order, isAdmin = false) => {
    const orderId = String(order._id);
    const itemsHTML = (order.items || [])
        .map((item) => {
            const imageUrl = item.image ? `${item.image}?q=50&w=150` : '';
            const imageTag = imageUrl ? `<img src="${imageUrl}" alt="${item.name}" style="width: 120px; height: auto; border-radius: 4px; margin-bottom: 8px;" />` : '';
            return `
                <tr style="border-bottom: 1px solid #e0e0e0; padding: 12px 0;">
                    <td style="padding: 12px 0; text-align: left;">
                        ${imageTag}
                        <div style="font-weight: 500; margin-top: 8px;">${item.name}</div>
                        ${item.size ? `<div style="color: #666; font-size: 14px;">Size: ${item.size}</div>` : ''}
                        <div style="color: #666; font-size: 14px;">Qty: ${item.quantity}</div>
                    </td>
                    <td style="padding: 12px 12px; text-align: right; white-space: nowrap;">
                        <div style="font-weight: 500;">₹${item.price * item.quantity}</div>
                    </td>
                </tr>
            `;
        })
        .join('');

    const baseHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; color: #000; letter-spacing: 0.05em;">THELOGOLESS</h1>
                    <p style="margin: 8px 0 0 0; color: #666; font-size: 12px; letter-spacing: 0.1em;">QUIET LUXURY BRAND</p>
                </div>

                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #000;">
                    ${isAdmin ? 'New Order Received' : 'Order Confirmed'}
                </h2>
                <p style="margin: 0 0 20px 0; color: #666;">
                    ${isAdmin ? `Hi Admin,` : `Hi ${order.customerName},`}
                </p>

                ${!isAdmin ? `<p style="margin: 0 0 20px 0; color: #666;">Your order <strong>${orderId}</strong> has been confirmed. Below are the details of your purchase.</p>` : `<p style="margin: 0 0 20px 0; color: #666;">A new order has been placed. Here are the details:</p>`}

                ${isAdmin ? `<div style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
                    <div style="margin-bottom: 8px;"><strong>Customer:</strong> ${order.customerName}</div>
                    <div style="margin-bottom: 8px;"><strong>Email:</strong> ${order.customerEmail}</div>
                    <div><strong>Shipping City:</strong> ${order.location || 'Not provided'}</div>
                </div>` : ''}

                <h3 style="margin: 20px 0 12px 0; font-size: 16px; color: #000;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div style="border-top: 2px solid #e0e0e0; padding-top: 12px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Subtotal:</span>
                        <span>₹${order.subtotal}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 600;">
                        <span>Total:</span>
                        <span>₹${order.total}</span>
                    </div>
                </div>

                ${!isAdmin ? `<p style="margin: 20px 0; color: #666; font-size: 14px;">We will contact you with the next update on your order status. Thank you for shopping with THELOGOLESS.</p>` : ''}

                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
                    <p style="margin: 0;">© 2026 thelogoless. All rights reserved.</p>
                    <p style="margin: 4px 0 0 0;">Quiet Luxury Brand Suite</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return baseHTML;
};

const sendOrderEmails = async (order) => {
    const transport = getMailTransport();
    if (!transport) {
        console.warn('Order email skipped. Add SMTP_USER and SMTP_PASS/GMAIL_APP_PASSWORD to .env to enable mail.');
        return { sent: false, skipped: true };
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || ADMIN_EMAIL;
    const orderId = String(order._id);

    // Plain text versions for fallback
    const orderLines = formatOrderLines(order);
    const customerText = [
        `Hi ${order.customerName},`,
        '',
        `Your THELOGOLESS order ${orderId} has been confirmed.`,
        '',
        orderLines,
        '',
        `Total: ₹${order.total}`,
        `Shipping city: ${order.location || 'Not provided'}`,
        '',
        'We will contact you with the next update.'
    ].join('\n');

    const adminText = [
        `New THELOGOLESS order received: ${orderId}`,
        '',
        `Customer: ${order.customerName}`,
        `Email: ${order.customerEmail}`,
        `Shipping city: ${order.location || 'Not provided'}`,
        '',
        orderLines,
        '',
        `Total: ₹${order.total}`
    ].join('\n');

    try {
        await Promise.all([
            transport.sendMail({
                from,
                to: order.customerEmail,
                subject: `THELOGOLESS order confirmed - ${orderId}`,
                text: customerText,
                html: generateOrderEmailHTML(order, false)
            }),
            transport.sendMail({
                from,
                to: ADMIN_EMAIL,
                subject: `New THELOGOLESS order - ${orderId}`,
                text: adminText,
                html: generateOrderEmailHTML(order, true)
            })
        ]);

        return { sent: true, skipped: false };
    } catch (error) {
        console.error('Order email failed:', error);
        return { sent: false, skipped: false, error: 'Email delivery failed' };
    }
};

const toPublicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
});

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, passwordHash) => {
    const [salt, storedHash] = String(passwordHash || '').split(':');
    if (!salt || !storedHash) return false;

    const hash = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(storedHash, 'hex');
    return stored.length === hash.length && crypto.timingSafeEqual(stored, hash);
};

const signToken = (payload) => {
    const body = {
        ...payload,
        exp: Date.now() + TOKEN_TTL_MS
    };
    const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
    const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
    return `${encoded}.${signature}`;
};

const verifyToken = (token) => {
    const [encoded, signature] = String(token || '').split('.');
    if (!encoded || !signature) return null;

    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
        return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.exp && payload.exp > Date.now() ? payload : null;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_EMAIL || 'rajvishvakarma088@gmail.com');

const defaultProducts = [
    {
        _id: 'prod_1',
        name: 'Obsidian Heavyweight Tee',
        category: 'T-SHIRTS',
        price: 120,
        material: '320GSM Long-Staple Egyptian Cotton',
        image: '/logo_tee_mockup.png',
        gallery: ['/logo_tee_mockup.png'],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 25,
        active: true
    },
    {
        _id: 'prod_2',
        name: 'Normandy Linen Shirt',
        category: 'SHIRTS',
        price: 160,
        material: 'Pure Normandy Linen-Cotton Weave',
        image: '/logo_tag_mockup.png',
        gallery: ['/logo_tag_mockup.png'],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 18,
        active: true
    },
    {
        _id: 'prod_3',
        name: 'Okayama Selvedge Denim',
        category: 'JEANS',
        price: 220,
        material: 'Raw Selvedge Denim on Vintage Looms',
        image: '/logo_concept_seam.png',
        gallery: ['/logo_concept_seam.png'],
        sizes: ['28', '30', '32', '34'],
        stock: 14,
        active: true
    },
    {
        _id: 'prod_4',
        name: 'Sage Terry Hoodie',
        category: 'HOODIES',
        price: 190,
        material: '380GSM Organic Terry Fleece',
        image: '/logo_concept_dots.png',
        gallery: ['/logo_concept_dots.png'],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 16,
        active: true
    },
    {
        _id: 'prod_5',
        name: 'Bronze Cashmere Coat',
        category: 'OUTERWEAR',
        price: 380,
        material: 'Brushed Italian Cashmere Blend',
        image: '/logo_concept_fold.png',
        gallery: ['/logo_concept_fold.png'],
        sizes: ['S', 'M', 'L'],
        stock: 9,
        active: true
    },
    {
        _id: 'prod_6',
        name: 'Bronze Sculptural Hanger',
        category: 'ACCESSORIES',
        price: 80,
        material: 'Solid Engraved Bronze Boutique Hardware',
        image: '/logo_concept_hanger.png',
        gallery: ['/logo_concept_hanger.png'],
        sizes: ['ONE SIZE'],
        stock: 40,
        active: true
    }
];

let isMongo = false;

const ProductSchema = new mongoose.Schema({
    _id: { type: String, default: () => createId('prod') },
    name: { type: String, required: true },
    category: { type: String, default: 'UNCATEGORIZED' },
    price: { type: Number, required: true },
    material: String,
    description: String,
    image: String,
    gallery: [String],
    sizes: [String],
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
}, { timestamps: true });

const CartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [{
        productId: String,
        quantity: Number,
        size: String
    }]
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
    userId: String,
    customerName: String,
    customerEmail: String,
    location: String,
    items: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        size: String
    }],
    subtotal: Number,
    total: Number,
    paymentStatus: { type: String, default: 'pending' },
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

const NewsletterSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});

let Product, User, Cart, Order, Newsletter;

const ensureJsonFiles = () => {
    [
        PRODUCTS_FILE,
        ORDERS_FILE,
        NEWSLETTER_FILE,
        USERS_FILE,
        CARTS_FILE
    ].forEach((filePath) => {
        if (!fs.existsSync(filePath)) {
            writeJsonDB(filePath, []);
        }
    });

    if (readJsonDB(PRODUCTS_FILE).length === 0) {
        writeJsonDB(PRODUCTS_FILE, defaultProducts);
    }
};

const seedAdminUser = async () => {
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return;

    if (isMongo) {
        const existing = await User.findOne({ email });
        if (!existing) {
            await User.create({
                name: process.env.ADMIN_NAME || 'Admin',
                email,
                passwordHash: hashPassword(password),
                role: 'admin'
            });
            console.log(`Seeded admin user ${email}`);
        }
        return;
    }

    const users = readJsonDB(USERS_FILE);
    if (!users.some((user) => user.email === email)) {
        users.push({
            _id: createId('usr'),
            name: process.env.ADMIN_NAME || 'Admin',
            email,
            passwordHash: hashPassword(password),
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        writeJsonDB(USERS_FILE, users);
        console.log(`Seeded admin user ${email}`);
    }
};

console.log('Attempting to connect to MongoDB...');
try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thelogoless', {
        serverSelectionTimeoutMS: 3000
    });
    console.log('Successfully connected to MongoDB.');
    isMongo = true;

    Product = mongoose.model('Product', ProductSchema);
    User = mongoose.model('User', UserSchema);
    Cart = mongoose.model('Cart', CartSchema);
    Order = mongoose.model('Order', OrderSchema);
    Newsletter = mongoose.model('Newsletter', NewsletterSchema);

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
        console.log('Seeding default products to MongoDB...');
        await Product.insertMany(defaultProducts);
    }
} catch (err) {
    console.warn('MongoDB connection failed. Switching to Local JSON File database mode.');
    isMongo = false;
    ensureJsonFiles();
}

await seedAdminUser();

const findUserById = async (userId) => {
    if (isMongo) return User.findById(userId);
    return readJsonDB(USERS_FILE).find((user) => user._id === userId) || null;
};

const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = verifyToken(token);

    if (!payload?.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await findUserById(payload.userId);
    if (!user) {
        return res.status(401).json({ error: 'Invalid user session' });
    }

    req.user = user;
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const getProductById = async (productId) => {
    if (isMongo) return Product.findById(productId);
    return readJsonDB(PRODUCTS_FILE).find((product) => product._id === productId) || null;
};

const hydrateCart = async (cart) => {
    const items = [];

    for (const item of cart.items || []) {
        const product = await getProductById(item.productId);
        if (!product || product.active === false) continue;

        items.push({
            productId: String(product._id),
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: item.quantity,
            size: item.size || null,
            lineTotal: product.price * item.quantity
        });
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return {
        _id: cart._id,
        userId: cart.userId,
        items,
        subtotal,
        total: subtotal
    };
};

const getOrCreateCart = async (userId) => {
    if (isMongo) {
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }
        return cart;
    }

    const carts = readJsonDB(CARTS_FILE);
    let cart = carts.find((entry) => entry.userId === userId);
    if (!cart) {
        cart = {
            _id: createId('cart'),
            userId,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        carts.push(cart);
        writeJsonDB(CARTS_FILE, carts);
    }
    return cart;
};

const saveJsonCart = (cart) => {
    const carts = readJsonDB(CARTS_FILE);
    const index = carts.findIndex((entry) => entry._id === cart._id);
    const nextCart = { ...cart, updatedAt: new Date().toISOString() };

    if (index >= 0) {
        carts[index] = nextCart;
    } else {
        carts.push(nextCart);
    }

    writeJsonDB(CARTS_FILE, carts);
    return nextCart;
};

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        database: isMongo ? 'mongodb' : 'json',
        adminEmail: ADMIN_EMAIL,
        mailReady: Boolean(process.env.SMTP_USER || process.env.EMAIL_USER) && Boolean(process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/dev/mail-status', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Route not found' });
    }

    res.json({
        ready: Boolean(process.env.SMTP_USER || process.env.EMAIL_USER) && Boolean(process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD),
        adminEmail: ADMIN_EMAIL,
        smtpService: process.env.SMTP_SERVICE || 'gmail',
        hasSmtpHost: Boolean(process.env.SMTP_HOST),
        hasSmtpUser: Boolean(process.env.SMTP_USER || process.env.EMAIL_USER),
        hasSmtpPassword: Boolean(process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD),
        mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || ADMIN_EMAIL
    });
});

app.post('/api/dev/test-mail', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Route not found' });
    }

    const to = normalizeEmail(req.body.to || ADMIN_EMAIL);
    if (!isEmail(to)) {
        return res.status(400).json({ error: 'Valid recipient email is required' });
    }

    const transport = getMailTransport();
    if (!transport) {
        return res.status(400).json({ error: 'SMTP config is missing' });
    }

    try {
        const result = await transport.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || ADMIN_EMAIL,
            to,
            subject: 'THELOGOLESS mail test',
            text: `Mail test from THELOGOLESS at ${new Date().toISOString()}`
        });

        res.json({ success: true, accepted: result.accepted, rejected: result.rejected, response: result.response });
    } catch (error) {
        console.error('Test mail failed:', error);
        res.status(500).json({
            success: false,
            code: error.code,
            command: error.command,
            response: error.response,
            message: error.message
        });
    }
});

app.get('/api/dev/database', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Route not found' });
    }

    try {
        if (isMongo) {
            const [products, users, carts, orders, newsletter] = await Promise.all([
                Product.find({}).lean(),
                User.find({}).select('-passwordHash').lean(),
                Cart.find({}).lean(),
                Order.find({}).lean(),
                Newsletter.find({}).lean()
            ]);

            return res.json({
                mode: 'mongodb',
                connection: process.env.MONGODB_URI || 'mongodb://localhost:27017/thelogoless',
                collections: { products, users, carts, orders, newsletter }
            });
        }

        res.json({
            mode: 'json',
            files: {
                products: PRODUCTS_FILE,
                users: USERS_FILE,
                carts: CARTS_FILE,
                orders: ORDERS_FILE,
                newsletter: NEWSLETTER_FILE
            },
            collections: {
                products: readJsonDB(PRODUCTS_FILE),
                users: readJsonDB(USERS_FILE).map(({ passwordHash, ...user }) => user),
                carts: readJsonDB(CARTS_FILE),
                orders: readJsonDB(ORDERS_FILE),
                newsletter: readJsonDB(NEWSLETTER_FILE)
            }
        });
    } catch (error) {
        console.error('Database viewer error:', error);
        res.status(500).json({ error: 'Failed to read database' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !isEmail(email) || password.length < 6) {
        return res.status(400).json({ error: 'Name, valid email, and 6+ character password are required' });
    }

    try {
        if (isMongo) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(409).json({ error: 'Email is already registered' });

            const userCount = await User.countDocuments();
            const user = await User.create({
                name,
                email,
                passwordHash: hashPassword(password),
                role: 'customer'
            });
            const token = signToken({ userId: user._id, role: user.role });
            return res.status(201).json({ success: true, token, user: toPublicUser(user) });
        }

        const users = readJsonDB(USERS_FILE);
        if (users.some((user) => user.email === email)) {
            return res.status(409).json({ error: 'Email is already registered' });
        }

        const user = {
            _id: createId('usr'),
            name,
            email,
            passwordHash: hashPassword(password),
            role: 'customer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(user);
        writeJsonDB(USERS_FILE, users);

        const token = signToken({ userId: user._id, role: user.role });
        res.status(201).json({ success: true, token, user: toPublicUser(user) });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!isEmail(email) || !password) {
        return res.status(400).json({ error: 'Valid email and password are required' });
    }

    try {
        const user = isMongo
            ? await User.findOne({ email })
            : readJsonDB(USERS_FILE).find((entry) => entry.email === email);

        if (!user || !verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = signToken({ userId: user._id, role: user.role });
        res.json({ success: true, token, user: toPublicUser(user) });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out on client' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: toPublicUser(req.user) });
});

app.get('/api/products', async (req, res) => {
    try {
        const products = isMongo
            ? await Product.find({ active: { $ne: false } }).sort({ createdAt: -1 })
            : readJsonDB(PRODUCTS_FILE).filter((product) => product.active !== false);

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product || product.active === false) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve product' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const products = isMongo ? await Product.find({ active: { $ne: false } }) : readJsonDB(PRODUCTS_FILE);
        const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve categories' });
    }
});

app.get('/api/cart', requireAuth, async (req, res) => {
    try {
        const cart = await getOrCreateCart(String(req.user._id));
        res.json(await hydrateCart(cart));
    } catch (error) {
        console.error('Cart fetch error:', error);
        res.status(500).json({ error: 'Failed to retrieve cart' });
    }
});

app.post('/api/cart/items', requireAuth, async (req, res) => {
    const productId = String(req.body.productId || '');
    const quantity = Math.max(1, Number(req.body.quantity || 1));
    const size = req.body.size ? String(req.body.size) : null;

    try {
        const product = await getProductById(productId);
        if (!product || product.active === false) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cart = await getOrCreateCart(String(req.user._id));
        const existing = cart.items.find((item) => item.productId === productId && (item.size || null) === size);

        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, size });
        }

        if (isMongo) {
            await cart.save();
            return res.json(await hydrateCart(cart));
        }

        res.json(await hydrateCart(saveJsonCart(cart)));
    } catch (error) {
        console.error('Cart add error:', error);
        res.status(500).json({ error: 'Failed to add cart item' });
    }
});

app.patch('/api/cart/items/:productId', requireAuth, async (req, res) => {
    const quantity = Number(req.body.quantity);
    const size = req.body.size ? String(req.body.size) : null;

    if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ error: 'Quantity must be a positive integer or zero' });
    }

    try {
        const cart = await getOrCreateCart(String(req.user._id));
        cart.items = cart.items.filter((item) => {
            const matches = item.productId === req.params.productId && (item.size || null) === size;
            if (matches && quantity > 0) item.quantity = quantity;
            return !matches || quantity > 0;
        });

        if (isMongo) {
            await cart.save();
            return res.json(await hydrateCart(cart));
        }

        res.json(await hydrateCart(saveJsonCart(cart)));
    } catch (error) {
        console.error('Cart update error:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
});

app.delete('/api/cart/items/:productId', requireAuth, async (req, res) => {
    const size = req.query.size ? String(req.query.size) : null;

    try {
        const cart = await getOrCreateCart(String(req.user._id));
        cart.items = cart.items.filter((item) => !(item.productId === req.params.productId && (item.size || null) === size));

        if (isMongo) {
            await cart.save();
            return res.json(await hydrateCart(cart));
        }

        res.json(await hydrateCart(saveJsonCart(cart)));
    } catch (error) {
        console.error('Cart remove error:', error);
        res.status(500).json({ error: 'Failed to remove cart item' });
    }
});

app.post('/api/checkout', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const payload = authHeader.startsWith('Bearer ') ? verifyToken(authHeader.slice(7)) : null;
    const user = payload?.userId ? await findUserById(payload.userId) : null;

    const customerName = String(req.body.customerName || user?.name || '').trim();
    const customerEmail = normalizeEmail(req.body.customerEmail || user?.email);
    const location = String(req.body.location || '').trim();
    const requestItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!customerName || !isEmail(customerEmail) || requestItems.length === 0) {
        return res.status(400).json({ error: 'Customer details and cart items are required' });
    }

    try {
        const items = [];
        for (const item of requestItems) {
            const product = await getProductById(String(item.productId));
            const quantity = Math.max(1, Number(item.quantity || 1));
            const fallbackName = String(item.name || '').trim();
            const fallbackPrice = Number(item.price);

            if (!product && (!fallbackName || !Number.isFinite(fallbackPrice))) continue;
            if (product && product.active === false) continue;

            items.push({
                productId: product ? String(product._id) : String(item.productId || createId('item')),
                name: product ? product.name : fallbackName,
                price: product ? product.price : fallbackPrice,
                quantity,
                size: item.size || null
            });
        }

        if (items.length === 0) {
            return res.status(400).json({ error: 'No valid products in order' });
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const orderData = {
            userId: user ? String(user._id) : null,
            customerName,
            customerEmail,
            location,
            items,
            subtotal,
            total: subtotal,
            paymentStatus: 'pending',
            status: 'Pending'
        };

        if (isMongo) {
            const newOrder = await Order.create(orderData);
            if (user) await Cart.findOneAndUpdate({ userId: String(user._id) }, { items: [] });
            const emailStatus = await sendOrderEmails(newOrder.toObject());
            return res.json({ success: true, orderId: newOrder._id, order: newOrder, email: emailStatus });
        }

        const orders = readJsonDB(ORDERS_FILE);
        const newOrder = {
            _id: createId('ord'),
            ...orderData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        orders.push(newOrder);
        writeJsonDB(ORDERS_FILE, orders);

        if (user) {
            const cart = await getOrCreateCart(String(user._id));
            saveJsonCart({ ...cart, items: [] });
        }

        const emailStatus = await sendOrderEmails(newOrder);
        res.json({ success: true, orderId: newOrder._id, order: newOrder, email: emailStatus });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Failed to process checkout' });
    }
});

app.get('/api/orders/my', requireAuth, async (req, res) => {
    try {
        const userId = String(req.user._id);
        const orders = isMongo
            ? await Order.find({ userId }).sort({ createdAt: -1 })
            : readJsonDB(ORDERS_FILE).filter((order) => order.userId === userId).reverse();

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
});

app.get('/api/orders/:id', requireAuth, async (req, res) => {
    try {
        const order = isMongo
            ? await Order.findById(req.params.id)
            : readJsonDB(ORDERS_FILE).find((entry) => entry._id === req.params.id);

        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'admin' && order.userId !== String(req.user._id)) {
            return res.status(403).json({ error: 'You cannot view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve order' });
    }
});

app.post('/api/newsletter', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) {
        return res.status(400).json({ error: 'Valid email address is required' });
    }

    try {
        if (isMongo) {
            const existing = await Newsletter.findOne({ email });
            if (existing) return res.json({ success: true, message: 'Already subscribed.' });

            await Newsletter.create({ email });
            return res.json({ success: true, message: 'Subscribed in MongoDB.' });
        }

        const subs = readJsonDB(NEWSLETTER_FILE);
        if (subs.some((entry) => entry.email === email)) {
            return res.json({ success: true, message: 'Already subscribed.' });
        }

        subs.push({ email, subscribedAt: new Date().toISOString() });
        writeJsonDB(NEWSLETTER_FILE, subs);
        res.json({ success: true, message: 'Subscribed in Local JSON Database.' });
    } catch (error) {
        console.error('Newsletter error:', error);
        res.status(500).json({ error: 'Failed to subscribe email' });
    }
});

app.get('/api/admin/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const orders = isMongo
            ? await Order.find({}).sort({ createdAt: -1 })
            : readJsonDB(ORDERS_FILE).reverse();

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve admin orders' });
    }
});

app.patch('/api/admin/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
    const status = String(req.body.status || '').trim();
    if (!status) return res.status(400).json({ error: 'Status is required' });

    try {
        if (isMongo) {
            const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
            if (!order) return res.status(404).json({ error: 'Order not found' });
            return res.json(order);
        }

        const orders = readJsonDB(ORDERS_FILE);
        const index = orders.findIndex((order) => order._id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Order not found' });

        orders[index] = { ...orders[index], status, updatedAt: new Date().toISOString() };
        writeJsonDB(ORDERS_FILE, orders);
        res.json(orders[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

app.post('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
    const productData = {
        name: String(req.body.name || '').trim(),
        category: String(req.body.category || 'UNCATEGORIZED').trim(),
        price: Number(req.body.price),
        material: String(req.body.material || '').trim(),
        description: String(req.body.description || '').trim(),
        image: String(req.body.image || '').trim(),
        gallery: Array.isArray(req.body.gallery) ? req.body.gallery : [],
        sizes: Array.isArray(req.body.sizes) ? req.body.sizes : [],
        stock: Number(req.body.stock || 0),
        active: req.body.active !== false
    };

    if (!productData.name || !Number.isFinite(productData.price) || productData.price < 0) {
        return res.status(400).json({ error: 'Product name and valid price are required' });
    }

    try {
        if (isMongo) {
            const product = await Product.create(productData);
            return res.status(201).json(product);
        }

        const products = readJsonDB(PRODUCTS_FILE);
        const product = {
            _id: createId('prod'),
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        products.push(product);
        writeJsonDB(PRODUCTS_FILE, products);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.patch('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    const allowed = ['name', 'category', 'price', 'material', 'description', 'image', 'gallery', 'sizes', 'stock', 'active'];
    const updates = {};

    allowed.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
            updates[key] = req.body[key];
        }
    });

    try {
        if (isMongo) {
            const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
            if (!product) return res.status(404).json({ error: 'Product not found' });
            return res.json(product);
        }

        const products = readJsonDB(PRODUCTS_FILE);
        const index = products.findIndex((product) => product._id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Product not found' });

        products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
        writeJsonDB(PRODUCTS_FILE, products);
        res.json(products[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        if (isMongo) {
            const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
            if (!product) return res.status(404).json({ error: 'Product not found' });
            return res.json({ success: true, product });
        }

        const products = readJsonDB(PRODUCTS_FILE);
        const index = products.findIndex((product) => product._id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Product not found' });

        products[index] = { ...products[index], active: false, updatedAt: new Date().toISOString() };
        writeJsonDB(PRODUCTS_FILE, products);
        res.json({ success: true, product: products[index] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} in ${isMongo ? 'MongoDB' : 'Local File'} database mode.`);
    });
}

export default app;
