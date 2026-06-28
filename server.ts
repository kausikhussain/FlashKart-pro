import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client if key exists
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;
if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log("Gemini API client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured or is placeholder. AI features will fallback to smart rule-based mock logic.");
}

// Database Path and Seeding
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

interface DbSchema {
  users: any[];
  products: any[];
  orders: any[];
  notifications: any[];
}

function ensureDbExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const initialProducts = [
    // Fresh Produce
    {
      id: "prod_1",
      name: "Organic Bananas",
      description: "Sweet, perfectly ripe organic bananas. Packed with potassium and energy.",
      price: 60.00,
      category: "Fresh Produce",
      imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",
      stock: 120,
      rating: 4.8,
      reviewsCount: 154,
      unit: "kg"
    },
    {
      id: "prod_2",
      name: "Honeycrisp Apples",
      description: "Crisp, sweet, and juicy red Honeycrisp apples. Perfect for snacking or pies.",
      price: 180.00,
      category: "Fresh Produce",
      imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
      stock: 85,
      rating: 4.7,
      reviewsCount: 92,
      unit: "kg"
    },
    {
      id: "prod_3",
      name: "Fresh Strawberries",
      description: "Plump, sweet, and locally harvested strawberries. Rich in vitamin C.",
      price: 250.00,
      category: "Fresh Produce",
      imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80",
      stock: 40,
      rating: 4.9,
      reviewsCount: 204,
      unit: "pack"
    },
    {
      id: "prod_4",
      name: "Hass Avocados",
      description: "Creamy Hass avocados. Perfect for homemade guacamole, toast, or salads.",
      price: 120.00,
      category: "Fresh Produce",
      imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80",
      stock: 65,
      rating: 4.6,
      reviewsCount: 110,
      unit: "pc"
    },
    {
      id: "prod_5",
      name: "Organic Baby Spinach",
      description: "Pre-washed tender organic baby spinach leaves. Excellent for fresh green salads.",
      price: 90.00,
      category: "Fresh Produce",
      imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
      stock: 50,
      rating: 4.5,
      reviewsCount: 78,
      unit: "bunch"
    },
    // Dairy & Eggs
    {
      id: "prod_6",
      name: "Organic Whole Milk",
      description: "Rich, creamy, pasteurized organic whole milk from pasture-raised cows.",
      price: 65.00,
      category: "Dairy & Eggs",
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80",
      stock: 45,
      rating: 4.8,
      reviewsCount: 130,
      unit: "litre"
    },
    {
      id: "prod_7",
      name: "Greek Yogurt Plain",
      description: "Thick, high-protein Greek yogurt with zero added sugar. Great with berries and honey.",
      price: 120.00,
      category: "Dairy & Eggs",
      imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80",
      stock: 35,
      rating: 4.7,
      reviewsCount: 85,
      unit: "container"
    },
    {
      id: "prod_8",
      name: "Unsalted Sweet Butter",
      description: "Pure cream unsalted butter. Perfect for baking, cooking, and spreading.",
      price: 110.00,
      category: "Dairy & Eggs",
      imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
      stock: 60,
      rating: 4.6,
      reviewsCount: 64,
      unit: "pack"
    },
    {
      id: "prod_9",
      name: "Pasture-Raised Eggs",
      description: "Grade A pasture-raised large brown eggs with deep orange yolks.",
      price: 95.00,
      category: "Dairy & Eggs",
      imageUrl: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80",
      stock: 40,
      rating: 4.9,
      reviewsCount: 215,
      unit: "pack"
    },
    // Meat & Seafood
    {
      id: "prod_10",
      name: "Fresh Atlantic Salmon Fillet",
      description: "Rich in Omega-3, fresh ocean-raised Atlantic salmon fillet with skin on.",
      price: 1200.00,
      category: "Meat & Seafood",
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
      stock: 22,
      rating: 4.9,
      reviewsCount: 143,
      unit: "kg"
    },
    {
      id: "prod_11",
      name: "Organic Chicken Breast",
      description: "Boneless, skinless organic chicken breasts. Lean, tender, and high in protein.",
      price: 340.00,
      category: "Meat & Seafood",
      imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80",
      stock: 30,
      rating: 4.7,
      reviewsCount: 112,
      unit: "kg"
    },
    {
      id: "prod_12",
      name: "USDA Choice Ribeye Steak",
      description: "Beautifully marbled USDA Choice ribeye steak. Juicy, flavorful, and thick-cut.",
      price: 1800.00,
      category: "Meat & Seafood",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
      stock: 15,
      rating: 4.8,
      reviewsCount: 76,
      unit: "kg"
    },
    // Beverages
    {
      id: "prod_13",
      name: "Lime Sparkling Water",
      description: "Refreshing lime-infused sparkling water with zero sugar or calories.",
      price: 150.00,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
      stock: 80,
      rating: 4.5,
      reviewsCount: 88,
      unit: "pack"
    },
    {
      id: "prod_14",
      name: "Organic Cold Brew Coffee",
      description: "Smooth, low-acid cold brew coffee concentrate. Bold and energizing.",
      price: 180.00,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
      stock: 45,
      rating: 4.7,
      reviewsCount: 104,
      unit: "bottle"
    },
    {
      id: "prod_15",
      name: "100% Orange Juice Pure",
      description: "Freshly squeezed 100% orange juice with pulp. Sweet and refreshing.",
      price: 120.00,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
      stock: 55,
      rating: 4.6,
      reviewsCount: 61,
      unit: "bottle"
    },
    // Bakery & Snacks
    {
      id: "prod_16",
      name: "Artisanal Sourdough Bread",
      description: "Freshly baked sourdough with a crisp crust and soft, chewy, tangy crumb.",
      price: 140.00,
      category: "Bakery & Snacks",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
      stock: 25,
      rating: 4.8,
      reviewsCount: 125,
      unit: "loaf"
    },
    {
      id: "prod_17",
      name: "Sea Salt Potato Chips",
      description: "Kettle-cooked golden potato chips seasoned with premium sea salt.",
      price: 40.00,
      category: "Bakery & Snacks",
      imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
      stock: 90,
      rating: 4.4,
      reviewsCount: 72,
      unit: "bag"
    },
    {
      id: "prod_18",
      name: "Gourmet Chocolate Chip Cookies",
      description: "Soft-baked chocolate chip cookies with massive semisweet chocolate chunks.",
      price: 120.00,
      category: "Bakery & Snacks",
      imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
      stock: 40,
      rating: 4.9,
      reviewsCount: 167,
      unit: "pack"
    }
  ];

  const initialUsers = [
    {
      id: "user_customer",
      email: "customer@freshkart.com",
      password: "password", // simple for demo
      name: "Jane Doe",
      role: "customer",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "user_admin",
      email: "admin@freshkart.com",
      password: "admin", // simple for demo
      name: "Fulfillment Manager",
      role: "admin",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "user_customer2",
      email: "alex@example.com",
      password: "password",
      name: "Alex Smith",
      role: "customer",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "user_customer3",
      email: "sarah@example.com",
      password: "password",
      name: "Sarah Jenkins",
      role: "customer",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const initialOrders = [
    {
      id: "ORD-93821",
      userId: "user_customer",
      userName: "Jane Doe",
      items: [
        { productId: "prod_10", name: "Fresh Atlantic Salmon Fillet", price: 1200.00, quantity: 2, imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80", category: "Meat & Seafood" },
        { productId: "prod_1", name: "Organic Bananas", price: 60.00, quantity: 3, imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80", category: "Fresh Produce" },
        { productId: "prod_6", name: "Organic Whole Milk", price: 65.00, quantity: 1, imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80", category: "Dairy & Eggs" }
      ],
      subtotal: 2645.00,
      discount: 264.50,
      deliveryFee: 0.00,
      total: 2380.50,
      status: "delivered",
      shippingAddress: {
        name: "Jane Doe",
        street: "742 Evergreen Terrace",
        city: "Springfield",
        zipCode: "97477",
        phone: "555-0199"
      },
      paymentMethod: "Visa ended in 4242",
      paymentStatus: "paid",
      trackingHistory: [
        { status: "placed", timestamp: new Date(now - 14 * dayMs).toISOString(), note: "Order placed securely" },
        { status: "packed", timestamp: new Date(now - 14 * dayMs + 1 * 60 * 60 * 1000).toISOString(), note: "Items packed with thermal cooling packs" },
        { status: "shipped", timestamp: new Date(now - 14 * dayMs + 3 * 60 * 60 * 1000).toISOString(), note: "Carrier took shipment from facility" },
        { status: "out_for_delivery", timestamp: new Date(now - 14 * dayMs + 6 * 60 * 60 * 1000).toISOString(), note: "Driver John out for delivery" },
        { status: "delivered", timestamp: new Date(now - 14 * dayMs + 7 * 60 * 60 * 1000).toISOString(), note: "Handed directly to resident" }
      ],
      createdAt: new Date(now - 14 * dayMs).toISOString()
    },
    {
      id: "ORD-18472",
      userId: "user_customer",
      userName: "Jane Doe",
      items: [
        { productId: "prod_3", name: "Fresh Strawberries", price: 250.00, quantity: 2, imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80", category: "Fresh Produce" },
        { productId: "prod_9", name: "Pasture-Raised Eggs", price: 95.00, quantity: 1, imageUrl: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80", category: "Dairy & Eggs" },
        { productId: "prod_16", name: "Artisanal Sourdough Bread", price: 140.00, quantity: 1, imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", category: "Bakery & Snacks" }
      ],
      subtotal: 735.00,
      discount: 0.00,
      deliveryFee: 150.00,
      total: 885.00,
      status: "delivered",
      shippingAddress: {
        name: "Jane Doe",
        street: "742 Evergreen Terrace",
        city: "Springfield",
        zipCode: "97477",
        phone: "555-0199"
      },
      paymentMethod: "Apple Pay",
      paymentStatus: "paid",
      trackingHistory: [
        { status: "placed", timestamp: new Date(now - 8 * dayMs).toISOString(), note: "Order placed securely" },
        { status: "packed", timestamp: new Date(now - 8 * dayMs + 45 * 60 * 1000).toISOString(), note: "Packed securely in eco-boxes" },
        { status: "shipped", timestamp: new Date(now - 8 * dayMs + 2 * 60 * 60 * 1000).toISOString(), note: "Dispatched from regional center" },
        { status: "out_for_delivery", timestamp: new Date(now - 8 * dayMs + 4 * 60 * 60 * 1000).toISOString(), note: "Out for local drop off" },
        { status: "delivered", timestamp: new Date(now - 8 * dayMs + 5 * 60 * 60 * 1000).toISOString(), note: "Left on porch as requested" }
      ],
      createdAt: new Date(now - 8 * dayMs).toISOString()
    },
    {
      id: "ORD-88219",
      userId: "user_customer2",
      userName: "Alex Smith",
      items: [
        { productId: "prod_12", name: "USDA Choice Ribeye Steak", price: 1800.00, quantity: 2, imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80", category: "Meat & Seafood" },
        { productId: "prod_13", name: "Lime Sparkling Water", price: 150.00, quantity: 1, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80", category: "Beverages" }
      ],
      subtotal: 3750.00,
      discount: 0.00,
      deliveryFee: 0.00,
      total: 3750.00,
      status: "delivered",
      shippingAddress: {
        name: "Alex Smith",
        street: "123 Maple Street",
        city: "Oakwood",
        zipCode: "90210",
        phone: "555-0322"
      },
      paymentMethod: "Mastercard ended in 8831",
      paymentStatus: "paid",
      trackingHistory: [
        { status: "placed", timestamp: new Date(now - 5 * dayMs).toISOString(), note: "Order placed securely" },
        { status: "packed", timestamp: new Date(now - 5 * dayMs + 1 * 60 * 60 * 1000).toISOString(), note: "Packed with cold-packs" },
        { status: "shipped", timestamp: new Date(now - 5 * dayMs + 3 * 60 * 60 * 1000).toISOString(), note: "Dispatched to Oakwood Depot" },
        { status: "out_for_delivery", timestamp: new Date(now - 5 * dayMs + 5 * 60 * 60 * 1000).toISOString(), note: "Driver Dave route active" },
        { status: "delivered", timestamp: new Date(now - 5 * dayMs + 6 * 60 * 60 * 1000).toISOString(), note: "Delivered to reception" }
      ],
      createdAt: new Date(now - 5 * dayMs).toISOString()
    },
    {
      id: "ORD-55410",
      userId: "user_customer3",
      userName: "Sarah Jenkins",
      items: [
        { productId: "prod_1", name: "Organic Bananas", price: 60.00, quantity: 5, imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80", category: "Fresh Produce" },
        { productId: "prod_6", name: "Organic Whole Milk", price: 65.00, quantity: 2, imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80", category: "Dairy & Eggs" },
        { productId: "prod_18", name: "Gourmet Chocolate Chip Cookies", price: 120.00, quantity: 3, imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80", category: "Bakery & Snacks" }
      ],
      subtotal: 790.00,
      discount: 200.00,
      deliveryFee: 150.00,
      total: 740.00,
      status: "packed",
      shippingAddress: {
        name: "Sarah Jenkins",
        street: "456 Pine Boulevard",
        city: "Metropolis",
        zipCode: "10001",
        phone: "555-0988"
      },
      paymentMethod: "Visa ended in 9191",
      paymentStatus: "paid",
      trackingHistory: [
        { status: "placed", timestamp: new Date(now - 1 * dayMs).toISOString(), note: "Order payment success" },
        { status: "packed", timestamp: new Date(now - 1 * dayMs + 3 * 60 * 60 * 1000).toISOString(), note: "Items sorted and packed in eco-bag" }
      ],
      createdAt: new Date(now - 1 * dayMs).toISOString()
    }
  ];

  const initialNotifications = [
    {
      id: "notif_1",
      userId: "user_customer",
      title: "Welcome to Fresh Kart! 🌿",
      message: "Enjoy ₹200 off your first delivery of ultra-fresh organic food with coupon code FRESH200.",
      read: false,
      type: "promo",
      createdAt: new Date(now - 20 * dayMs).toISOString()
    },
    {
      id: "notif_2",
      userId: "user_customer",
      title: "Order Delivered! 🎉",
      message: "Your order ORD-18472 was successfully hand-delivered. Let us know what you think!",
      read: true,
      type: "order",
      createdAt: new Date(now - 8 * dayMs + 5 * 60 * 60 * 1000).toISOString()
    }
  ];

  if (!fs.existsSync(DB_PATH)) {
    const defaultData: DbSchema = {
      users: initialUsers,
      products: initialProducts,
      orders: initialOrders,
      notifications: initialNotifications
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
    console.log("Seeded database successfully at", DB_PATH);
  }
}

ensureDbExists();

// Database Helper
function readDb(): DbSchema {
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading DB:", err);
    return { users: [], products: [], orders: [], notifications: [] };
  }
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}

// APIs

// Auth APIs
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = readDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "User with this email already exists" });
  }

  const newUser = {
    id: "user_" + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    password, // simple for demo
    name,
    role: "customer",
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  // Return user details (excluding password)
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Products APIs
app.get("/api/products", (req, res) => {
  const db = readDb();
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const { name, description, price, category, imageUrl, stock, rating, unit } = req.body;
  if (!name || !price || !category || !imageUrl) {
    return res.status(400).json({ error: "Missing required product fields" });
  }

  const db = readDb();
  const newProduct = {
    id: "prod_" + Math.random().toString(36).substr(2, 9),
    name,
    description: description || "Fresh item from local sustainable farms.",
    price: parseFloat(price),
    category,
    imageUrl,
    stock: parseInt(stock) || 50,
    rating: parseFloat(rating) || 4.5,
    reviewsCount: 1,
    unit: unit || "pc",
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  writeDb(db);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, imageUrl, stock, rating, unit } = req.body;

  const db = readDb();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.products[index] = {
    ...db.products[index],
    name: name !== undefined ? name : db.products[index].name,
    description: description !== undefined ? description : db.products[index].description,
    price: price !== undefined ? parseFloat(price) : db.products[index].price,
    category: category !== undefined ? category : db.products[index].category,
    imageUrl: imageUrl !== undefined ? imageUrl : db.products[index].imageUrl,
    stock: stock !== undefined ? parseInt(stock) : db.products[index].stock,
    rating: rating !== undefined ? parseFloat(rating) : db.products[index].rating,
    unit: unit !== undefined ? unit : db.products[index].unit,
  };

  writeDb(db);
  res.json(db.products[index]);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialCount = db.products.length;
  db.products = db.products.filter(p => p.id !== id);

  if (db.products.length === initialCount) {
    return res.status(404).json({ error: "Product not found" });
  }

  writeDb(db);
  res.json({ success: true, message: "Product deleted successfully" });
});

// Orders APIs
app.get("/api/orders", (req, res) => {
  const { userId, role } = req.query;
  const db = readDb();

  if (role === "admin") {
    // Admin sees all orders
    return res.json(db.orders);
  }

  if (userId) {
    // Filtered by user
    const userOrders = db.orders.filter(o => o.userId === userId);
    return res.json(userOrders);
  }

  res.status(400).json({ error: "Missing parameters" });
});

app.post("/api/orders", (req, res) => {
  const { userId, userName, items, subtotal, discount, deliveryFee, total, shippingAddress, paymentMethod } = req.body;

  if (!userId || !items || items.length === 0 || !shippingAddress) {
    return res.status(400).json({ error: "Invalid order checkout details" });
  }

  const db = readDb();

  // Deduct inventory stock
  for (const item of items) {
    const productIndex = db.products.findIndex(p => p.id === item.productId);
    if (productIndex !== -1) {
      db.products[productIndex].stock = Math.max(0, db.products[productIndex].stock - item.quantity);
    }
  }

  const newOrder: any = {
    id: "ORD-" + Math.floor(10000 + Math.random() * 90000),
    userId,
    userName: userName || "Valued Customer",
    items,
    subtotal: parseFloat(subtotal),
    discount: parseFloat(discount || 0),
    deliveryFee: parseFloat(deliveryFee || 3.99),
    total: parseFloat(total),
    status: "placed",
    shippingAddress,
    paymentMethod: paymentMethod || "Credit Card",
    paymentStatus: "paid",
    trackingHistory: [
      {
        status: "placed",
        timestamp: new Date().toISOString(),
        note: "Order placed securely. Payment validated and finalized."
      }
    ],
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // Add confirmation notification
  const newNotif = {
    id: "notif_" + Math.random().toString(36).substr(2, 9),
    userId,
    title: "Order Placed! 🛒",
    message: `Thank you! Your order ${newOrder.id} of $${newOrder.total.toFixed(2)} has been securely placed.`,
    read: false,
    type: "order",
    createdAt: new Date().toISOString()
  };
  db.notifications.push(newNotif);

  writeDb(db);
  res.status(201).json(newOrder);
});

// Update order status (Admin)
app.patch("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const db = readDb();
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const defaultNotes: Record<string, string> = {
    placed: "Order received and is pending packing.",
    packed: "Your groceries have been selected and packed securely in thermal bags.",
    shipped: "Order has been dispatched from our regional Fresh Kart center.",
    out_for_delivery: "A courier has taken your package and is heading to your neighborhood.",
    delivered: "Order was safely delivered! Enjoy your fresh grocery items."
  };

  const statusNote = note || defaultNotes[status] || `Fulfillment stage: ${status}`;

  db.orders[index].status = status;
  db.orders[index].trackingHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: statusNote
  });

  // Also append a dynamic notification to the user
  const newNotif = {
    id: "notif_" + Math.random().toString(36).substr(2, 9),
    userId: db.orders[index].userId,
    title: `Order Status Update 📦`,
    message: `Your order ${id} is now [${status.toUpperCase()}]: ${statusNote}`,
    read: false,
    type: "order",
    createdAt: new Date().toISOString()
  };
  db.notifications.push(newNotif);

  writeDb(db);
  res.json(db.orders[index]);
});

// Notifications
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const db = readDb();
  const userNotifs = db.notifications.filter(n => n.userId === userId);
  res.json(userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    db.notifications[index].read = true;
    writeDb(db);
    return res.json(db.notifications[index]);
  }
  res.status(404).json({ error: "Notification not found" });
});

// Broadcast notification (Admin)
app.post("/api/notifications/broadcast", (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  const db = readDb();
  // Get all unique customers
  const customers = db.users.filter(u => u.role === "customer");

  customers.forEach(cust => {
    db.notifications.push({
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      userId: cust.id,
      title,
      message,
      read: false,
      type: "promo",
      createdAt: new Date().toISOString()
    });
  });

  writeDb(db);
  res.json({ success: true, message: `Successfully broadcasted to ${customers.length} users.` });
});


// ==========================================
// GEMINI INTELLIGENT COGNITIVE LAYER (AI ENDPOINTS)
// ==========================================

// 1. AI Stock & Demand Forecasting (Admin)
app.post("/api/ai/forecast", async (req, res) => {
  const db = readDb();
  const products = db.products;
  const orders = db.orders;

  if (!aiClient) {
    // Elegant standard Rule-Based Fallback if Gemini Key is not set or is a placeholder
    const categories = ["Fresh Produce", "Dairy & Eggs", "Meat & Seafood", "Beverages", "Bakery & Snacks"];
    const categoryRecommendations = categories.map(cat => {
      const catProducts = products.filter(p => p.category === cat);
      const totalStock = catProducts.reduce((sum, p) => sum + p.stock, 0);
      const avgStock = catProducts.length ? totalStock / catProducts.length : 0;
      
      let demand: 'High' | 'Medium' | 'Low' = 'Medium';
      let recommended = 25;
      let justification = "Calculated automatically using current purchase metrics.";

      if (cat === "Fresh Produce") {
        demand = "High";
        recommended = 65;
        justification = "Seasonal demands and high transaction speeds of fresh items show rapid stock-out possibilities.";
      } else if (cat === "Dairy & Eggs") {
        demand = "High";
        recommended = 40;
        justification = "Consistent daily volume indicates steady re-purchasing. Maintain 35% higher safety buffers.";
      } else if (totalStock < 80) {
        demand = "Medium";
        recommended = 30;
        justification = "Stock ratios are trending downward relative to the weekly average. Restock recommended.";
      } else {
        demand = "Low";
        recommended = 10;
        justification = "Category stock is healthy. Minor restocking of top performers to maintain balance.";
      }

      return {
        category: cat,
        currentStock: totalStock,
        forecastedDemand: demand,
        recommendedRestock: recommended,
        justification
      };
    });

    const summary = "Rule-based inventory analysis suggests prioritizing Fresh Produce and Dairy categories this week. High item turn rates require active restock pipelines to prevent shelf depletion.";
    
    return res.json({ categoryRecommendations, summary, isMock: true });
  }

  try {
    // Send structural inventory summary + order log to Gemini
    const systemPrompt = `You are the Lead Supply Chain & Inventory Forecaster for Fresh Kart, a high-growth grocery platform.
Analyze current product stock and recent customer buying behavior to estimate demands for the next 7 days.
Output your findings strictly as a JSON object, with no markdown formatting tags besides the pure JSON structure. 
Matching this exact TypeScript schema:
{
  "categoryRecommendations": [
    {
      "category": string,
      "currentStock": number,
      "forecastedDemand": "High" | "Medium" | "Low",
      "recommendedRestock": number,
      "justification": string
    }
  ],
  "summary": string
}

Here is the current catalog (showing product id, name, category, and current stock):
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, stock: p.stock })), null, 2)}

Here is the completed order history (each item shows productId, name, price, quantity, and date of purchase):
${JSON.stringify(orders.map(o => ({ date: o.createdAt, total: o.total, items: o.items.map((i: any) => ({ productId: i.productId, name: i.name, quantity: i.quantity })) })), null, 2)}

Provide actionable insights. Ensure your JSON is absolutely valid. Do NOT enclose in \`\`\`json markdown blocks if returning directly.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    // Safe parse
    const data = JSON.parse(text);
    res.json({ ...data, isMock: false });
  } catch (error) {
    console.error("Gemini forecasting failed, returning fallback:", error);
    res.status(500).json({ error: "Failed to generate AI forecast", details: String(error) });
  }
});

// 2. AI Personalized Recommendations (Customer Dashboard)
app.get("/api/ai/recommendations", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const db = readDb();
  const products = db.products;
  const userOrders = db.orders.filter(o => o.userId === userId);

  // If no Gemini API, fallback to smart filtering
  if (!aiClient || userOrders.length === 0) {
    // Recommend top rated products in categories they purchased or just top overall
    const purchasedCategories = new Set<string>();
    userOrders.forEach(o => o.items.forEach((i: any) => purchasedCategories.add(i.category)));

    let recommended = products;
    if (purchasedCategories.size > 0) {
      recommended = products.filter(p => purchasedCategories.has(p.category));
    }
    
    // Sort by rating descending and slice 4
    const recommendedSlice = recommended
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    const reasons = [
      "Based on your preference for fresh, organic ingredients.",
      "A popular customer favorite that matches your grocery profile.",
      "Highly-rated staple that pairs perfectly with your past buys.",
      "Freshly stocked this morning and highly recommended today."
    ];

    const finalRecommendations = recommendedSlice.map((p, index) => ({
      product: p,
      reason: reasons[index % reasons.length]
    }));

    return res.json({
      recommendations: finalRecommendations,
      hook: "We curated these delicious, fresh options based on your weekly grocery shopping basket!",
      isMock: true
    });
  }

  try {
    const userCartHistory = userOrders.flatMap(o => o.items.map((i: any) => `${i.name} (Qty: ${i.quantity}) in ${i.category}`));
    const prompt = `You are a personalized shopping advisor for Fresh Kart.
Based on the customer's purchase history:
${JSON.stringify(userCartHistory)}

And our store catalog:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, rating: p.rating, description: p.description })))}

Recommend exactly 4 products from the catalog. For each recommendation, provide a custom, ultra-personalized one-sentence explanation of WHY they should buy it based on their history. Also provide an overall warm greeting hook.
Output strictly in JSON matching this schema (with no markdown wrapping):
{
  "recommendations": [
    {
      "productId": string,
      "reason": string
    }
  ],
  "hook": string
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || "{}");
    // Hydrate the recommendations with actual product details
    const hydratedRecommendations = data.recommendations
      .map((rec: any) => {
        const prod = products.find(p => p.id === rec.productId);
        return prod ? { product: prod, reason: rec.reason } : null;
      })
      .filter(Boolean);

    res.json({
      recommendations: hydratedRecommendations,
      hook: data.hook || "Based on your taste, we recommend trying these items!",
      isMock: false
    });
  } catch (error) {
    console.error("AI recommendations failed:", error);
    res.status(500).json({ error: "Failed to generate AI recommendations" });
  }
});

// 3. AI Recipe Grocery List Generator (Customer UI)
app.post("/api/ai/recipe", async (req, res) => {
  const { recipePrompt } = req.body;
  if (!recipePrompt) {
    return res.status(400).json({ error: "Recipe name or prompt is required" });
  }

  const db = readDb();
  const products = db.products;

  if (!aiClient) {
    // High-fidelity Mock Recipes fallback
    const mockRecipes: Record<string, any> = {
      "spaghetti carbonara": {
        name: "Classic Spaghetti Carbonara",
        description: "A creamy, decadent Roman pasta dish with bacon, pasture-raised eggs, and premium cheese.",
        ingredients: [
          { name: "Sourdough Bread", amount: "1 loaf", category: "Bakery & Snacks", matchedProduct: products.find(p => p.id === "prod_16") },
          { name: "Pasture-Raised Eggs", amount: "1 dozen", category: "Dairy & Eggs", matchedProduct: products.find(p => p.id === "prod_9") },
          { name: "Whole Milk", amount: "1/2 gallon", category: "Dairy & Eggs", matchedProduct: products.find(p => p.id === "prod_6") }
        ],
        instructions: [
          "Boil standard spaghetti pasta in salted water until al dente.",
          "Crisp sliced bacon in a pan until golden.",
          "Whisk eggs with cheese and pepper. Toss warm pasta with bacon, remove from heat, and quickly stir in egg mixture to create a silky, emulsified sauce."
        ]
      },
      "fruit salad": {
        name: "Organic Fruit Salad",
        description: "A refreshing blend of fresh sweet bananas, organic Honeycrisp apples, and plump strawberries.",
        ingredients: [
          { name: "Organic Bananas", amount: "3 pcs", category: "Fresh Produce", matchedProduct: products.find(p => p.id === "prod_1") },
          { name: "Honeycrisp Apples", amount: "2 lbs", category: "Fresh Produce", matchedProduct: products.find(p => p.id === "prod_2") },
          { name: "Fresh Strawberries", amount: "1 pack", category: "Fresh Produce", matchedProduct: products.find(p => p.id === "prod_3") }
        ],
        instructions: [
          "Thoroughly wash the fresh strawberries and apples.",
          "Slice bananas and apples into uniform bite-sized pieces.",
          "Combine all fruits in a large salad bowl, gently tossing with optional lime juice or honey."
        ]
      },
      "steak night": {
        name: "Gourmet Ribeye Steak Dinner",
        description: "An elegant steak night featuring thick-cut, tender USDA Choice ribeye, buttery baby spinach, and orange juice splash.",
        ingredients: [
          { name: "USDA Choice Ribeye Steak", amount: "2 lbs", category: "Meat & Seafood", matchedProduct: products.find(p => p.id === "prod_12") },
          { name: "Organic Baby Spinach", amount: "1 tub", category: "Fresh Produce", matchedProduct: products.find(p => p.id === "prod_5") },
          { name: "Unsalted Sweet Butter", amount: "1 pack", category: "Dairy & Eggs", matchedProduct: products.find(p => p.id === "prod_8") },
          { name: "100% Orange Juice Pure", amount: "1 bottle", category: "Beverages", matchedProduct: products.find(p => p.id === "prod_15") }
        ],
        instructions: [
          "Preheat your pan or grill to high heat.",
          "Pat the ribeye steaks completely dry, season generously with salt and pepper, and sear 3-4 minutes per side with butter basting.",
          "Sauté the pre-washed baby spinach in butter for 1-2 minutes until wilted. Serve hot next to the steak."
        ]
      }
    };

    const cleanPrompt = recipePrompt.toLowerCase().trim();
    let selectedRecipe = mockRecipes["fruit salad"]; // default fallback

    if (cleanPrompt.includes("carbonara") || cleanPrompt.includes("spaghetti") || cleanPrompt.includes("pasta")) {
      selectedRecipe = mockRecipes["spaghetti carbonara"];
    } else if (cleanPrompt.includes("steak") || cleanPrompt.includes("ribeye") || cleanPrompt.includes("meat")) {
      selectedRecipe = mockRecipes["steak night"];
    } else if (cleanPrompt.includes("fruit") || cleanPrompt.includes("banana") || cleanPrompt.includes("strawberry")) {
      selectedRecipe = mockRecipes["fruit salad"];
    } else {
      // Dynamic recipe synthesizer using local ingredients list!
      selectedRecipe = {
        name: `Fresh ${recipePrompt} Platter`,
        description: `A delicious custom recipe using Fresh Kart's local premium grocery inventory.`,
        ingredients: [
          { name: "Fresh Produce Match", amount: "1 lb", category: "Fresh Produce", matchedProduct: products.find(p => p.category === "Fresh Produce") },
          { name: "Dairy Staple Match", amount: "1 pack", category: "Dairy & Eggs", matchedProduct: products.find(p => p.category === "Dairy & Eggs") },
          { name: "Bakery Side Match", amount: "1 loaf", category: "Bakery & Snacks", matchedProduct: products.find(p => p.category === "Bakery & Snacks") }
        ],
        instructions: [
          "Gently wash and prepare your fresh catalog items.",
          "Combine and layer items, plating them elegantly.",
          "Enjoy a quick, sustainable, nutrient-packed dish!"
        ]
      };
    }

    return res.json({ recipe: selectedRecipe, isMock: true });
  }

  try {
    const prompt = `You are the Chef AI Assistant for Fresh Kart.
The user wants to prepare this recipe: "${recipePrompt}"
Your job is to generate a recipe description, a list of ingredients with amounts, and instructions.
CRITICAL STEP: For every ingredient needed, look through our catalog of store products:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, unit: p.unit })))}
And find the CLOSEST MATCHING product in our catalog. If a product is an excellent or highly reasonable match, put its full details in 'matchedProduct'. If nothing in our store matches (e.g. olive oil or salt, which we don't carry), leave 'matchedProduct' as null.

Output strictly as a JSON object matching this schema (with no markdown wrapping):
{
  "name": string,
  "description": string,
  "ingredients": [
    {
      "name": string,
      "amount": string,
      "category": string,
      "matchedProduct": {
        "id": string,
        "name": string,
        "price": number,
        "category": string,
        "unit": string
      } or null
    }
  ],
  "instructions": [
    string
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    // Ensure all matched products have their true imageUrls attached
    if (parsedData.ingredients) {
      parsedData.ingredients.forEach((ing: any) => {
        if (ing.matchedProduct && ing.matchedProduct.id) {
          const actualProd = products.find(p => p.id === ing.matchedProduct.id);
          if (actualProd) {
            ing.matchedProduct.imageUrl = actualProd.imageUrl;
            ing.matchedProduct.description = actualProd.description;
            ing.matchedProduct.stock = actualProd.stock;
            ing.matchedProduct.rating = actualProd.rating;
          }
        }
      });
    }

    res.json({ recipe: parsedData, isMock: false });
  } catch (error) {
    console.error("AI Recipe creation failed, returning default:", error);
    res.status(500).json({ error: "Failed to generate AI recipe" });
  }
});


// Vite Asset Serving & Development Routing Setup

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fresh Kart server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
