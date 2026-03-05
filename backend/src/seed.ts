import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User'
import Category from './models/Category'
import Product from './models/Product'
import Review from './models/Review'
import Order from './models/Order'

dotenv.config()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const rndRating = () => Math.round((Math.random() * 2 + 3) * 10) / 10 // 3.0–5.0

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const userData = [
  { name: 'Admin User',  email: 'admin@test.com', password: '123456', role: 'admin'    as const },
  { name: 'John Doe',    email: 'john@test.com',  password: '123456', role: 'customer' as const },
]

const categoryData = [
  { name: 'Electronics',       slug: 'electronics',       image: '/images/cat-electronics.jpg' },
  { name: 'Clothing',          slug: 'clothing',           image: '/images/cat-clothing.jpg'    },
  { name: 'Home & Kitchen',    slug: 'home-kitchen',       image: '/images/cat-home-kitchen.jpg'},
  { name: 'Sports & Outdoors', slug: 'sports-outdoors',    image: '/images/cat-sports.jpg'      },
  { name: 'Books',             slug: 'books',              image: '/images/cat-books.jpg'       },
]

// ---------------------------------------------------------------------------
// Products — 4 per category
// NOTE: product index 3 (0-based)  → isActive: false (inactive filter test)
//       product index 7 (0-based)  → stock: 0         (out-of-stock filter test)
// ---------------------------------------------------------------------------

const buildProducts = (catIds: mongoose.Types.ObjectId[]) => {
  const [electronics, clothing, homeKitchen, sports, books] = catIds

  return [
    // ── Electronics ─────────────────────────────────────────────────────────
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description:
        'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and high-fidelity sound. Perfect for travel, work, and everyday listening.',
      price: 149.99,
      images: ['/images/product-1.jpg'],
      category: electronics,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Connectivity', value: 'Bluetooth 5.2' },
        { key: 'Battery Life', value: '30 hours' },
        { key: 'Driver Size',  value: '40 mm' },
      ],
    },
    {
      name: '4K Smart TV 55"',
      description:
        '55-inch 4K UHD Smart TV with HDR10+, built-in Wi-Fi, and access to all major streaming platforms. Vivid colors and deep contrast for a cinema-quality experience at home.',
      price: 699.99,
      images: ['/images/product-2.jpg'],
      category: electronics,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Resolution',   value: '3840 × 2160 (4K UHD)' },
        { key: 'HDR',          value: 'HDR10+' },
        { key: 'Smart OS',     value: 'WebOS 23' },
      ],
    },
    {
      name: 'Mechanical Gaming Keyboard',
      description:
        'Full-size mechanical keyboard with tactile switches, per-key RGB backlighting, and an aluminium frame. N-key rollover ensures every keystroke registers in intense gaming sessions.',
      price: 89.99,
      images: ['/images/product-3.jpg'],
      category: electronics,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Switch Type',  value: 'Brown Tactile' },
        { key: 'Backlighting', value: 'Per-key RGB' },
        { key: 'Rollover',     value: 'N-key' },
      ],
    },
    {
      // isActive: false — tests inactive-product filtering
      name: 'Portable Bluetooth Speaker',
      description:
        'Compact 360° speaker with 20W output, IPX7 waterproofing, and 15-hour playtime. Great for outdoor adventures. (Currently unavailable.)',
      price: 59.99,
      images: ['/images/product-4.jpg'],
      category: electronics,
      stock: rnd(5, 100),
      isActive: false,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Output Power', value: '20 W' },
        { key: 'Waterproof',   value: 'IPX7' },
        { key: 'Battery Life', value: '15 hours' },
      ],
    },

    // ── Clothing ─────────────────────────────────────────────────────────────
    {
      name: "Men's Slim Fit Chinos",
      description:
        'Versatile slim-fit chinos crafted from stretch cotton for all-day comfort. Available in multiple colours, smart enough for the office and casual enough for weekends.',
      price: 49.99,
      images: ['/images/product-5.jpg'],
      category: clothing,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',  value: '97% Cotton, 3% Elastane' },
        { key: 'Fit',       value: 'Slim' },
        { key: 'Care',      value: 'Machine wash 30°C' },
      ],
    },
    {
      name: "Women's Running Jacket",
      description:
        'Lightweight windproof running jacket with moisture-wicking lining, reflective details for low-light visibility, and a packable hood. Designed for serious runners.',
      price: 79.99,
      images: ['/images/product-6.jpg'],
      category: clothing,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',    value: '100% Recycled Polyester' },
        { key: 'Fit',         value: 'Athletic' },
        { key: 'Feature',     value: 'Windproof, Reflective' },
      ],
    },
    {
      name: 'Unisex Cotton Hoodie',
      description:
        'Super-soft 380 gsm French terry hoodie with a kangaroo pocket and adjustable drawstring hood. A timeless wardrobe essential for every season.',
      price: 44.99,
      images: ['/images/product-7.jpg'],
      category: clothing,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material', value: '80% Cotton, 20% Polyester' },
        { key: 'Weight',   value: '380 gsm' },
        { key: 'Fit',      value: 'Relaxed Unisex' },
      ],
    },
    {
      // stock: 0 — tests out-of-stock filtering
      name: 'Classic White Oxford Shirt',
      description:
        'Crisp 100% cotton Oxford shirt with a button-down collar. A wardrobe cornerstone that pairs with anything from jeans to tailored trousers. (Currently out of stock.)',
      price: 39.99,
      images: ['/images/product-8.jpg'],
      category: clothing,
      stock: 0,
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material', value: '100% Cotton Oxford' },
        { key: 'Collar',   value: 'Button-down' },
        { key: 'Care',     value: 'Machine wash 40°C' },
      ],
    },

    // ── Home & Kitchen ───────────────────────────────────────────────────────
    {
      name: 'Stainless Steel Cookware Set (10-piece)',
      description:
        '10-piece tri-ply stainless steel cookware set including saucepans, frying pans, and a stockpot. Induction-compatible with riveted stainless handles and glass lids.',
      price: 189.99,
      images: ['/images/product-9.jpg'],
      category: homeKitchen,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',   value: 'Tri-ply Stainless Steel' },
        { key: 'Compatible', value: 'All hobs including induction' },
        { key: 'Pieces',     value: '10' },
      ],
    },
    {
      name: 'HEPA Air Purifier',
      description:
        'Smart air purifier covering rooms up to 50 m² with a true HEPA H13 filter that captures 99.97% of particles. Auto mode adjusts fan speed based on real-time air quality.',
      price: 129.99,
      images: ['/images/product-10.jpg'],
      category: homeKitchen,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Filter Grade',  value: 'HEPA H13' },
        { key: 'Coverage',      value: 'Up to 50 m²' },
        { key: 'Noise Level',   value: '25 dB (sleep mode)' },
      ],
    },
    {
      name: 'Bamboo Cutting Board Set (3-piece)',
      description:
        'Eco-friendly bamboo cutting boards in three sizes for prep work, serving, and carving. Naturally antimicrobial and gentle on knife edges.',
      price: 34.99,
      images: ['/images/product-11.jpg'],
      category: homeKitchen,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',  value: 'Moso Bamboo' },
        { key: 'Pieces',    value: '3 (S / M / L)' },
        { key: 'Feature',   value: 'Juice groove, non-slip feet' },
      ],
    },
    {
      name: 'Electric Gooseneck Kettle 1 L',
      description:
        'Precision pour-over kettle with variable temperature control (60–100 °C), 60-minute keep-warm function, and a real-time LCD display. Perfect for specialty coffee and tea.',
      price: 64.99,
      images: ['/images/product-12.jpg'],
      category: homeKitchen,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Capacity',    value: '1 L' },
        { key: 'Temperature', value: '60–100 °C (variable)' },
        { key: 'Keep Warm',   value: '60 minutes' },
      ],
    },

    // ── Sports & Outdoors ────────────────────────────────────────────────────
    {
      name: 'Adjustable Dumbbell Set (5–52.5 lb)',
      description:
        'Space-saving adjustable dumbbells that replace 15 traditional weights. Dial select from 5 to 52.5 lb in 2.5 lb increments. Includes storage tray.',
      price: 249.99,
      images: ['/images/product-13.jpg'],
      category: sports,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Weight Range', value: '5–52.5 lb per dumbbell' },
        { key: 'Increments',   value: '2.5 lb' },
        { key: 'Material',     value: 'Steel with rubber coating' },
      ],
    },
    {
      name: 'Premium Non-Slip Yoga Mat',
      description:
        '6 mm thick natural rubber yoga mat with alignment lines, superior grip on both sides, and a carry strap. Eco-certified and free of PVC, AZO dyes, and heavy metals.',
      price: 59.99,
      images: ['/images/product-14.jpg'],
      category: sports,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',   value: 'Natural Rubber' },
        { key: 'Thickness',  value: '6 mm' },
        { key: 'Dimensions', value: '183 × 61 cm' },
      ],
    },
    {
      name: 'Trekking Poles — Pair',
      description:
        'Lightweight carbon-fibre trekking poles with cork grips, tungsten carbide tips, and three-section telescopic adjustment (105–135 cm). Folds to 40 cm for pack storage.',
      price: 74.99,
      images: ['/images/product-15.jpg'],
      category: sports,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',    value: 'Carbon Fibre' },
        { key: 'Length',      value: '105–135 cm (adjustable)' },
        { key: 'Packed Size', value: '40 cm' },
      ],
    },
    {
      name: 'Resistance Bands Set (5 levels)',
      description:
        'Set of five latex-free resistance bands from extra-light to extra-heavy for strength training, physiotherapy, and stretching routines. Includes mesh carry bag and exercise guide.',
      price: 24.99,
      images: ['/images/product-16.jpg'],
      category: sports,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Material',  value: 'Latex-free TPE' },
        { key: 'Levels',    value: '5 (XS / S / M / L / XL)' },
        { key: 'Includes',  value: 'Carry bag, exercise guide' },
      ],
    },

    // ── Books ────────────────────────────────────────────────────────────────
    {
      name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      description:
        'Robert C. Martin\'s definitive guide to writing readable, maintainable code. Packed with real-world case studies and refactoring examples every developer should study.',
      price: 34.99,
      images: ['/images/product-17.jpg'],
      category: books,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Author',    value: 'Robert C. Martin' },
        { key: 'Pages',     value: '431' },
        { key: 'Publisher', value: 'Prentice Hall' },
      ],
    },
    {
      name: 'The Pragmatic Programmer: 20th Anniversary Edition',
      description:
        'Timeless advice on software development: from career development and coding philosophy to pragmatic project management. A must-read for every working developer.',
      price: 39.99,
      images: ['/images/product-18.jpg'],
      category: books,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Authors',   value: 'Hunt & Thomas' },
        { key: 'Pages',     value: '352' },
        { key: 'Publisher', value: 'Addison-Wesley' },
      ],
    },
    {
      name: 'JavaScript: The Good Parts',
      description:
        'Douglas Crockford distils the JavaScript language down to its most reliable and elegant features. Essential reading for anyone who wants to write robust JS without the pitfalls.',
      price: 24.99,
      images: ['/images/product-19.jpg'],
      category: books,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Author',    value: 'Douglas Crockford' },
        { key: 'Pages',     value: '176' },
        { key: 'Publisher', value: "O'Reilly Media" },
      ],
    },
    {
      name: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      description:
        'The iconic "Gang of Four" book cataloguing 23 foundational design patterns with clear intent, structure diagrams, and C++ / Smalltalk examples applicable in any OO language.',
      price: 44.99,
      images: ['/images/product-20.jpg'],
      category: books,
      stock: rnd(5, 100),
      isActive: true,
      rating: rndRating(),
      numReviews: rnd(5, 50),
      orderCount: rnd(10, 200),
      specifications: [
        { key: 'Authors',   value: 'Gamma, Helm, Johnson, Vlissides' },
        { key: 'Pages',     value: '395' },
        { key: 'Publisher', value: 'Addison-Wesley' },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const seed = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pfcommerce'

  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
  ])
  console.log('Cleared existing User, Category, Product, Review, and Order documents')

  // Users — created individually so the pre-save password-hashing hook fires
  const [adminUser, customerUser] = await Promise.all(
    userData.map((u) => User.create(u))
  )
  console.log(`Created users: ${adminUser.email}, ${customerUser.email}`)

  // Categories
  const categories = await Category.insertMany(categoryData)
  console.log(`Created ${categories.length} categories: ${categories.map((c) => c.name).join(', ')}`)

  // Products
  const catIds = categories.map((c) => c._id as mongoose.Types.ObjectId)
  const products = await Product.insertMany(buildProducts(catIds))
  console.log(`Created ${products.length} products`)

  // ── Review seeding ──────────────────────────────────────────────────────────
  const reviewerData = [
    { name: 'Alice Morgan',  email: 'alice@test.com',  password: '123456', role: 'customer' as const },
    { name: 'Bob Carter',    email: 'bob@test.com',    password: '123456', role: 'customer' as const },
    { name: 'Carol Bennett', email: 'carol@test.com',  password: '123456', role: 'customer' as const },
    { name: 'David Singh',   email: 'david@test.com',  password: '123456', role: 'customer' as const },
  ]
  const extraReviewers = await Promise.all(reviewerData.map((u) => User.create(u)))
  const allReviewers = [customerUser, ...extraReviewers]

  const reviewComments = [
    'Really impressed with the quality. Would definitely buy again.',
    'Exactly as described. Arrived quickly and well packaged.',
    'Great value for money. Does everything I need it to.',
    'Solid product overall. A few minor quirks but nothing deal-breaking.',
    'Exceeded my expectations. Highly recommend to anyone looking for this.',
    'Good quality, but the sizing runs a little small — order up.',
    'Works perfectly out of the box. Setup was super easy.',
    'Nice build quality. Feels premium and durable.',
    'Happy with the purchase. Will be back for more.',
    'Does the job well. Not flashy but very reliable.',
  ]

  const weightedRating = () => {
    const weights = [0, 0, 1, 2, 3, 4] // index = rating; 0 unused; skews toward 3-5
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 1; i <= 5; i++) {
      r -= weights[i]
      if (r <= 0) return i
    }
    return 5
  }

  const activeProducts = products.filter((p) => p.isActive && p.stock > 0)
  const reviewDocs: { user: mongoose.Types.ObjectId; product: mongoose.Types.ObjectId; rating: number; comment: string }[] = []

  for (const product of activeProducts) {
    const count = rnd(3, 5)
    const shuffled = [...allReviewers].sort(() => Math.random() - 0.5).slice(0, count)
    for (const reviewer of shuffled) {
      reviewDocs.push({
        user: reviewer._id as mongoose.Types.ObjectId,
        product: product._id as mongoose.Types.ObjectId,
        rating: weightedRating(),
        comment: reviewComments[rnd(0, reviewComments.length - 1)],
      })
    }
  }

  await Review.insertMany(reviewDocs)
  console.log(`Created ${reviewDocs.length} reviews across ${activeProducts.length} active products`)

  // Seed delivered orders matching every (reviewer, product) review pair
  const orderDocs = reviewDocs.map(({ user, product }) => {
    const prod = products.find((p) =>
      (p._id as mongoose.Types.ObjectId).equals(product)
    )!
    return {
      user,
      items: [{ product, name: prod.name, image: prod.images[0] ?? '', price: prod.price, quantity: 1 }],
      shippingAddress: { fullName: 'Seed User', address: '1 Test St', city: 'Testville', postalCode: '00000', country: 'US' },
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      itemsPrice: prod.price,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: prod.price,
    }
  })
  await Order.insertMany(orderDocs)
  console.log(`Created ${orderDocs.length} delivered orders for seeded reviews`)

  // Give every test user delivered orders for 2 products they haven't reviewed yet,
  // so the review form is usable for all test accounts.
  const reviewedSet = new Set(reviewDocs.map((r) => `${r.user}-${r.product}`))
  const allTestUsers = [customerUser, ...extraReviewers]

  const demoOrderDocs = allTestUsers.flatMap((u) => {
    const uid = u._id as mongoose.Types.ObjectId
    return activeProducts
      .filter((p) => !reviewedSet.has(`${uid}-${p._id}`))
      .slice(0, 2)
      .map((prod) => ({
        user: uid,
        items: [{ product: prod._id as mongoose.Types.ObjectId, name: prod.name, image: prod.images[0] ?? '', price: prod.price, quantity: 1 }],
        shippingAddress: { fullName: u.name, address: '1 Main St', city: 'Testville', postalCode: '00000', country: 'US' },
        paymentStatus: 'paid' as const,
        orderStatus: 'delivered' as const,
        itemsPrice: prod.price,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: prod.price,
      }))
  })
  await Order.insertMany(demoOrderDocs)
  console.log(`Created ${demoOrderDocs.length} demo delivered orders (2 per test user for review form)`)

  // Recalculate product ratings from seeded reviews
  for (const product of activeProducts) {
    const agg = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    if (agg.length > 0) {
      await Product.findByIdAndUpdate(product._id, {
        rating: Math.round(agg[0].avgRating * 10) / 10,
        numReviews: agg[0].count,
      })
    }
  }
  console.log('Recalculated product ratings from seeded reviews')

  // Summary
  const inactive = products.filter((p) => !p.isActive)
  const outOfStock = products.filter((p) => p.stock === 0)
  console.log('\n── Seed summary ───────────────────────────────')
  console.log(`  Users:        ${await User.countDocuments()}`)
  console.log(`  Categories:   ${await Category.countDocuments()}`)
  console.log(`  Products:     ${await Product.countDocuments()}`)
  console.log(`  Reviews:      ${await Review.countDocuments()}`)
  console.log(`  Orders:       ${await Order.countDocuments()}`)
  console.log(`    → active:       ${products.length - inactive.length}`)
  console.log(`    → inactive:     ${inactive.length}  (${inactive.map((p) => p.name).join(', ')})`)
  console.log(`    → out of stock: ${outOfStock.length}  (${outOfStock.map((p) => p.name).join(', ')})`)
  console.log('───────────────────────────────────────────────\n')

  await mongoose.disconnect()
  console.log('Disconnected from MongoDB')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  mongoose.disconnect()
  process.exit(1)
})
