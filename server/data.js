// Seed data for the demo. Everything lives in memory and resets when the server restarts.

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const between = (min, max) => min + rand() * (max - min);
const pick = (list) => list[Math.floor(rand() * list.length)];

export const CATEGORIES = ['Footwear', 'Apparel', 'Equipment', 'Accessories'];

const NAMES = {
  Footwear: ['Trail Runner', 'Court Classic', 'Hiking Boot', 'Training Shoe', 'Turf Cleats'],
  Apparel: ['Performance Tee', 'Zip Hoodie', 'Running Shorts', 'Rain Jacket', 'Compression Tights'],
  Equipment: ['Yoga Mat', 'Dumbbell Set', 'Soccer Ball', 'Tennis Racket', 'Jump Rope'],
  Accessories: ['Water Bottle', 'Gym Bag', 'Sports Cap', 'Wristbands', 'Sunglasses'],
};

export const products = [];
let id = 1;
for (const category of CATEGORIES) {
  for (const base of NAMES[category]) {
    for (const variant of ['Pro', 'Lite']) {
      products.push({
        id: id++,
        name: `${base} ${variant}`,
        category,
        price: Math.round(between(8, 140) * 100) / 100,
        stock: Math.floor(between(0, 120)),
      });
    }
  }
}

const CUSTOMERS = [
  'Ava Thompson', 'Liam Carter', 'Noah Bennett', 'Emma Rivera', 'Olivia Brooks', 'Ethan Hughes',
  'Mia Foster', 'Lucas Reed', 'Sophia Ward', 'Mason Cooper', 'Isabella Gray', 'James Powell',
];

const STATUSES = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Processing', 'Cancelled'];

export const orders = [];
const DAY = 24 * 60 * 60 * 1000;
for (let i = 1; i <= 90; i++) {
  orders.push({
    id: 1000 + i,
    customer: pick(CUSTOMERS),
    total: Math.round(between(20, 400) * 100) / 100,
    status: pick(STATUSES),
    date: new Date(Date.now() - Math.floor(between(0, 180)) * DAY).toISOString(),
  });
}
