import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { findRecipes, getRecipeDetails } from "./spoonacular";

/* ───────────────────────── DATA LAYER ───────────────────────── */
const STORAGE_METHODS = {
  fridge: { icon: "❄️", label: "Fridge", multiplier: 1 },
  freezer: { icon: "🧊", label: "Freezer", multiplier: 6 },
  pantry: { icon: "🏠", label: "Pantry", multiplier: 0.6 },
  counter: { icon: "🍽️", label: "Counter", multiplier: 0.4 },
};

const CATEGORIES = {
  dairy: { icon: "🥛", color: "#F59E0B", bg: "#FFFBEB", label: "Dairy" },
  produce: { icon: "🥬", color: "#16A34A", bg: "#F0FDF4", label: "Produce" },
  meat: { icon: "🥩", color: "#DC2626", bg: "#FEF2F2", label: "Meat" },
  bakery: { icon: "🍞", color: "#D97706", bg: "#FFF7ED", label: "Bakery" },
  beverages: { icon: "🧃", color: "#7C3AED", bg: "#F5F3FF", label: "Beverages" },
  frozen: { icon: "🧊", color: "#0EA5E9", bg: "#F0F9FF", label: "Frozen" },
  pantry: { icon: "🫙", color: "#78716C", bg: "#FAFAF9", label: "Pantry" },
  snacks: { icon: "🍿", color: "#EC4899", bg: "#FDF2F8", label: "Snacks" },
  condiments: { icon: "🫚", color: "#EA580C", bg: "#FFF7ED", label: "Condiments" },
  seafood: { icon: "🐟", color: "#0891B2", bg: "#ECFEFF", label: "Seafood" },
  deli: { icon: "🧀", color: "#A16207", bg: "#FEFCE8", label: "Deli" },
  grains: { icon: "🌾", color: "#92400E", bg: "#FFF7ED", label: "Grains" },
};

const GROCERY_STORES = [
  { id: "kroger", name: "Kroger", icon: "🏪", color: "#0057A6", connected: false, desc: "Kroger, Ralph's, Fred Meyer, Harris Teeter" },
  { id: "walmart", name: "Walmart", icon: "🛒", color: "#0071CE", connected: false, desc: "Walmart Grocery & Walmart+" },
  { id: "instacart", name: "Instacart", icon: "🥕", color: "#43B02A", connected: false, desc: "Costco, Aldi, Sprouts & 500+ stores" },
  { id: "target", name: "Target", icon: "🎯", color: "#CC0000", connected: false, desc: "Target same-day delivery & pickup" },
  { id: "wholefds", name: "Whole Foods", icon: "🌿", color: "#00674B", connected: false, desc: "Whole Foods Market stores & delivery" },
  { id: "amazon", name: "Amazon Fresh", icon: "📦", color: "#FF9900", connected: false, desc: "Amazon Prime grocery & Fresh delivery" },
];

// USDA FoodKeeper-inspired shelf life database (days)
const FOOD_DB = [
  { name: "Whole Milk", category: "dairy", shelfLife: { fridge: 10, freezer: 90, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "gal", price: 4.29, calories: 149, protein: 8, barcode: "041130001234", nutrients: "Calcium, Vitamin D, B12" },
  { name: "Greek Yogurt", category: "dairy", shelfLife: { fridge: 14, freezer: 60, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "ct", price: 5.99, calories: 100, protein: 17, barcode: "041130005678", nutrients: "Protein, Probiotics, Calcium" },
  { name: "Cheddar Cheese", category: "dairy", shelfLife: { fridge: 28, freezer: 180, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "oz", price: 3.49, calories: 113, protein: 7, barcode: "041130009012", nutrients: "Calcium, Protein, Vitamin A" },
  { name: "Butter", category: "dairy", shelfLife: { fridge: 60, freezer: 270, pantry: 1, counter: 2 }, defaultStorage: "fridge", unit: "ct", price: 4.99, calories: 102, protein: 0, barcode: "041130003456", nutrients: "Vitamin A, Saturated Fat" },
  { name: "Heavy Cream", category: "dairy", shelfLife: { fridge: 12, freezer: 90, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "pt", price: 3.79, calories: 51, protein: 0, barcode: "041130007890", nutrients: "Vitamin A, Fat" },
  { name: "Eggs", category: "dairy", shelfLife: { fridge: 35, freezer: 365, pantry: 0, counter: 7 }, defaultStorage: "fridge", unit: "dz", price: 3.99, calories: 72, protein: 6, barcode: "041130002345", nutrients: "Protein, B12, Choline" },
  { name: "Baby Spinach", category: "produce", shelfLife: { fridge: 5, freezer: 300, pantry: 0, counter: 1 }, defaultStorage: "fridge", unit: "oz", price: 3.99, calories: 7, protein: 1, barcode: "041130011234", nutrients: "Iron, Vitamin K, Folate" },
  { name: "Avocados", category: "produce", shelfLife: { fridge: 5, freezer: 120, pantry: 0, counter: 4 }, defaultStorage: "counter", unit: "ct", price: 1.50, calories: 240, protein: 3, barcode: "041130015678", nutrients: "Healthy Fats, Potassium, Fiber" },
  { name: "Strawberries", category: "produce", shelfLife: { fridge: 5, freezer: 300, pantry: 0, counter: 2 }, defaultStorage: "fridge", unit: "lb", price: 4.49, calories: 49, protein: 1, barcode: "041130019012", nutrients: "Vitamin C, Manganese, Antioxidants" },
  { name: "Bell Peppers", category: "produce", shelfLife: { fridge: 7, freezer: 240, pantry: 0, counter: 3 }, defaultStorage: "fridge", unit: "ct", price: 1.29, calories: 31, protein: 1, barcode: "041130013456", nutrients: "Vitamin C, Vitamin A, B6" },
  { name: "Bananas", category: "produce", shelfLife: { fridge: 7, freezer: 180, pantry: 0, counter: 5 }, defaultStorage: "counter", unit: "lb", price: 0.69, calories: 105, protein: 1, barcode: "041130017890", nutrients: "Potassium, Vitamin B6, Fiber" },
  { name: "Tomatoes", category: "produce", shelfLife: { fridge: 7, freezer: 180, pantry: 0, counter: 5 }, defaultStorage: "counter", unit: "lb", price: 2.49, calories: 22, protein: 1, barcode: "041130012345", nutrients: "Vitamin C, Lycopene, Potassium" },
  { name: "Lemons", category: "produce", shelfLife: { fridge: 21, freezer: 120, pantry: 0, counter: 7 }, defaultStorage: "fridge", unit: "ct", price: 0.79, calories: 17, protein: 0, barcode: "041130016789", nutrients: "Vitamin C, Citric Acid" },
  { name: "Broccoli", category: "produce", shelfLife: { fridge: 5, freezer: 300, pantry: 0, counter: 1 }, defaultStorage: "fridge", unit: "lb", price: 2.29, calories: 55, protein: 4, barcode: "041130010123", nutrients: "Vitamin C, Vitamin K, Fiber" },
  { name: "Carrots", category: "produce", shelfLife: { fridge: 21, freezer: 300, pantry: 0, counter: 3 }, defaultStorage: "fridge", unit: "lb", price: 1.49, calories: 52, protein: 1, barcode: "041130014567", nutrients: "Beta Carotene, Vitamin K, Fiber" },
  { name: "Garlic", category: "produce", shelfLife: { fridge: 14, freezer: 300, pantry: 60, counter: 14 }, defaultStorage: "pantry", unit: "ct", price: 0.69, calories: 4, protein: 0, barcode: "041130018901", nutrients: "Allicin, Manganese, Vitamin C" },
  { name: "Onions", category: "produce", shelfLife: { fridge: 30, freezer: 240, pantry: 30, counter: 14 }, defaultStorage: "pantry", unit: "lb", price: 1.29, calories: 44, protein: 1, barcode: "041130012456", nutrients: "Quercetin, Vitamin C, Fiber" },
  { name: "Chicken Breast", category: "meat", shelfLife: { fridge: 3, freezer: 270, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "lb", price: 6.99, calories: 165, protein: 31, barcode: "041130021234", nutrients: "Protein, B6, Niacin, Selenium" },
  { name: "Ground Beef", category: "meat", shelfLife: { fridge: 3, freezer: 120, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "lb", price: 5.99, calories: 254, protein: 17, barcode: "041130025678", nutrients: "Protein, Iron, Zinc, B12" },
  { name: "Bacon", category: "meat", shelfLife: { fridge: 7, freezer: 30, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "oz", price: 6.49, calories: 43, protein: 3, barcode: "041130029012", nutrients: "Protein, Sodium, B12" },
  { name: "Pork Chops", category: "meat", shelfLife: { fridge: 4, freezer: 180, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "lb", price: 4.99, calories: 231, protein: 26, barcode: "041130023456", nutrients: "Protein, Thiamine, Zinc" },
  { name: "Salmon Fillet", category: "seafood", shelfLife: { fridge: 2, freezer: 90, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "lb", price: 11.99, calories: 208, protein: 20, barcode: "041130031234", nutrients: "Omega-3, Protein, Vitamin D" },
  { name: "Shrimp", category: "seafood", shelfLife: { fridge: 2, freezer: 180, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "lb", price: 9.99, calories: 85, protein: 20, barcode: "041130035678", nutrients: "Protein, Selenium, B12" },
  { name: "Sourdough Bread", category: "bakery", shelfLife: { fridge: 7, freezer: 90, pantry: 4, counter: 4 }, defaultStorage: "counter", unit: "loaf", price: 4.99, calories: 188, protein: 8, barcode: "041130041234", nutrients: "Iron, Folate, Fiber" },
  { name: "Bagels", category: "bakery", shelfLife: { fridge: 7, freezer: 120, pantry: 3, counter: 3 }, defaultStorage: "counter", unit: "ct", price: 3.99, calories: 245, protein: 10, barcode: "041130045678", nutrients: "Iron, Thiamine, Folate" },
  { name: "Croissants", category: "bakery", shelfLife: { fridge: 5, freezer: 60, pantry: 2, counter: 2 }, defaultStorage: "counter", unit: "ct", price: 5.49, calories: 231, protein: 5, barcode: "041130049012", nutrients: "Iron, Vitamin A" },
  { name: "Tortillas", category: "bakery", shelfLife: { fridge: 21, freezer: 180, pantry: 7, counter: 7 }, defaultStorage: "pantry", unit: "ct", price: 3.29, calories: 140, protein: 4, barcode: "041130043456", nutrients: "Iron, Calcium" },
  { name: "Orange Juice", category: "beverages", shelfLife: { fridge: 10, freezer: 240, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "fl oz", price: 4.49, calories: 112, protein: 2, barcode: "041130051234", nutrients: "Vitamin C, Potassium, Folate" },
  { name: "Almond Milk", category: "beverages", shelfLife: { fridge: 7, freezer: 60, pantry: 180, counter: 0 }, defaultStorage: "fridge", unit: "ct", price: 3.99, calories: 30, protein: 1, barcode: "041130055678", nutrients: "Vitamin E, Calcium, Vitamin D" },
  { name: "Pasta", category: "grains", shelfLife: { fridge: 365, freezer: 730, pantry: 730, counter: 730 }, defaultStorage: "pantry", unit: "oz", price: 1.79, calories: 220, protein: 8, barcode: "041130061234", nutrients: "Iron, Thiamine, Folate" },
  { name: "Rice", category: "grains", shelfLife: { fridge: 365, freezer: 730, pantry: 730, counter: 730 }, defaultStorage: "pantry", unit: "lb", price: 3.49, calories: 206, protein: 4, barcode: "041130065678", nutrients: "Manganese, Selenium, B Vitamins" },
  { name: "Quinoa", category: "grains", shelfLife: { fridge: 365, freezer: 730, pantry: 365, counter: 365 }, defaultStorage: "pantry", unit: "lb", price: 5.99, calories: 222, protein: 8, barcode: "041130069012", nutrients: "Complete Protein, Fiber, Iron" },
  { name: "Olive Oil", category: "condiments", shelfLife: { fridge: 730, freezer: 730, pantry: 540, counter: 365 }, defaultStorage: "pantry", unit: "fl oz", price: 7.99, calories: 119, protein: 0, barcode: "041130071234", nutrients: "Monounsaturated Fat, Vitamin E" },
  { name: "Salsa", category: "condiments", shelfLife: { fridge: 14, freezer: 120, pantry: 365, counter: 0 }, defaultStorage: "fridge", unit: "oz", price: 3.49, calories: 10, protein: 0, barcode: "041130075678", nutrients: "Vitamin C, Lycopene" },
  { name: "Soy Sauce", category: "condiments", shelfLife: { fridge: 730, freezer: 730, pantry: 365, counter: 365 }, defaultStorage: "pantry", unit: "fl oz", price: 3.29, calories: 10, protein: 1, barcode: "041130079012", nutrients: "Sodium, Iron" },
  { name: "Frozen Pizza", category: "frozen", shelfLife: { fridge: 3, freezer: 180, pantry: 0, counter: 0 }, defaultStorage: "freezer", unit: "ct", price: 6.99, calories: 320, protein: 14, barcode: "041130081234", nutrients: "Calcium, Iron" },
  { name: "Ice Cream", category: "frozen", shelfLife: { fridge: 1, freezer: 60, pantry: 0, counter: 0 }, defaultStorage: "freezer", unit: "pt", price: 5.49, calories: 267, protein: 5, barcode: "041130085678", nutrients: "Calcium, Phosphorus" },
  { name: "Frozen Broccoli", category: "frozen", shelfLife: { fridge: 3, freezer: 300, pantry: 0, counter: 0 }, defaultStorage: "freezer", unit: "oz", price: 2.49, calories: 28, protein: 3, barcode: "041130089012", nutrients: "Vitamin C, Vitamin K, Fiber" },
  { name: "Tortilla Chips", category: "snacks", shelfLife: { fridge: 60, freezer: 180, pantry: 60, counter: 60 }, defaultStorage: "pantry", unit: "oz", price: 3.99, calories: 140, protein: 2, barcode: "041130091234", nutrients: "Corn, Iron" },
  { name: "Turkey Slices", category: "deli", shelfLife: { fridge: 5, freezer: 60, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "oz", price: 5.49, calories: 60, protein: 10, barcode: "041130101234", nutrients: "Protein, Selenium, B6" },
  { name: "Hummus", category: "deli", shelfLife: { fridge: 7, freezer: 120, pantry: 0, counter: 0 }, defaultStorage: "fridge", unit: "oz", price: 4.29, calories: 70, protein: 2, barcode: "041130105678", nutrients: "Fiber, Iron, Folate" },
];

const RECIPES = [
  { name: "Chicken Stir-Fry Bowl", time: "25 min", icon: "🍛", servings: 4, difficulty: "Easy", calories: 420, ingredients: ["Chicken Breast", "Bell Peppers", "Rice", "Soy Sauce", "Garlic"], steps: ["Cook rice according to package", "Slice chicken into strips, season with soy sauce", "Stir-fry chicken with garlic until golden", "Add sliced peppers, cook 3 min", "Serve over rice"] },
  { name: "Chicken Pasta Pomodoro", time: "30 min", icon: "🍝", servings: 4, difficulty: "Easy", calories: 510, ingredients: ["Chicken Breast", "Tomatoes", "Pasta", "Garlic", "Olive Oil"], steps: ["Cook pasta al dente", "Dice chicken, sear in olive oil", "Add minced garlic and diced tomatoes", "Simmer sauce 10 minutes", "Toss with pasta and serve"] },
  { name: "Avocado Lime Chicken", time: "20 min", icon: "🥑", servings: 2, difficulty: "Easy", calories: 380, ingredients: ["Chicken Breast", "Avocados", "Lemons"], steps: ["Season and grill chicken breast", "Mash avocado with lemon juice and salt", "Slice chicken and top with avocado cream"] },
  { name: "Beef Bolognese", time: "40 min", icon: "🍝", servings: 6, difficulty: "Medium", calories: 580, ingredients: ["Ground Beef", "Tomatoes", "Pasta", "Onions", "Garlic", "Carrots"], steps: ["Cook pasta al dente", "Sauté diced onions, carrots, and garlic", "Brown ground beef", "Add tomatoes, simmer 20 min", "Toss with pasta and serve"] },
  { name: "Smash Burgers", time: "15 min", icon: "🍔", servings: 4, difficulty: "Easy", calories: 640, ingredients: ["Ground Beef", "Cheddar Cheese", "Onions"], steps: ["Form beef into balls", "Smash flat on hot griddle", "Season with salt and pepper", "Add cheese, cover to melt", "Serve on buns with onions"] },
  { name: "Lemon Herb Salmon", time: "20 min", icon: "🐟", servings: 2, difficulty: "Easy", calories: 350, ingredients: ["Salmon Fillet", "Lemons", "Baby Spinach", "Garlic", "Olive Oil"], steps: ["Season salmon with lemon, garlic, olive oil", "Bake at 400°F for 12 minutes", "Sauté spinach with garlic", "Serve salmon over spinach with lemon wedges"] },
  { name: "Salmon Poke Bowl", time: "15 min", icon: "🍣", servings: 2, difficulty: "Easy", calories: 420, ingredients: ["Salmon Fillet", "Rice", "Avocados", "Soy Sauce"], steps: ["Cook sushi rice and cool", "Cube raw salmon, toss with soy sauce", "Slice avocado", "Assemble bowls with rice, salmon, avocado"] },
  { name: "Shrimp Scampi", time: "20 min", icon: "🦐", servings: 4, difficulty: "Easy", calories: 380, ingredients: ["Shrimp", "Pasta", "Lemons", "Garlic", "Butter"], steps: ["Cook pasta al dente", "Sauté garlic in butter", "Add shrimp, cook until pink", "Squeeze lemon, toss with pasta", "Garnish with parsley"] },
  { name: "Shrimp Fried Rice", time: "15 min", icon: "🍚", servings: 4, difficulty: "Easy", calories: 340, ingredients: ["Shrimp", "Rice", "Bell Peppers", "Eggs", "Soy Sauce", "Garlic"], steps: ["Cook rice and cool", "Scramble eggs, set aside", "Stir-fry shrimp with garlic", "Add peppers, rice, soy sauce", "Mix in eggs and serve"] },
  { name: "Spinach Strawberry Salad", time: "10 min", icon: "🥗", servings: 2, difficulty: "Easy", calories: 180, ingredients: ["Baby Spinach", "Strawberries", "Lemons"], steps: ["Wash and dry spinach", "Slice strawberries", "Make lemon vinaigrette", "Toss and serve"] },
  { name: "BLT Sandwich", time: "10 min", icon: "🥪", servings: 2, difficulty: "Easy", calories: 420, ingredients: ["Bacon", "Sourdough Bread", "Tomatoes"], steps: ["Cook bacon until crispy", "Toast sourdough bread", "Layer bacon, lettuce, and sliced tomatoes", "Add mayo and serve"] },
  { name: "Avocado Toast", time: "5 min", icon: "🥑", servings: 2, difficulty: "Easy", calories: 290, ingredients: ["Avocados", "Sourdough Bread", "Lemons"], steps: ["Toast sourdough bread", "Mash avocado with lemon juice and salt", "Spread on toast, add toppings"] },
  { name: "Breakfast Croissant", time: "10 min", icon: "🥐", servings: 2, difficulty: "Easy", calories: 480, ingredients: ["Croissants", "Cheddar Cheese", "Bacon", "Eggs"], steps: ["Cook bacon and scramble eggs", "Slice croissants in half", "Layer cheese, bacon, eggs", "Toast until cheese melts"] },
  { name: "Yogurt Parfait", time: "5 min", icon: "🫐", servings: 2, difficulty: "Easy", calories: 220, ingredients: ["Greek Yogurt", "Strawberries", "Bananas"], steps: ["Slice strawberries and bananas", "Layer yogurt and fruit in glasses", "Top with granola if desired"] },
  { name: "Broccoli Cheddar Soup", time: "30 min", icon: "🥦", servings: 4, difficulty: "Medium", calories: 320, ingredients: ["Broccoli", "Cheddar Cheese", "Heavy Cream", "Onions", "Butter"], steps: ["Sauté onions in butter", "Add broccoli and broth, simmer until tender", "Blend until smooth", "Stir in cream and cheddar cheese", "Season and serve"] },
  { name: "Turkey Club Wrap", time: "10 min", icon: "🌯", servings: 2, difficulty: "Easy", calories: 380, ingredients: ["Turkey Slices", "Tortillas", "Tomatoes", "Avocados"], steps: ["Lay out tortillas", "Layer turkey, sliced tomatoes, avocado", "Roll tightly and slice in half"] },
  { name: "Garlic Butter Shrimp", time: "15 min", icon: "🧈", servings: 2, difficulty: "Easy", calories: 290, ingredients: ["Shrimp", "Garlic", "Butter", "Lemons"], steps: ["Melt butter, sauté minced garlic", "Add shrimp, cook until pink", "Squeeze lemon juice over top", "Serve immediately"] },
  { name: "Veggie Stir-Fry", time: "20 min", icon: "🥘", servings: 3, difficulty: "Easy", calories: 260, ingredients: ["Bell Peppers", "Broccoli", "Carrots", "Soy Sauce", "Rice", "Garlic"], steps: ["Cook rice", "Slice all vegetables", "Stir-fry with garlic and soy sauce", "Serve over rice"] },
  { name: "Pork Chop & Apples", time: "25 min", icon: "🍖", servings: 2, difficulty: "Medium", calories: 480, ingredients: ["Pork Chops", "Butter", "Onions"], steps: ["Season and sear pork chops", "Sauté sliced onions in butter", "Add to pan with pork", "Cook until caramelized and pork is done"] },
  { name: "Caprese Salad", time: "5 min", icon: "🍅", servings: 2, difficulty: "Easy", calories: 280, ingredients: ["Tomatoes", "Olive Oil"], steps: ["Slice tomatoes", "Drizzle with olive oil, salt, pepper", "Add fresh basil if available"] },
  { name: "Egg Fried Rice", time: "15 min", icon: "🍳", servings: 3, difficulty: "Easy", calories: 380, ingredients: ["Rice", "Eggs", "Soy Sauce", "Garlic", "Carrots"], steps: ["Cook rice and cool", "Scramble eggs, set aside", "Sauté garlic and diced carrots", "Add rice and soy sauce, stir-fry", "Mix in eggs and serve"] },
  { name: "Hummus & Veggie Wrap", time: "5 min", icon: "🌯", servings: 2, difficulty: "Easy", calories: 310, ingredients: ["Hummus", "Tortillas", "Bell Peppers", "Carrots", "Baby Spinach"], steps: ["Spread hummus on tortillas", "Add sliced peppers, shredded carrots, spinach", "Roll tightly and slice"] },
];

const HOUSEHOLD_MEMBERS = [
  { id: "me", name: "You", avatar: "😊", role: "Admin" },
  { id: "partner", name: "Alex", avatar: "🧑", role: "Member" },
  { id: "kid", name: "Jamie", avatar: "👦", role: "Member" },
];

/* ───────────────────────── HELPERS ───────────────────────── */
function getDaysLeft(purchaseDate, shelfLife, storage) {
  const days = shelfLife[storage] || shelfLife.fridge || 7;
  const now = new Date();
  const purchased = new Date(purchaseDate);
  const expiry = new Date(purchased.getTime() + days * 86400000);
  return Math.ceil((expiry - now) / 86400000);
}

function getMaxShelfDays(shelfLife, storage) {
  return shelfLife[storage] || shelfLife.fridge || 7;
}

function getStatus(daysLeft, maxDays) {
  if (daysLeft <= 0) return "expired";
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= Math.max(3, Math.ceil(maxDays * 0.2))) return "warning";
  return "fresh";
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysAgo(d) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

function generateMeals(items) {
  const names = items.map(i => i.name);
  return RECIPES.filter(r =>
    r.ingredients.filter(ing => names.includes(ing)).length >= Math.min(3, r.ingredients.length)
  ).map(r => {
    const matched = r.ingredients.filter(ing => names.includes(ing));
    const missing = r.ingredients.filter(ing => !names.includes(ing));
    const matchedItems = items.filter(i => matched.includes(i.name));
    const urgency = matchedItems.length ? Math.min(...matchedItems.map(i => getDaysLeft(i.purchaseDate, i.shelfLife, i.storage))) : 99;
    return { ...r, matched, missing, urgency, matchPct: Math.round((matched.length / r.ingredients.length) * 100) };
  }).sort((a, b) => a.urgency - b.urgency);
}

const STATUS_CONFIG = {
  fresh: { label: "Fresh", color: "#16A34A", bg: "#DCFCE7", ring: "#BBF7D0" },
  warning: { label: "Use Soon", color: "#D97706", bg: "#FEF3C7", ring: "#FDE68A" },
  critical: { label: "Expiring!", color: "#DC2626", bg: "#FEE2E2", ring: "#FECACA" },
  expired: { label: "Expired", color: "#991B1B", bg: "#FEE2E2", ring: "#FECACA" },
};

/* ───────────────────────── MAIN APP ───────────────────────── */
export default function FreshTrack() {
  const [screen, setScreen] = useState("onboarding");
  const [onboardStep, setOnboardStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [stores, setStores] = useState(GROCERY_STORES);
  const [items, setItems] = useState([]);
  const [view, setView] = useState("dashboard");
  const [syncing, setSyncing] = useState(false);
  const [syncStore, setSyncStore] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [repurchaseList, setRepurchaseList] = useState([]);
  const [toast, setToast] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptScanning, setReceiptScanning] = useState(false);
  const [notifications, setNotifications] = useState({ expiring: true, meals: true, restock: false, weekly: true });
  const [showSettings, setShowSettings] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [householdMembers, setHouseholdMembers] = useState(HOUSEHOLD_MEMBERS);
  const [wasteStats, setWasteStats] = useState({ saved: 23, wasted: 4, money: 18.50 });
  const [mealFilter, setMealFilter] = useState("all");

  const [apiMeals, setApiMeals] = useState([]);

  const fetchMeals = async () => {
    const ingredientNames = items.map(item => item.name.toLowerCase())

    if (ingredientNames.length === 0) return

    try {
      const recipes = await findRecipes(ingredientNames)

      const mealResults = recipes.map(recipe => ({
        name: recipe.title,
        icon: "🍽️",
        image: recipe.image,
        time: "30 min",
        calories: 0,
        difficulty: "Easy",
        servings: recipe.servings || 4,
        matchPct: Math.round(
          (recipe.usedIngredientCount /
            (recipe.usedIngredientCount + recipe.missedIngredientCount)) *
            100
        ),
        matched: recipe.usedIngredients.map(i => i.name),
        missing: recipe.missedIngredients.map(i => i.name),
        urgency: 5,
        steps: ["Tap for full recipe on Spoonacular"],
        recipeId: recipe.id,
      }))

      setApiMeals(mealResults)
    } catch (error) {
      console.log("Recipe fetch failed:", error)
    }
  }

  useEffect(() => {
    if (items.length > 0) {
      fetchMeals()
    }
  }, [items.length])

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const connectStore = (storeId) => {
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, connected: !s.connected } : s));
    const store = stores.find(s => s.id === storeId);
    showToast(store.connected ? `${store.name} disconnected` : `${store.name} connected!`);
  };

  const simulateSync = (storeId) => {
    setSyncing(true);
    setSyncStore(storeId);
    setTimeout(() => {
      const picks = [];
      const indices = [0,1,2,5,6,7,8,9,10,11,12,14,16,17,18,19,21,23,24,27,29,30,32,33,39,40];
      const shuffled = indices.sort(() => Math.random() - 0.5).slice(0, 14 + Math.floor(Math.random() * 6));
      shuffled.forEach(idx => {
        const db = FOOD_DB[idx];
        if (db && !items.find(i => i.name === db.name)) {
          picks.push({
            ...db, purchaseDate: daysAgo(Math.floor(Math.random() * 5)),
            qty: 1 + Math.floor(Math.random() * 2),
            storage: db.defaultStorage,
            id: crypto.randomUUID(),
            addedBy: "me",
            userAdjusted: false,
          });
        }
      });
      setItems(prev => [...prev, ...picks]);
      setSyncing(false);
      setSyncStore(null);
      showToast(`${picks.length} items synced from ${stores.find(s => s.id === storeId)?.name || "store"}`);
    }, 2400);
  };

  const simulateReceiptScan = () => {
    setReceiptScanning(true);
    setTimeout(() => {
      const receiptItems = [0,7,10,17,23,27,32].filter(idx => !items.find(i => i.name === FOOD_DB[idx].name));
      const newItems = receiptItems.map(idx => ({
        ...FOOD_DB[idx], purchaseDate: new Date().toISOString(),
        qty: 1, storage: FOOD_DB[idx].defaultStorage,
        id: crypto.randomUUID(), addedBy: "me", userAdjusted: false,
      }));
      setItems(prev => [...prev, ...newItems]);
      setReceiptScanning(false);
      setShowReceipt(false);
      showToast(`${newItems.length} items scanned from receipt`);
    }, 2800);
  };

  const addItem = (dbItem) => {
    const newItem = {
      ...dbItem, purchaseDate: new Date().toISOString(),
      qty: 1, storage: dbItem.defaultStorage,
      id: crypto.randomUUID(), addedBy: "me", userAdjusted: false,
    };
    setItems(prev => [...prev, newItem]);
    setShowAddModal(false);
    setAddSearch("");
    showToast(`${dbItem.name} added`);
  };

  const removeItem = (id) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const dl = getDaysLeft(item.purchaseDate, item.shelfLife, item.storage);
      if (dl > 0) setWasteStats(prev => ({ ...prev, saved: prev.saved + 1 }));
      else setWasteStats(prev => ({ ...prev, wasted: prev.wasted + 1, money: prev.money + item.price }));
    }
    setItems(prev => prev.filter(i => i.id !== id));
    setDetailItem(null);
    if (item) showToast(`${item.name} removed`);
  };

  const changeStorage = (id, newStorage) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, storage: newStorage, userAdjusted: true } : i));
    showToast(`Storage updated`);
  };

  const addToRepurchase = (item) => {
    if (!repurchaseList.find(r => r.name === item.name)) {
      setRepurchaseList(prev => [...prev, item]);
      showToast(`${item.name} → restock list`);
    }
  };

  const repurchaseItem = (rItem) => {
    const dbItem = FOOD_DB.find(d => d.name === rItem.name);
    if (dbItem) {
      addItem(dbItem);
      setRepurchaseList(prev => prev.filter(r => r.name !== rItem.name));
    }
  };

  const filtered = useMemo(() => items
    .filter(i => filter === "all" || i.category === filter)
    .filter(i => !searchTerm || i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => getDaysLeft(a.purchaseDate, a.shelfLife, a.storage) - getDaysLeft(b.purchaseDate, b.shelfLife, b.storage)),
  [items, filter, searchTerm]);

  const stats = useMemo(() => ({
    total: items.length,
    fresh: items.filter(i => getStatus(getDaysLeft(i.purchaseDate, i.shelfLife, i.storage), getMaxShelfDays(i.shelfLife, i.storage)) === "fresh").length,
    warning: items.filter(i => ["warning","critical"].includes(getStatus(getDaysLeft(i.purchaseDate, i.shelfLife, i.storage), getMaxShelfDays(i.shelfLife, i.storage)))).length,
    expired: items.filter(i => getStatus(getDaysLeft(i.purchaseDate, i.shelfLife, i.storage), getMaxShelfDays(i.shelfLife, i.storage)) === "expired").length,
  }), [items]);

  const meals = useMemo(() => {
    const all = generateMeals(items);
    if (mealFilter === "all") return all;
    if (mealFilter === "quick") return all.filter(m => parseInt(m.time) <= 15);
    if (mealFilter === "complete") return all.filter(m => m.missing.length === 0);
    if (mealFilter === "urgent") return all.filter(m => m.urgency <= 3);
    return all;
  }, [items, mealFilter]);

  const categories = [...new Set(items.map(i => i.category))];
  const addResults = FOOD_DB.filter(d => addSearch && d.name.toLowerCase().includes(addSearch.toLowerCase()) && !items.find(i => i.name === d.name)).slice(0, 8);
  const connectedStores = stores.filter(s => s.connected);
  const expiringToday = items.filter(i => getDaysLeft(i.purchaseDate, i.shelfLife, i.storage) <= 1 && getDaysLeft(i.purchaseDate, i.shelfLife, i.storage) >= 0);

  /* ── STYLES ── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 0; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes popIn { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes toastIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes scan { 0%,100% { top: 10%; } 50% { top: 85%; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .card { transition: all 0.2s ease; background: #fff; border-radius: 16px; border: 1px solid #E7E5E4; }
    .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.05); }
    .btn { transition: all 0.15s ease; cursor: pointer; font-family: inherit; border: none; }
    .btn:hover { transform: scale(1.02); }
    .btn:active { transform: scale(0.97); }
    input, select { font-family: inherit; }
  `;

  const F = "'DM Sans', system-ui, sans-serif";
  const H = "'Fraunces', serif";
  const G = "#1B4332";
  const GL = "#2D6A4F";

  /* ── ONBOARDING ── */
  if (screen === "onboarding") {
    const steps = [
      { title: "Welcome to\nFresh Track", sub: "Your smart pantry companion.\nTrack groceries, reduce waste, eat better.", emoji: "🌿", action: "Get Started" },
      { title: "What's your name?", sub: "We'll personalize your experience.", emoji: "👋", input: true, action: "Continue" },
      { title: "Connect a Store", sub: "Link your grocery store accounts to auto-import purchases.", emoji: "🛒", stores: true, action: "Continue" },
      { title: "Stay Notified", sub: "We'll alert you before food expires and suggest meals.", emoji: "🔔", notifs: true, action: "Let's Go!" },
    ];
    const step = steps[onboardStep];
    return (
      <div style={{ fontFamily: F, background: "#FAFAF8", minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <style>{css}</style>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 28px", animation: "fadeUp 0.5s ease both" }}>
          <div style={{ fontSize: 64, textAlign: "center", marginBottom: 24, animation: "float 3s ease-in-out infinite" }}>{step.emoji}</div>
          <h1 style={{ fontFamily: H, color: G, fontSize: 28, textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.2, marginBottom: 12 }}>{step.title}</h1>
          <p style={{ color: "#78716C", fontSize: 15, textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line", marginBottom: 32 }}>{step.sub}</p>

          {step.input && (
            <input autoFocus value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your first name"
              style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: "1px solid #D6D3D1", fontSize: 16, textAlign: "center", outline: "none", marginBottom: 16, background: "#fff" }} />
          )}

          {step.stores && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {stores.slice(0, 4).map(s => (
                <button key={s.id} onClick={() => connectStore(s.id)} className="btn" style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  background: s.connected ? "#F0FDF4" : "#fff", borderRadius: 14,
                  border: `1.5px solid ${s.connected ? "#86EFAC" : "#E7E5E4"}`,
                }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#292524" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "#78716C" }}>{s.desc}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${s.connected ? "#16A34A" : "#D6D3D1"}`, background: s.connected ? "#16A34A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                    {s.connected && "✓"}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step.notifs && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { key: "expiring", label: "Expiration alerts", desc: "When items are 1-2 days from expiring", icon: "⏰" },
                { key: "meals", label: "Meal suggestions", desc: "Daily recipe ideas using your ingredients", icon: "🍽️" },
                { key: "weekly", label: "Weekly summary", desc: "Food waste report & savings tracker", icon: "📊" },
              ].map(n => (
                <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", borderRadius: 14, border: "1px solid #E7E5E4" }}>
                  <span style={{ fontSize: 20 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#292524" }}>{n.label}</div>
                    <div style={{ fontSize: 11, color: "#78716C" }}>{n.desc}</div>
                  </div>
                  <button onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key] }))} className="btn" style={{
                    width: 44, height: 26, borderRadius: 13, padding: 2,
                    background: notifications[n.key] ? "#16A34A" : "#D6D3D1",
                  }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", transform: notifications[n.key] ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s ease" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => {
            if (onboardStep < steps.length - 1) setOnboardStep(onboardStep + 1);
            else setScreen("app");
          }} className="btn" disabled={step.input && !userName} style={{
            width: "100%", padding: "16px", borderRadius: 16, fontSize: 16, fontWeight: 600, color: "#fff",
            background: (step.input && !userName) ? "#A8A29E" : `linear-gradient(135deg, ${G}, ${GL})`,
            boxShadow: `0 4px 16px rgba(27,67,50,0.2)`,
          }}>{step.action}</button>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20 }}>
            {steps.map((_, i) => (
              <div key={i} style={{ width: i === onboardStep ? 20 : 6, height: 6, borderRadius: 3, background: i <= onboardStep ? G : "#D6D3D1", transition: "all 0.3s ease" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN APP ── */
  return (
    <div style={{ fontFamily: F, background: "#FAFAF8", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <style>{css}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: `linear-gradient(145deg, ${G} 0%, ${GL} 60%, #40916C 100%)`,
        padding: "18px 20px 22px", borderRadius: "0 0 24px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: items.length > 0 ? 14 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #4ADE80, #22C55E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🌿</div>
            <div>
              <h1 style={{ fontFamily: H, color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>Fresh Track</h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 1 }}>{userName ? `${userName}'s pantry` : "Smart pantry companion"}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowReceipt(true)} className="btn" style={{ background: "rgba(255,255,255,0.1)", borderRadius: 9, padding: "7px 10px", color: "#fff", fontSize: 14 }} title="Scan Receipt">📷</button>
            <button onClick={() => { setShowAddModal(true); setAddSearch(""); }} className="btn" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 9, padding: "7px 12px", color: "#fff", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 15 }}>+</span> Add
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {expiringToday.length > 0 && (
          <div style={{ background: "rgba(239,68,68,0.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 500 }}>{expiringToday.length} item{expiringToday.length > 1 ? "s" : ""} expiring today — check Meals for ideas!</span>
          </div>
        )}

        {/* Stats Row */}
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {[
              { label: "Total", val: stats.total, color: "#E2E8F0" },
              { label: "Fresh", val: stats.fresh, color: "#4ADE80" },
              { label: "Use Soon", val: stats.warning, color: "#FBBF24" },
              { label: "Expired", val: stats.expired, color: "#F87171" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)", animation: `fadeUp 0.4s ease ${i*0.06}s both` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NAV ── */}
      <div style={{ display: "flex", gap: 3, padding: "12px 20px 4px" }}>
        {[
          { id: "dashboard", label: "Pantry", icon: "📦" },
          { id: "meals", label: "Meals", icon: "🍽️" },
          { id: "restock", label: "Restock", icon: "🔄" },
          { id: "insights", label: "Insights", icon: "📊" },
          { id: "settings", label: "More", icon: "⚙️" },
        ].map(n => (
          <button key={n.id} onClick={() => setView(n.id)} className="btn" style={{
            flex: 1, padding: "9px 2px", borderRadius: 10,
            background: view === n.id ? G : "transparent",
            color: view === n.id ? "#fff" : "#78716C",
            fontSize: 11, fontWeight: view === n.id ? 600 : 500,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "8px 20px 100px", minHeight: 400 }}>

        {/* ════ DASHBOARD ════ */}
        {view === "dashboard" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", animation: "fadeUp 0.5s ease" }}>
                <div style={{ fontSize: 52, marginBottom: 14, animation: "float 3s ease-in-out infinite" }}>🛒</div>
                <h2 style={{ fontFamily: H, color: G, fontSize: 22, marginBottom: 6 }}>Your pantry is empty</h2>
                <p style={{ color: "#78716C", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Sync a store, scan a receipt, or add items manually.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {connectedStores.length > 0 ? connectedStores.map(s => (
                    <button key={s.id} onClick={() => simulateSync(s.id)} disabled={syncing} className="btn" style={{
                      width: "100%", padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#fff",
                      background: `linear-gradient(135deg, ${G}, ${GL})`, boxShadow: `0 4px 14px rgba(27,67,50,0.2)`,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      {syncing && syncStore === s.id ? <><span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Syncing...</> : <>{s.icon} Sync {s.name}</>}
                    </button>
                  )) : (
                    <button onClick={() => { setView("settings"); setShowConnections(true); }} className="btn" style={{
                      width: "100%", padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#fff",
                      background: `linear-gradient(135deg, ${G}, ${GL})`, boxShadow: `0 4px 14px rgba(27,67,50,0.2)`,
                    }}>Connect a Store</button>
                  )}
                  <button onClick={() => setShowReceipt(true)} className="btn" style={{
                    width: "100%", padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 500,
                    color: G, background: "#fff", border: `1.5px solid ${G}`,
                  }}>📷 Scan Receipt</button>
                </div>
              </div>
            ) : (
              <>
                {/* Search + Filter */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 11, padding: "0 12px", border: "1px solid #E7E5E4", height: 38 }}>
                    <span style={{ color: "#A8A29E", fontSize: 13 }}>🔍</span>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search items..." style={{ border: "none", outline: "none", fontSize: 13, color: "#292524", width: "100%", background: "transparent" }} />
                  </div>
                  <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: "#fff", border: "1px solid #E7E5E4", borderRadius: 11, padding: "0 26px 0 10px", height: 38, fontSize: 12, color: "#44403C", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2378716C' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                    <option value="all">All</option>
                    {categories.map(c => <option key={c} value={c}>{CATEGORIES[c]?.icon} {CATEGORIES[c]?.label || c}</option>)}
                  </select>
                </div>

                {/* Sync Strip */}
                {connectedStores.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
                    {connectedStores.map(s => (
                      <button key={s.id} onClick={() => simulateSync(s.id)} disabled={syncing} className="btn" style={{
                        padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 500,
                        background: "#fff", border: "1px solid #E7E5E4", color: "#44403C",
                        display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                      }}>
                        {syncing && syncStore === s.id ? <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #D6D3D1", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : s.icon}
                        {syncing && syncStore === s.id ? "Syncing..." : `Sync ${s.name}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Item Cards */}
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#A8A29E" }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
                    <p style={{ fontSize: 13 }}>No items found</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filtered.map((item, idx) => {
                      const dl = getDaysLeft(item.purchaseDate, item.shelfLife, item.storage);
                      const max = getMaxShelfDays(item.shelfLife, item.storage);
                      const status = getStatus(dl, max);
                      const sc = STATUS_CONFIG[status];
                      const cat = CATEGORIES[item.category] || { icon: "📦", bg: "#F5F5F4" };
                      const pct = Math.max(0, Math.min(100, (dl / max) * 100));
                      return (
                        <div key={item.id} className="card" onClick={() => setDetailItem(item)} style={{
                          padding: "12px 14px", cursor: "pointer", position: "relative", overflow: "hidden",
                          borderColor: status === "critical" || status === "expired" ? sc.ring : undefined,
                          animation: `fadeUp 0.3s ease ${idx*0.03}s both`,
                        }}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#F5F5F4" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: sc.color, borderRadius: 3, transition: "width 0.5s" }} />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#292524", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                                <span style={{ fontSize: 9, fontWeight: 600, color: sc.color, background: sc.bg, padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.3 }}>{sc.label}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: "#78716C" }}>
                                  {dl <= 0 ? "Expired" : `${dl}d left`} · {STORAGE_METHODS[item.storage]?.icon} {STORAGE_METHODS[item.storage]?.label}
                                </span>
                                <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                                  <button onClick={() => addToRepurchase(item)} className="btn" style={{ background: "none", fontSize: 13, padding: 3, borderRadius: 5, lineHeight: 1 }} title="Restock">🔄</button>
                                  <button onClick={() => removeItem(item.id)} className="btn" style={{ background: "none", fontSize: 13, padding: 3, borderRadius: 5, lineHeight: 1, color: "#A8A29E" }} title="Remove">✕</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════ MEALS ════ */}
        {view === "meals" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontFamily: H, color: G, fontSize: 20, marginBottom: 4 }}>Meal Suggestions</h2>
              <p style={{ color: "#78716C", fontSize: 12 }}>{[...meals, ...apiMeals].length} recipes from your ingredients, prioritized by expiration</p>
            </div>
            {/* Meal Filters */}
            <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto" }}>
              {[
                { id: "all", label: "All" },
                { id: "urgent", label: "🔥 Use Now" },
                { id: "quick", label: "⚡ Under 15 min" },
                { id: "complete", label: "✅ All Ingredients" },
              ].map(f => (
                <button key={f.id} onClick={() => setMealFilter(f.id)} className="btn" style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
                  background: mealFilter === f.id ? G : "#fff", color: mealFilter === f.id ? "#fff" : "#44403C",
                  border: `1px solid ${mealFilter === f.id ? G : "#E7E5E4"}`,
                }}>{f.label}</button>
              ))}
            </div>
            {[...meals, ...apiMeals].length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#A8A29E" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🍳</div>
                <p style={{ fontSize: 13, marginBottom: 4 }}>No recipes match your current pantry</p>
                <p style={{ fontSize: 11 }}>Add more items to unlock meal ideas</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...meals, ...apiMeals].map((meal, idx) => (
                  <div key={idx} className="card" style={{ padding: 14, cursor: "pointer", animation: `fadeUp 0.3s ease ${idx*0.05}s both` }} onClick={() => setSelectedMeal(selectedMeal === idx ? null : idx)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: meal.urgency <= 2 ? "#FEF2F2" : meal.urgency <= 4 ? "#FEF3C7" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{meal.icon}</div>
                      {meal.image && (
                        <img
                          src={meal.image}
                          alt={meal.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 11,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#292524" }}>{meal.name}</div>
                        <div style={{ fontSize: 11, color: "#78716C", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>⏱ {meal.time}</span>
                          <span>·</span>
                          <span>{meal.calories} cal</span>
                          <span>·</span>
                          <span>{meal.difficulty}</span>
                          {meal.urgency <= 2 && <span style={{ color: "#DC2626", fontWeight: 600, fontSize: 10, background: "#FEE2E2", padding: "1px 6px", borderRadius: 4 }}>Use today!</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: meal.matchPct === 100 ? "#16A34A" : "#D97706" }}>{meal.matchPct}%</div>
                        <div style={{ fontSize: 9, color: "#A8A29E" }}>match</div>
                      </div>
                    </div>
                    {selectedMeal === idx && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F5F5F4", animation: "popIn 0.2s ease both" }}>
                        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: "#78716C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>You Have</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {meal.matched.map(ing => <span key={ing} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#F0FDF4", color: "#166534", fontWeight: 500 }}>{ing} ✓</span>)}
                            </div>
                          </div>
                          {meal.missing.length > 0 && (
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 10, fontWeight: 600, color: "#78716C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Need</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {meal.missing.map(ing => <span key={ing} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#FEF3C7", color: "#92400E", fontWeight: 500 }}>{ing}</span>)}
                              </div>
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: "#78716C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Steps</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {meal.steps.map((step, si) => (
                            <div key={si} style={{ display: "flex", gap: 8, fontSize: 12, color: "#44403C", lineHeight: 1.5 }}>
                              <span style={{ width: 20, height: 20, borderRadius: 6, background: "#F0FDF4", color: G, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{si+1}</span>
                              {step}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "#F5F5F4" }}>
                          <span style={{ fontSize: 14 }}>👥</span>
                          <span style={{ fontSize: 12, color: "#44403C" }}>Serves {meal.servings}</span>
                          <span style={{ margin: "0 4px", color: "#D6D3D1" }}>|</span>
                          <span style={{ fontSize: 12, color: "#44403C" }}>{meal.calories} cal/serving</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ RESTOCK ════ */}
        {view === "restock" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontFamily: H, color: G, fontSize: 20, marginBottom: 4 }}>Restock List</h2>
              <p style={{ color: "#78716C", fontSize: 12 }}>Items to buy on your next trip</p>
            </div>
            {/* Auto-suggest expired items */}
            {items.filter(i => getStatus(getDaysLeft(i.purchaseDate, i.shelfLife, i.storage), getMaxShelfDays(i.shelfLife, i.storage)) === "expired" && !repurchaseList.find(r => r.name === i.name)).length > 0 && (
              <div className="card" style={{ padding: 12, marginBottom: 10, background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#92400E", marginBottom: 6 }}>⚠️ Expired items — add to restock?</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {items.filter(i => getStatus(getDaysLeft(i.purchaseDate, i.shelfLife, i.storage), getMaxShelfDays(i.shelfLife, i.storage)) === "expired" && !repurchaseList.find(r => r.name === i.name)).map(i => (
                    <button key={i.id} onClick={() => addToRepurchase(i)} className="btn" style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, background: "#fff", border: "1px solid #FDE68A", color: "#92400E", fontWeight: 500 }}>+ {i.name}</button>
                  ))}
                </div>
              </div>
            )}
            {repurchaseList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#A8A29E" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🔄</div>
                <p style={{ fontSize: 13, marginBottom: 4 }}>Restock list is empty</p>
                <p style={{ fontSize: 11 }}>Tap 🔄 on pantry items or add expired items above</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {repurchaseList.map((item, idx) => {
                    const cat = CATEGORIES[item.category] || { icon: "📦", bg: "#F5F5F4" };
                    return (
                      <div key={idx} className="card" style={{ padding: "12px 14px", animation: `slideIn 0.3s ease ${idx*0.04}s both` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{cat.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#292524" }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: "#78716C" }}>${item.price.toFixed(2)} / {item.unit}</div>
                          </div>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => repurchaseItem(item)} className="btn" style={{ background: G, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600 }}>Buy</button>
                            <button onClick={() => setRepurchaseList(p => p.filter(r => r.name !== item.name))} className="btn" style={{ background: "#F5F5F4", color: "#78716C", borderRadius: 8, padding: "6px 8px", fontSize: 13 }}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, padding: "12px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>Est. total: ${repurchaseList.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
                  <span style={{ fontSize: 11, color: "#16A34A", marginLeft: 8 }}>· {repurchaseList.length} items</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ INSIGHTS ════ */}
        {view === "insights" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontFamily: H, color: G, fontSize: 20, marginBottom: 4 }}>Insights</h2>
              <p style={{ color: "#78716C", fontSize: 12 }}>Your food waste & savings tracker</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Items Saved", val: wasteStats.saved, icon: "✅", color: "#16A34A", bg: "#F0FDF4" },
                { label: "Items Wasted", val: wasteStats.wasted, icon: "🗑️", color: "#DC2626", bg: "#FEF2F2" },
                { label: "Money Saved", val: `$${(wasteStats.saved * 4.5).toFixed(0)}`, icon: "💰", color: "#16A34A", bg: "#F0FDF4" },
                { label: "Money Lost", val: `$${wasteStats.money.toFixed(0)}`, icon: "📉", color: "#DC2626", bg: "#FEF2F2" },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 14, textAlign: "center", background: s.bg, borderColor: "transparent", animation: `fadeUp 0.3s ease ${i*0.08}s both` }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 16, marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#292524", marginBottom: 10 }}>Waste Score</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#E7E5E4" strokeWidth="5" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#16A34A" strokeWidth="5" strokeDasharray={`${(wasteStats.saved / (wasteStats.saved + wasteStats.wasted)) * 176} 176`} strokeLinecap="round" transform="rotate(-90 32 32)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: G }}>{Math.round((wasteStats.saved / (wasteStats.saved + wasteStats.wasted)) * 100)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#292524" }}>Great job! 🎉</div>
                  <div style={{ fontSize: 12, color: "#78716C", lineHeight: 1.5 }}>You've used {wasteStats.saved} of {wasteStats.saved + wasteStats.wasted} items before expiry. That's above average!</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#292524", marginBottom: 8 }}>Top Wasted Categories</h3>
              {["Produce", "Dairy", "Bakery"].map((c, i) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#78716C", width: 60 }}>{c}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#F5F5F4" }}>
                    <div style={{ height: "100%", borderRadius: 4, background: i === 0 ? "#F87171" : i === 1 ? "#FBBF24" : "#FB923C", width: `${[65, 40, 25][i]}%`, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#78716C", width: 30, textAlign: "right" }}>{[65, 40, 25][i]}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {view === "settings" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontFamily: H, color: G, fontSize: 20, marginBottom: 4 }}>Settings</h2>
            </div>

            {/* Profile */}
            <div className="card" style={{ padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>😊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#292524" }}>{userName || "User"}</div>
                  <div style={{ fontSize: 12, color: "#78716C" }}>Admin · Free Plan</div>
                </div>
              </div>
            </div>

            {/* Connected Stores */}
            <div className="card" style={{ padding: 14, marginBottom: 8 }}>
              <div onClick={() => setShowConnections(!showConnections)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🏪</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#292524" }}>Connected Stores</div>
                    <div style={{ fontSize: 11, color: "#78716C" }}>{connectedStores.length} connected</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#A8A29E", transform: showConnections ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>
              {showConnections && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, animation: "popIn 0.2s ease" }}>
                  {stores.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "#FAFAF8" }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#292524" }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: "#78716C" }}>{s.desc}</div>
                      </div>
                      <button onClick={() => connectStore(s.id)} className="btn" style={{
                        padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                        background: s.connected ? "#FEE2E2" : "#F0FDF4",
                        color: s.connected ? "#DC2626" : "#16A34A",
                      }}>{s.connected ? "Disconnect" : "Connect"}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Household */}
            <div className="card" style={{ padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>👨‍👩‍👦</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#292524" }}>Household</div>
                  <div style={{ fontSize: 11, color: "#78716C" }}>{householdMembers.length} members sharing this pantry</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {householdMembers.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "#FAFAF8", border: "1px solid #E7E5E4" }}>
                    <span style={{ fontSize: 16 }}>{m.avatar}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#292524" }}>{m.name}</div>
                      <div style={{ fontSize: 9, color: "#78716C" }}>{m.role}</div>
                    </div>
                  </div>
                ))}
                <button className="btn" style={{ padding: "6px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px dashed #86EFAC", color: "#16A34A", fontSize: 12, fontWeight: 500 }}>+ Invite</button>
              </div>
            </div>

            {/* Notifications */}
            <div className="card" style={{ padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#292524" }}>Notifications</div>
              </div>
              {[
                { key: "expiring", label: "Expiration alerts", desc: "1-2 days before items expire" },
                { key: "meals", label: "Daily meal ideas", desc: "Recipes using expiring items" },
                { key: "restock", label: "Restock reminders", desc: "When staples run low" },
                { key: "weekly", label: "Weekly report", desc: "Waste score & savings summary" },
              ].map(n => (
                <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F4" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#292524" }}>{n.label}</div>
                    <div style={{ fontSize: 10, color: "#78716C" }}>{n.desc}</div>
                  </div>
                  <button onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key] }))} className="btn" style={{
                    width: 40, height: 22, borderRadius: 11, padding: 2,
                    background: notifications[n.key] ? "#16A34A" : "#D6D3D1",
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", transform: notifications[n.key] ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ITEM DETAIL MODAL ── */}
      {detailItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setDetailItem(null)}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 20px 32px", width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "auto", animation: "slideUp 0.3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D6D3D1", margin: "0 auto 14px" }} />
            {(() => {
              const dl = getDaysLeft(detailItem.purchaseDate, detailItem.shelfLife, detailItem.storage);
              const max = getMaxShelfDays(detailItem.shelfLife, detailItem.storage);
              const status = getStatus(dl, max);
              const sc = STATUS_CONFIG[status];
              const cat = CATEGORIES[detailItem.category] || { icon: "📦", bg: "#F5F5F4", label: "Other" };
              const pct = Math.max(0, Math.min(100, (dl / max) * 100));
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: H, fontSize: 20, color: "#292524" }}>{detailItem.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, padding: "2px 8px", borderRadius: 10 }}>{sc.label}</span>
                        <span style={{ fontSize: 11, color: "#78716C" }}>{dl <= 0 ? "Expired" : `${dl} days left`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Freshness bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#78716C" }}>Freshness</span>
                      <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{Math.round(pct)}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "#F5F5F4" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}88)`, borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Purchased", val: fmtDate(detailItem.purchaseDate) },
                      { label: "Expires ~", val: (() => { const d = new Date(detailItem.purchaseDate); d.setDate(d.getDate() + max); return fmtDate(d); })() },
                      { label: "Category", val: cat.label },
                      { label: "Price", val: `$${detailItem.price.toFixed(2)}` },
                      { label: "Calories", val: `${detailItem.calories} / serving` },
                      { label: "Protein", val: `${detailItem.protein}g` },
                    ].map((d, i) => (
                      <div key={i} style={{ padding: "8px 10px", borderRadius: 10, background: "#FAFAF8" }}>
                        <div style={{ fontSize: 9, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{d.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#292524" }}>{d.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Nutrients */}
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "#F0FDF4", marginBottom: 16, border: "1px solid #BBF7D0" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#166534", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Key Nutrients</div>
                    <div style={{ fontSize: 12, color: "#166534" }}>{detailItem.nutrients}</div>
                  </div>

                  {/* Storage switcher */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#78716C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Storage Method</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                      {Object.entries(STORAGE_METHODS).map(([key, m]) => {
                        const avail = detailItem.shelfLife[key] > 0;
                        const active = detailItem.storage === key;
                        return (
                          <button key={key} onClick={() => avail && changeStorage(detailItem.id, key)} className="btn" disabled={!avail} style={{
                            padding: "10px 4px", borderRadius: 10, textAlign: "center",
                            background: active ? G : avail ? "#fff" : "#F5F5F4",
                            color: active ? "#fff" : avail ? "#44403C" : "#A8A29E",
                            border: `1.5px solid ${active ? G : avail ? "#E7E5E4" : "#E7E5E4"}`,
                            opacity: avail ? 1 : 0.5,
                          }}>
                            <div style={{ fontSize: 16, marginBottom: 2 }}>{m.icon}</div>
                            <div style={{ fontSize: 10, fontWeight: 600 }}>{m.label}</div>
                            {avail && <div style={{ fontSize: 9, marginTop: 2, opacity: 0.7 }}>{detailItem.shelfLife[key]}d</div>}
                          </button>
                        );
                      })}
                    </div>
                    {detailItem.userAdjusted && <p style={{ fontSize: 10, color: "#78716C", marginTop: 4 }}>✓ You adjusted this — we'll remember for next time</p>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { addToRepurchase(detailItem); setDetailItem(null); }} className="btn" style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "#F0FDF4", color: G, border: `1.5px solid ${G}` }}>🔄 Restock</button>
                    <button onClick={() => removeItem(detailItem.id)} className="btn" style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA" }}>🗑️ Remove</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 20px 32px", width: "100%", maxWidth: 480, maxHeight: "70vh", overflow: "auto", animation: "slideUp 0.3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D6D3D1", margin: "0 auto 14px" }} />
            <h3 style={{ fontFamily: H, color: G, fontSize: 18, marginBottom: 10 }}>Add Item</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F5F5F4", borderRadius: 11, padding: "0 12px", height: 42, marginBottom: 14 }}>
              <span style={{ color: "#A8A29E" }}>🔍</span>
              <input autoFocus value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Search 40+ grocery items..." style={{ border: "none", outline: "none", fontSize: 14, color: "#292524", width: "100%", background: "transparent" }} />
            </div>
            {addSearch && addResults.length === 0 && <p style={{ textAlign: "center", color: "#A8A29E", fontSize: 13, padding: 16 }}>No items found for "{addSearch}"</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {addResults.map((item, idx) => {
                const cat = CATEGORIES[item.category] || { icon: "📦" };
                return (
                  <button key={idx} onClick={() => addItem(item)} className="btn" style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
                    background: "#FAFAF8", borderRadius: 11, border: "1px solid #E7E5E4",
                    textAlign: "left", width: "100%", animation: `fadeUp 0.2s ease ${idx*0.03}s both`,
                  }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#292524" }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: "#78716C" }}>
                        {STORAGE_METHODS[item.defaultStorage]?.icon} {item.shelfLife[item.defaultStorage]}d · ${item.price.toFixed(2)} · {item.calories} cal
                      </div>
                    </div>
                    <span style={{ fontSize: 17, color: "#16A34A" }}>+</span>
                  </button>
                );
              })}
            </div>
            {!addSearch && <div style={{ textAlign: "center", padding: "20px 0", color: "#A8A29E" }}><p style={{ fontSize: 12 }}>Type to search from {FOOD_DB.length}+ items with USDA shelf life data</p></div>}
          </div>
        </div>
      )}

      {/* ── RECEIPT SCAN MODAL ── */}
      {showReceipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={() => !receiptScanning && setShowReceipt(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "90%", maxWidth: 380, animation: "popIn 0.3s ease" }} onClick={e => e.stopPropagation()}>
            {!receiptScanning ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
                  <h3 style={{ fontFamily: H, color: G, fontSize: 20, marginBottom: 6 }}>Scan Receipt</h3>
                  <p style={{ color: "#78716C", fontSize: 13, lineHeight: 1.5 }}>Take a photo of your grocery receipt to auto-add items using OCR.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={simulateReceiptScan} className="btn" style={{ width: "100%", padding: 14, borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#fff", background: `linear-gradient(135deg, ${G}, ${GL})` }}>📸 Take Photo</button>
                  <button onClick={simulateReceiptScan} className="btn" style={{ width: "100%", padding: 14, borderRadius: 14, fontSize: 14, fontWeight: 500, color: G, background: "#F0FDF4", border: `1.5px solid ${G}` }}>🖼️ Upload from Gallery</button>
                  <button onClick={() => setShowReceipt(false)} className="btn" style={{ width: "100%", padding: 12, borderRadius: 14, fontSize: 13, color: "#78716C", background: "transparent" }}>Cancel</button>
                </div>
                <p style={{ textAlign: "center", color: "#A8A29E", fontSize: 10, marginTop: 12 }}>Powered by Veryfi OCR · Supports any store receipt</p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 180, height: 240, margin: "0 auto 16px", borderRadius: 12, background: "#F5F5F4", position: "relative", overflow: "hidden", border: "2px solid #E7E5E4" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "#16A34A", boxShadow: "0 0 12px rgba(22,163,74,0.5)", animation: "scan 2s ease-in-out infinite" }} />
                  <div style={{ padding: "16px 12px", fontSize: 10, color: "#A8A29E", textAlign: "left", lineHeight: 2 }}>
                    GROCERY MART<br/>123 Main Street<br/>──────────────<br/>Whole Milk......$4.29<br/>Avocados........$4.50<br/>Bananas.........$1.38<br/>Chicken.........$6.99<br/>Bread...........$4.99<br/>OJ..............$4.49<br/>Olive Oil.......$7.99<br/>──────────────<br/>TOTAL.........$34.63
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #D6D3D1", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 14, color: "#44403C", fontWeight: 500 }}>Scanning receipt...</span>
                </div>
                <p style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>Detecting items & matching to database</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? "#DC2626" : G, color: "#fff",
          padding: "11px 20px", borderRadius: 14, fontSize: 13, fontWeight: 500, zIndex: 200,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)", animation: "toastIn 0.3s ease",
          maxWidth: 340, textAlign: "center",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}
