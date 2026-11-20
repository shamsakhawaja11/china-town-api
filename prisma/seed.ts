/**
 * Demo data for the China Town app.
 *
 *   npx prisma db seed            (uses the seed command in prisma7.config.ts)
 *   npx ts-node prisma/seed.ts    (same thing)
 *
 * WARNING: wipes every table first. Refuses to run when NODE_ENV=production
 * unless SEED_FORCE=true.
 *
 * Logins (password for everyone: Password@123)
 *   admin     admin@chinatown.pk
 *   manager   manager@chinatown.pk
 *   waiter    waiter@chinatown.pk
 *   chef      chef@chinatown.pk          (Wang Lei, dim sum / soups)
 *   customer  customer@chinatown.pk  or  03001234567
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { zoneOffsetMinutes, localDateString } from '../src/common/utils/time-zone';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const TZ = process.env.RESTAURANT_TIMEZONE ?? 'Asia/Karachi';
const TAX_RATE = Number(process.env.TAX_RATE_PERCENT ?? 16) / 100;
const DEPOSIT = Number(process.env.RESERVATION_DEPOSIT_AMOUNT ?? 500);
const PASSWORD = 'Password@123';

// ------------------------------------------------------------------ helpers

/** Deterministic random numbers so every seed run looks the same. */
let rngState = 20261120;
function rand() {
    rngState |= 0;
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const chance = (p: number) => rand() < p;
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const r3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
const time = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`);

const NOW = new Date();
/** A local wall-clock time `daysFromToday` days away, as a UTC Date. */
function localAt(daysFromToday: number, hhmm: string) {
    const day = localDateString(new Date(NOW.getTime() + daysFromToday * 86400000), TZ);
    const guess = new Date(`${day}T${hhmm}:00.000Z`);
    return new Date(guess.getTime() - zoneOffsetMinutes(guess, TZ) * 60000);
}

// --------------------------------------------------------------- static data

const ALLERGENS: [string, string][] = [
    ['Gluten', 'Wheat, barley and products made from them'],
    ['Soy', 'Soybeans and soy sauce'],
    ['Shellfish', 'Prawns, shrimp, crab, oyster sauce'],
    ['Peanuts', 'Peanuts and peanut oil'],
    ['Sesame', 'Sesame seeds and sesame oil'],
    ['Egg', 'Eggs and egg noodles'],
    ['Dairy', 'Milk, cream, ice cream'],
];

const SPECIALIZATIONS: [string, string][] = [
    ['Dim Sum', 'Steamed and fried dumplings, buns'],
    ['Wok & Stir-fry', 'High-heat wok dishes and gravies'],
    ['Noodles & Rice', 'Chow mein, fried rice, noodles'],
    ['Soups', 'Stocks and soups'],
    ['Desserts', 'Sweets and cold desserts'],
];

type Cat = 'meat' | 'seafood' | 'vegetables' | 'dry_goods' | 'sauces' | 'dairy' | 'beverages' | 'other';
type Ing = { name: string; unit: string; veg: boolean; vegan: boolean; allergens: string[]; cat: Cat; cost: number; supplier: string };

const MEAT = 'Lahore Meat Co.';
const SEA = 'Ocean Catch Seafood';
const VEG = 'Fresh Farm Veggies';
const PANTRY = 'Asia Pantry Traders';
const DAIRY = 'Dairy Best';

const INGREDIENTS: Ing[] = [
    { name: 'Chicken breast', unit: 'kg', veg: false, vegan: false, allergens: [], cat: 'meat', cost: 1100, supplier: MEAT },
    { name: 'Beef undercut', unit: 'kg', veg: false, vegan: false, allergens: [], cat: 'meat', cost: 1900, supplier: MEAT },
    { name: 'Prawns', unit: 'kg', veg: false, vegan: false, allergens: ['Shellfish'], cat: 'seafood', cost: 3200, supplier: SEA },
    { name: 'Eggs', unit: 'pcs', veg: true, vegan: false, allergens: ['Egg'], cat: 'dairy', cost: 30, supplier: DAIRY },
    { name: 'Egg noodles', unit: 'kg', veg: true, vegan: false, allergens: ['Gluten', 'Egg'], cat: 'dry_goods', cost: 450, supplier: PANTRY },
    { name: 'Basmati rice', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'dry_goods', cost: 380, supplier: PANTRY },
    { name: 'Rice vermicelli', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'dry_goods', cost: 650, supplier: PANTRY },
    { name: 'All-purpose flour', unit: 'kg', veg: true, vegan: true, allergens: ['Gluten'], cat: 'dry_goods', cost: 160, supplier: PANTRY },
    { name: 'Wonton wrappers', unit: 'pcs', veg: true, vegan: false, allergens: ['Gluten', 'Egg'], cat: 'dry_goods', cost: 8, supplier: PANTRY },
    { name: 'Spring roll sheets', unit: 'pcs', veg: true, vegan: true, allergens: ['Gluten'], cat: 'dry_goods', cost: 6, supplier: PANTRY },
    { name: 'Cornflour', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'dry_goods', cost: 250, supplier: PANTRY },
    { name: 'Soy sauce', unit: 'l', veg: true, vegan: true, allergens: ['Soy', 'Gluten'], cat: 'sauces', cost: 600, supplier: PANTRY },
    { name: 'Oyster sauce', unit: 'l', veg: false, vegan: false, allergens: ['Shellfish'], cat: 'sauces', cost: 900, supplier: PANTRY },
    { name: 'Chilli sauce', unit: 'l', veg: true, vegan: true, allergens: [], cat: 'sauces', cost: 450, supplier: PANTRY },
    { name: 'Rice vinegar', unit: 'l', veg: true, vegan: true, allergens: [], cat: 'sauces', cost: 350, supplier: PANTRY },
    { name: 'Sesame oil', unit: 'l', veg: true, vegan: true, allergens: ['Sesame'], cat: 'sauces', cost: 1800, supplier: PANTRY },
    { name: 'Cooking oil', unit: 'l', veg: true, vegan: true, allergens: [], cat: 'dry_goods', cost: 550, supplier: PANTRY },
    { name: 'Sugar', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'dry_goods', cost: 160, supplier: PANTRY },
    { name: 'Honey', unit: 'kg', veg: true, vegan: false, allergens: [], cat: 'dry_goods', cost: 1500, supplier: PANTRY },
    { name: 'Peanuts', unit: 'kg', veg: true, vegan: true, allergens: ['Peanuts'], cat: 'dry_goods', cost: 900, supplier: PANTRY },
    { name: 'Sesame seeds', unit: 'kg', veg: true, vegan: true, allergens: ['Sesame'], cat: 'dry_goods', cost: 1200, supplier: PANTRY },
    { name: 'Cabbage', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 120, supplier: VEG },
    { name: 'Capsicum', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 350, supplier: VEG },
    { name: 'Carrots', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 120, supplier: VEG },
    { name: 'Spring onion', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 300, supplier: VEG },
    { name: 'Garlic', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 600, supplier: VEG },
    { name: 'Ginger', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 700, supplier: VEG },
    { name: 'Green chillies', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 300, supplier: VEG },
    { name: 'Mushrooms', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 900, supplier: VEG },
    { name: 'Sweetcorn', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 500, supplier: VEG },
    { name: 'Tofu', unit: 'kg', veg: true, vegan: true, allergens: ['Soy'], cat: 'vegetables', cost: 800, supplier: VEG },
    { name: 'Lemons', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 400, supplier: VEG },
    { name: 'Mint', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'vegetables', cost: 600, supplier: VEG },
    { name: 'Mango pulp', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'other', cost: 600, supplier: PANTRY },
    { name: 'Milk', unit: 'l', veg: true, vegan: false, allergens: ['Dairy'], cat: 'dairy', cost: 220, supplier: DAIRY },
    { name: 'Vanilla ice cream', unit: 'l', veg: true, vegan: false, allergens: ['Dairy'], cat: 'dairy', cost: 900, supplier: DAIRY },
    { name: 'Jasmine tea leaves', unit: 'kg', veg: true, vegan: true, allergens: [], cat: 'beverages', cost: 4000, supplier: PANTRY },
    { name: 'Soda water', unit: 'l', veg: true, vegan: true, allergens: [], cat: 'beverages', cost: 120, supplier: PANTRY },
    { name: 'Chicken stock', unit: 'l', veg: false, vegan: false, allergens: [], cat: 'sauces', cost: 300, supplier: MEAT },
];

type Comp = 'main' | 'filling' | 'coating' | 'seasoning' | 'sauce' | 'garnish';
type Dish = {
    name: string;
    cat: string;
    price: number;
    desc: string;
    spice: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
    prep: number;
    serves?: number;
    specs: string[];
    recipe: [string, number, Comp?][];
    popularity: number;
};

const CATEGORIES = ['Starters', 'Dim Sum', 'Soups', 'Noodles & Rice', 'Wok Specials', 'Desserts', 'Beverages'];

const DISHES: Dish[] = [
    // Starters
    { name: 'Chicken Spring Rolls', cat: 'Starters', price: 650, spice: 'mild', prep: 12, specs: ['Dim Sum'], popularity: 5,
        desc: 'Crispy rolls filled with chicken, cabbage and carrots. 4 pieces.',
        recipe: [['Spring roll sheets', 4, 'coating'], ['Chicken breast', 0.08, 'filling'], ['Cabbage', 0.05, 'filling'], ['Carrots', 0.02, 'filling'], ['Cooking oil', 0.05], ['Soy sauce', 0.01, 'seasoning']] },
    { name: 'Crispy Fried Wontons', cat: 'Starters', price: 750, spice: 'none', prep: 12, specs: ['Dim Sum'], popularity: 4,
        desc: 'Golden wontons stuffed with seasoned chicken, served with sweet chilli dip. 8 pieces.',
        recipe: [['Wonton wrappers', 8, 'coating'], ['Chicken breast', 0.1, 'filling'], ['Spring onion', 0.01, 'filling'], ['Cooking oil', 0.06], ['Chilli sauce', 0.02, 'sauce']] },
    { name: 'Salt & Pepper Prawns', cat: 'Starters', price: 1650, spice: 'medium', prep: 15, specs: ['Wok & Stir-fry'], popularity: 3,
        desc: 'Wok-tossed crispy prawns with garlic, green chillies and spring onion.',
        recipe: [['Prawns', 0.15], ['Cornflour', 0.03, 'coating'], ['Garlic', 0.01, 'seasoning'], ['Green chillies', 0.01, 'seasoning'], ['Cooking oil', 0.06]] },
    { name: 'Chicken Lollipops', cat: 'Starters', price: 950, spice: 'hot', prep: 18, specs: ['Wok & Stir-fry'], popularity: 4,
        desc: 'Frenched chicken wings in a spicy batter, fried crisp. 6 pieces.',
        recipe: [['Chicken breast', 0.2], ['Cornflour', 0.03, 'coating'], ['All-purpose flour', 0.03, 'coating'], ['Eggs', 1, 'coating'], ['Chilli sauce', 0.02, 'sauce'], ['Cooking oil', 0.08]] },
    // Dim sum
    { name: 'Har Gow (Prawn Dumplings)', cat: 'Dim Sum', price: 1250, spice: 'none', prep: 15, specs: ['Dim Sum'], popularity: 4,
        desc: 'Translucent steamed dumplings with juicy prawn filling. 4 pieces.',
        recipe: [['Prawns', 0.12, 'filling'], ['Cornflour', 0.04, 'coating'], ['Ginger', 0.005, 'seasoning'], ['Sesame oil', 0.005, 'seasoning']] },
    { name: 'Chicken Siu Mai', cat: 'Dim Sum', price: 950, spice: 'none', prep: 15, specs: ['Dim Sum'], popularity: 5,
        desc: 'Open-top steamed dumplings with chicken and mushroom. 4 pieces.',
        recipe: [['Wonton wrappers', 4, 'coating'], ['Chicken breast', 0.1, 'filling'], ['Mushrooms', 0.03, 'filling'], ['Soy sauce', 0.01, 'seasoning'], ['Sesame oil', 0.005, 'seasoning']] },
    { name: 'Vegetable Crystal Dumplings', cat: 'Dim Sum', price: 850, spice: 'none', prep: 15, specs: ['Dim Sum'], popularity: 2,
        desc: 'Steamed dumplings with cabbage, carrot, mushroom and tofu. 4 pieces.',
        recipe: [['Cornflour', 0.04, 'coating'], ['Cabbage', 0.04, 'filling'], ['Carrots', 0.02, 'filling'], ['Mushrooms', 0.03, 'filling'], ['Tofu', 0.04, 'filling'], ['Soy sauce', 0.01, 'seasoning']] },
    { name: 'Steamed Chicken Bao', cat: 'Dim Sum', price: 800, spice: 'mild', prep: 20, specs: ['Dim Sum'], popularity: 3,
        desc: 'Fluffy steamed buns filled with sweet-savoury chicken. 3 pieces.',
        recipe: [['All-purpose flour', 0.12, 'coating'], ['Chicken breast', 0.09, 'filling'], ['Oyster sauce', 0.015, 'sauce'], ['Sugar', 0.01, 'seasoning']] },
    // Soups
    { name: 'Hot & Sour Soup', cat: 'Soups', price: 550, spice: 'medium', prep: 10, specs: ['Soups'], popularity: 5,
        desc: 'Tangy, peppery soup with chicken, egg ribbons and vegetables.',
        recipe: [['Chicken stock', 0.35, 'main'], ['Chicken breast', 0.04], ['Eggs', 1], ['Carrots', 0.02], ['Cabbage', 0.02], ['Rice vinegar', 0.02, 'seasoning'], ['Soy sauce', 0.01, 'seasoning'], ['Cornflour', 0.015]] },
    { name: 'Chicken Corn Soup', cat: 'Soups', price: 500, spice: 'none', prep: 10, specs: ['Soups'], popularity: 5,
        desc: 'Comforting chicken soup with sweetcorn and egg.',
        recipe: [['Chicken stock', 0.35, 'main'], ['Chicken breast', 0.04], ['Sweetcorn', 0.05], ['Eggs', 1], ['Cornflour', 0.015]] },
    { name: 'Wonton Soup', cat: 'Soups', price: 700, spice: 'none', prep: 12, specs: ['Soups', 'Dim Sum'], popularity: 3,
        desc: 'Clear broth with chicken wontons and bok choy-style greens.',
        recipe: [['Chicken stock', 0.4, 'main'], ['Wonton wrappers', 6], ['Chicken breast', 0.07, 'filling'], ['Spring onion', 0.01, 'garnish']] },
    // Noodles & rice
    { name: 'Chicken Chow Mein', cat: 'Noodles & Rice', price: 1250, spice: 'mild', prep: 15, specs: ['Noodles & Rice'], popularity: 5,
        desc: 'Stir-fried egg noodles with chicken, cabbage, capsicum and carrots.',
        recipe: [['Egg noodles', 0.2], ['Chicken breast', 0.15], ['Cabbage', 0.05], ['Capsicum', 0.04], ['Carrots', 0.03], ['Soy sauce', 0.02, 'sauce'], ['Cooking oil', 0.03], ['Garlic', 0.01, 'seasoning']] },
    { name: 'Singapore Rice Noodles', cat: 'Noodles & Rice', price: 1450, spice: 'medium', prep: 15, specs: ['Noodles & Rice', 'Wok & Stir-fry'], popularity: 3,
        desc: 'Thin rice vermicelli wok-tossed with prawns, chicken, egg and curry spice.',
        recipe: [['Rice vermicelli', 0.15], ['Prawns', 0.06], ['Chicken breast', 0.06], ['Eggs', 1], ['Capsicum', 0.03], ['Spring onion', 0.01, 'garnish'], ['Cooking oil', 0.03]] },
    { name: 'Egg Fried Rice', cat: 'Noodles & Rice', price: 850, spice: 'none', prep: 10, specs: ['Noodles & Rice'], popularity: 5, serves: 2,
        desc: 'Wok-fried basmati with egg and spring onion. Serves 2.',
        recipe: [['Basmati rice', 0.25], ['Eggs', 2], ['Spring onion', 0.02, 'garnish'], ['Soy sauce', 0.015, 'seasoning'], ['Cooking oil', 0.03]] },
    { name: 'Chicken Fried Rice', cat: 'Noodles & Rice', price: 1050, spice: 'none', prep: 12, specs: ['Noodles & Rice'], popularity: 4, serves: 2,
        desc: 'Fried rice with diced chicken, egg, carrots and peas. Serves 2.',
        recipe: [['Basmati rice', 0.25], ['Chicken breast', 0.12], ['Eggs', 1], ['Carrots', 0.03], ['Soy sauce', 0.015, 'seasoning'], ['Cooking oil', 0.03]] },
    { name: 'Vegetable Fried Rice', cat: 'Noodles & Rice', price: 800, spice: 'none', prep: 10, specs: ['Noodles & Rice'], popularity: 2, serves: 2,
        desc: 'Fried rice with seasonal vegetables. Vegan. Serves 2.',
        recipe: [['Basmati rice', 0.25], ['Carrots', 0.03], ['Cabbage', 0.03], ['Capsicum', 0.03], ['Sweetcorn', 0.03], ['Soy sauce', 0.015, 'seasoning'], ['Cooking oil', 0.03]] },
    // Wok specials
    { name: 'Kung Pao Chicken', cat: 'Wok Specials', price: 1550, spice: 'hot', prep: 15, specs: ['Wok & Stir-fry'], popularity: 5,
        desc: 'Diced chicken, roasted peanuts and dried chillies in a glossy Szechuan sauce.',
        recipe: [['Chicken breast', 0.2], ['Peanuts', 0.03, 'garnish'], ['Capsicum', 0.04], ['Green chillies', 0.01, 'seasoning'], ['Soy sauce', 0.02, 'sauce'], ['Rice vinegar', 0.01, 'sauce'], ['Sugar', 0.01, 'sauce'], ['Cooking oil', 0.03]] },
    { name: 'Chicken Manchurian', cat: 'Wok Specials', price: 1450, spice: 'medium', prep: 15, specs: ['Wok & Stir-fry'], popularity: 5,
        desc: 'Crispy chicken balls in a tangy soy-garlic gravy.',
        recipe: [['Chicken breast', 0.2], ['Cornflour', 0.03, 'coating'], ['Garlic', 0.01, 'seasoning'], ['Ginger', 0.01, 'seasoning'], ['Soy sauce', 0.02, 'sauce'], ['Chilli sauce', 0.02, 'sauce'], ['Cooking oil', 0.05]] },
    { name: 'Beef Chilli Dry', cat: 'Wok Specials', price: 1950, spice: 'extra_hot', prep: 18, specs: ['Wok & Stir-fry'], popularity: 4,
        desc: 'Crispy beef strips tossed with capsicum, onion and fiery chillies.',
        recipe: [['Beef undercut', 0.2], ['Cornflour', 0.03, 'coating'], ['Capsicum', 0.05], ['Green chillies', 0.02, 'seasoning'], ['Soy sauce', 0.02, 'sauce'], ['Chilli sauce', 0.02, 'sauce'], ['Cooking oil', 0.05]] },
    { name: 'Sweet & Sour Chicken', cat: 'Wok Specials', price: 1450, spice: 'none', prep: 15, specs: ['Wok & Stir-fry'], popularity: 3,
        desc: 'Battered chicken with peppers in a bright sweet and sour sauce.',
        recipe: [['Chicken breast', 0.2], ['All-purpose flour', 0.03, 'coating'], ['Capsicum', 0.05], ['Sugar', 0.02, 'sauce'], ['Rice vinegar', 0.02, 'sauce'], ['Cooking oil', 0.05]] },
    { name: 'Szechuan Prawns', cat: 'Wok Specials', price: 2450, spice: 'hot', prep: 15, specs: ['Wok & Stir-fry'], popularity: 2,
        desc: 'Jumbo prawns in a bold, numbing Szechuan pepper sauce.',
        recipe: [['Prawns', 0.2], ['Garlic', 0.01, 'seasoning'], ['Ginger', 0.01, 'seasoning'], ['Chilli sauce', 0.03, 'sauce'], ['Soy sauce', 0.015, 'sauce'], ['Cooking oil', 0.04]] },
    { name: 'Mapo Tofu', cat: 'Wok Specials', price: 1250, spice: 'hot', prep: 12, specs: ['Wok & Stir-fry'], popularity: 2,
        desc: 'Silky tofu in a spicy chilli-bean sauce. Vegetarian.',
        recipe: [['Tofu', 0.25], ['Chilli sauce', 0.03, 'sauce'], ['Soy sauce', 0.02, 'sauce'], ['Garlic', 0.01, 'seasoning'], ['Spring onion', 0.01, 'garnish'], ['Cooking oil', 0.03]] },
    // Desserts
    { name: 'Honey Noodles with Ice Cream', cat: 'Desserts', price: 750, spice: 'none', prep: 10, specs: ['Desserts'], popularity: 4,
        desc: 'Crispy fried noodles glazed in honey and sesame, with vanilla ice cream.',
        recipe: [['Egg noodles', 0.1], ['Honey', 0.04, 'sauce'], ['Sesame seeds', 0.01, 'garnish'], ['Vanilla ice cream', 0.1], ['Cooking oil', 0.05]] },
    { name: 'Mango Pudding', cat: 'Desserts', price: 600, spice: 'none', prep: 5, specs: ['Desserts'], popularity: 3,
        desc: 'Silky chilled mango pudding with fresh cream.',
        recipe: [['Mango pulp', 0.12], ['Milk', 0.1], ['Sugar', 0.02]] },
    { name: 'Sesame Balls', cat: 'Desserts', price: 650, spice: 'none', prep: 12, specs: ['Desserts', 'Dim Sum'], popularity: 2,
        desc: 'Crispy glutinous rice balls rolled in sesame seeds. 4 pieces.',
        recipe: [['All-purpose flour', 0.08, 'coating'], ['Sesame seeds', 0.02, 'coating'], ['Sugar', 0.03, 'filling'], ['Cooking oil', 0.05]] },
    // Beverages
    { name: 'Jasmine Tea Pot', cat: 'Beverages', price: 350, spice: 'none', prep: 5, specs: [], popularity: 3,
        desc: 'Fragrant jasmine green tea, served hot.',
        recipe: [['Jasmine tea leaves', 0.006]] },
    { name: 'Fresh Lime Soda', cat: 'Beverages', price: 350, spice: 'none', prep: 3, specs: [], popularity: 4,
        desc: 'Sweet or salted lime soda.',
        recipe: [['Lemons', 0.05], ['Soda water', 0.3], ['Sugar', 0.02]] },
    { name: 'Mint Margarita', cat: 'Beverages', price: 450, spice: 'none', prep: 4, specs: [], popularity: 4,
        desc: 'Frozen mint and lemon slush.',
        recipe: [['Mint', 0.02], ['Lemons', 0.05], ['Sugar', 0.03], ['Soda water', 0.15]] },
];

const RESTAURANT_REVIEWS: [number, string | null][] = [
    [5, 'Best Chinese in town. The Kung Pao chicken had real heat and the service was quick.'],
    [5, 'Dim sum platter was excellent, the Har Gow tasted fresh. Will be back with family.'],
    [4, 'Food was great, a little wait on a Saturday night but staff kept us updated.'],
    [5, 'Loved the ambience and the hot & sour soup. Booking a table through the app was easy.'],
    [4, 'Good portions and fair prices. Chow mein could use a bit more sauce.'],
    [3, 'Tasty food but our order took longer than the estimate.'],
    [5, null],
    [4, 'Takeaway was packed nicely and still hot when I got home.'],
    [5, 'Chicken Manchurian is a must. Friendly waiters.'],
    [2, 'Soup was lukewarm when it arrived. The rest was okay.'],
    [4, null],
    [5, 'Great place for a family dinner, kids loved the honey noodles.'],
];

const DISH_COMMENTS: Record<number, (string | null)[]> = {
    5: ['Perfect, exactly how I like it.', 'Absolutely delicious!', 'Fresh and full of flavour.', null, 'Would order again.'],
    4: ['Really good, slightly salty.', 'Tasty and well cooked.', null, 'Nice portion size.'],
    3: ['Okay, nothing special.', 'A bit too oily for me.', null],
    2: ['Was cold when served.', 'Too spicy even for me.'],
    1: ['Not good this time.'],
};

// -------------------------------------------------------------------- seed

async function wipe() {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`);
    }
}

async function main() {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
        throw new Error('Refusing to wipe a production database. Set SEED_FORCE=true if you really mean it.');
    }

    console.log('Clearing tables...');
    await wipe();

    const hash = await argon2.hash(PASSWORD);

    // ---------------------------------------------------------------- restaurant
    const restaurant = await prisma.restaurants.create({
        data: {
            name: 'Chinatown',
            description: 'Authentic Chinese & Indo-Chinese kitchen — dim sum, wok specials and noodles, made fresh to order.',
            address: 'Main Boulevard, Gulberg III, Lahore',
            latitude: 31.5104,
            longitude: 74.3436,
            phone: '+924235761234',
            opening_time: time('12:00'),
            closing_time: time('23:30'),
        },
    });

    // ---------------------------------------------------------------- lookup data
    await prisma.allergens.createMany({ data: ALLERGENS.map(([name, description]) => ({ name, description })) });
    const allergenId = new Map((await prisma.allergens.findMany()).map((a) => [a.name, a.id]));

    await prisma.food_specializations.createMany({ data: SPECIALIZATIONS.map(([name, description]) => ({ name, description })) });
    const specId = new Map((await prisma.food_specializations.findMany()).map((s) => [s.name, s.id]));

    const ingId = new Map<string, string>();
    for (const ing of INGREDIENTS) {
        const row = await prisma.ingredients.create({
            data: {
                name: ing.name,
                unit: ing.unit,
                is_vegetarian: ing.veg,
                is_vegan: ing.vegan,
                ingredient_allergens: { createMany: { data: ing.allergens.map((a) => ({ allergen_id: allergenId.get(a)! })) } },
            },
        });
        ingId.set(ing.name, row.id);
    }

    // ---------------------------------------------------------------- menu
    const catId = new Map<string, string>();
    for (const [i, name] of CATEGORIES.entries()) {
        const c = await prisma.menu_categories.create({
            data: { restaurant_id: restaurant.id, name, display_order: i + 1 },
        });
        catId.set(name, c.id);
    }

    const dishByName = new Map<string, { id: string; dish: Dish }>();
    for (const dish of DISHES) {
        const row = await prisma.menu_items.create({
            data: {
                category_id: catId.get(dish.cat)!,
                name: dish.name,
                description: dish.desc,
                price: dish.price,
                spice_level: dish.spice,
                preparation_time_minutes: dish.prep,
                serves_count: dish.serves ?? 1,
                menu_item_ingredients: {
                    createMany: {
                        data: dish.recipe.map(([ing, qty, comp]) => ({
                            ingredient_id: ingId.get(ing)!,
                            quantity_required: qty,
                            component: comp ?? 'main',
                        })),
                    },
                },
                menu_item_specializations: {
                    createMany: { data: dish.specs.map((s) => ({ specialization_id: specId.get(s)! })) },
                },
            },
        });
        dishByName.set(dish.name, { id: row.id, dish });
    }
    // one dish switched off, to show "unavailable"
    await prisma.menu_items.update({ where: { id: dishByName.get('Szechuan Prawns')!.id }, data: { is_available: false } });

    // ---------------------------------------------------------------- tables
    const plan = await prisma.floor_plans.create({
        data: { restaurant_id: restaurant.id, name: 'Main Hall', canvas_width: 1000, canvas_height: 700, is_default: true },
    });
    const tableCats = new Map<string, string>();
    for (const [i, [name, description]] of ([
        ['Standard', 'Tables for 2 to 4 guests'],
        ['Family', 'Large tables for 6 to 8 guests'],
        ['Booth', 'Cosy booths by the window'],
        ['Private Room', 'Closed room for gatherings'],
    ] as [string, string][]).entries()) {
        const c = await prisma.table_categories.create({
            data: { restaurant_id: restaurant.id, name, description, display_order: i + 1 },
        });
        tableCats.set(name, c.id);
    }
    const TABLES: [string, number, string, number, number, number, number][] = [
        // number, capacity, category, x, y, w, h
        ['T1', 2, 'Standard', 60, 60, 80, 80], ['T2', 2, 'Standard', 200, 60, 80, 80], ['T3', 4, 'Standard', 340, 60, 100, 100],
        ['T4', 4, 'Standard', 500, 60, 100, 100], ['T5', 4, 'Standard', 60, 240, 100, 100], ['T6', 4, 'Standard', 220, 240, 100, 100],
        ['B1', 4, 'Booth', 820, 60, 120, 90], ['B2', 4, 'Booth', 820, 190, 120, 90], ['B3', 6, 'Booth', 820, 320, 120, 110],
        ['F1', 6, 'Family', 380, 260, 160, 110], ['F2', 8, 'Family', 380, 430, 200, 120],
        ['P1', 12, 'Private Room', 60, 450, 260, 200],
    ];
    const tableRows = [];
    for (const [num, cap, cat, x, y, w, h] of TABLES) {
        tableRows.push(
            await prisma.restaurant_tables.create({
                data: {
                    restaurant_id: restaurant.id, floor_plan_id: plan.id, category_id: tableCats.get(cat)!,
                    table_number: num, capacity: cap, pos_x: x, pos_y: y, width: w, height: h,
                },
            }),
        );
    }
    const tableByNo = new Map(tableRows.map((t) => [t.table_number, t]));

    // ---------------------------------------------------------------- people
    const mkUser = (name: string, email: string | null, phone: string | null, role: 'admin' | 'staff' | 'customer', createdDaysAgo = 30) =>
        prisma.users.create({
            data: { name, email, phone, role, password_hash: hash, created_at: new Date(NOW.getTime() - createdDaysAgo * 86400000) },
        });

    const admin = await mkUser('Admin', 'admin@chinatown.pk', null, 'admin', 60);

    const staffSpecs: [string, string, string, 'chef' | 'waiter' | 'manager', string, string[], boolean][] = [
        ['Sana Malik', 'manager@chinatown.pk', '+923211110001', 'manager', 'Restaurant Manager', [], true],
        ['Hamza Ali', 'waiter@chinatown.pk', '+923211110002', 'waiter', 'Senior Waiter', [], true],
        ['Fatima Noor', 'fatima@chinatown.pk', '+923211110003', 'waiter', 'Waiter', [], true],
        ['Wang Lei', 'chef@chinatown.pk', '+923211110004', 'chef', 'Head Chef', ['Dim Sum', 'Soups'], true],
        ['Bilal Ahmed', 'bilal@chinatown.pk', '+923211110005', 'chef', 'Wok Chef', ['Wok & Stir-fry'], true],
        ['Ayesha Khan', 'ayesha@chinatown.pk', '+923211110006', 'chef', 'Line Chef', ['Noodles & Rice', 'Wok & Stir-fry'], true],
        ['Usman Tariq', 'usman@chinatown.pk', '+923211110007', 'chef', 'Pastry & Dim Sum Chef', ['Desserts', 'Dim Sum'], false],
    ];
    const staff: { id: string; userId: string; name: string; type: string; specs: string[]; available: boolean }[] = [];
    for (const [name, email, phone, type, position, specs, available] of staffSpecs) {
        const u = await mkUser(name, email, phone, 'staff', 50);
        const s = await prisma.staff.create({
            data: {
                user_id: u.id, restaurant_id: restaurant.id, staff_type: type, position, is_available: available,
                staff_specializations: { createMany: { data: specs.map((sp) => ({ specialization_id: specId.get(sp)! })) } },
            },
        });
        staff.push({ id: s.id, userId: u.id, name, type, specs, available });
    }
    const manager = staff.find((s) => s.type === 'manager')!;
    const waiters = staff.filter((s) => s.type === 'waiter');
    const chefs = staff.filter((s) => s.type === 'chef');

    const customerSpecs: [string, string | null, string | null][] = [
        ['Ali Raza', 'customer@chinatown.pk', '+923001234567'],
        ['Zainab Hussain', 'zainab@example.com', '+923001234568'],
        ['Omar Farooq', 'omar@example.com', '+923331234569'],
        ['Hira Shah', 'hira@example.com', '+923451234570'],
        ['Saad Qureshi', null, '+923121234571'],
        ['Maryam Iqbal', 'maryam@example.com', null],
    ];
    const customers: { id: string; name: string }[] = [];
    for (const [name, email, phone] of customerSpecs) {
        const u = await mkUser(name, email, phone, 'customer', 40);
        customers.push({ id: u.id, name });
    }

    // ---------------------------------------------------------------- simulation state
    type WalletEvent = { at: Date; type: 'credit' | 'debit' | 'refund'; amount: number; paymentId?: string; reservationId?: string; description: string; key?: string };
    const walletEvents = new Map<string, WalletEvent[]>(customers.map((c) => [c.id, []]));
    type InvEvent = { at: Date; delta: number; type: 'purchase' | 'usage' | 'adjustment' | 'waste'; orderItemId?: string; reason: string; by?: string | null; unitCost?: number; poItemId?: string };
    const invEvents = new Map<string, InvEvent[]>(INGREDIENTS.map((i) => [i.name, []]));

    const ordersData: Prisma.ordersCreateManyInput[] = [];
    const itemsData: Prisma.order_itemsCreateManyInput[] = [];
    const assignmentsData: Prisma.order_item_assignmentsCreateManyInput[] = [];
    const paymentsData: Prisma.paymentsCreateManyInput[] = [];
    const refundsData: Prisma.refundsCreateManyInput[] = [];
    const fulfillmentsData: Prisma.order_fulfillmentsCreateManyInput[] = [];
    const restaurantReviewsData: Prisma.restaurant_reviewsCreateManyInput[] = [];
    const dishReviewsData: Prisma.dish_reviewsCreateManyInput[] = [];
    const notificationsData: Prisma.notificationsCreateManyInput[] = [];

    // every customer topped up their wallet a while ago
    for (const [i, c] of customers.entries()) {
        walletEvents.get(c.id)!.push({
            at: new Date(NOW.getTime() - (20 - i) * 86400000),
            type: 'credit',
            amount: [15000, 8000, 10000, 5000, 3000, 6000][i],
            description: `Top-up by card •••• ${4242 + i}`,
            key: `seed-topup-${i}`,
        });
    }
    const walletBalanceAt = (customerId: string, at: Date) => {
        let bal = 0;
        for (const e of walletEvents.get(customerId)!.filter((e) => e.at <= at)) bal += e.type === 'debit' ? -e.amount : e.amount;
        return r2(bal);
    };
    /** True if debiting `amount` at `at` keeps the wallet >= 0 now and at every later event. */
    const canDebit = (customerId: string, at: Date, amount: number) => {
        const later = walletEvents.get(customerId)!.filter((e) => e.at > at).map((e) => walletBalanceAt(customerId, e.at));
        return Math.min(walletBalanceAt(customerId, at), ...later) >= amount;
    };

    const weighted = DISHES.filter((d) => d.name !== 'Szechuan Prawns').flatMap((d) => Array(d.popularity).fill(d) as Dish[]);
    const chefFor = (dish: Dish) => {
        const matching = chefs.filter((c) => c.specs.some((s) => dish.specs.includes(s)));
        return pick(matching.length ? matching : chefs);
    };

    type OrderPlan = {
        customer: { id: string; name: string };
        type: 'dine_in' | 'takeaway';
        status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'rejected' | 'draft';
        placedAt: Date;
        lines?: [Dish, number][];
        pay?: 'cash' | 'card' | 'wallet' | null;
        tip?: number;
        table?: string;
        review?: boolean;
        kitchen?: 'none' | 'partial' | 'all_done';
        reason?: string;
    };

    let lowStockOrderNo = 0;
    function buildOrder(p: OrderPlan) {
        const orderId = randomUUID();
        const lines = p.lines ?? Array.from({ length: between(1, 4) }, () => [pick(weighted), between(1, 2)] as [Dish, number]);
        // merge duplicates (one row per dish per order)
        const merged = new Map<string, [Dish, number]>();
        for (const [d, q] of lines) merged.set(d.name, [d, (merged.get(d.name)?.[1] ?? 0) + q]);

        const t = p.placedAt;
        const reviewedAt = addMin(t, between(1, 4));
        const prepStart = addMin(reviewedAt, between(2, 6));
        const longest = Math.max(...[...merged.values()].map(([d]) => d.prep));
        const readyAt = addMin(prepStart, longest + between(0, 6));
        const servedAt = addMin(readyAt, between(2, 6));
        const completedAt = addMin(servedAt, p.type === 'dine_in' ? between(25, 50) : 1);

        const has = (s: string) => {
            const flow = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed'];
            return flow.indexOf(p.status) >= flow.indexOf(s);
        };

        let subtotal = 0;
        const orderItemIds: { id: string; dish: Dish; qty: number }[] = [];
        for (const [dish, qty] of merged.values()) {
            const id = randomUUID();
            const lineTotal = r2(dish.price * qty);
            subtotal = r2(subtotal + lineTotal);
            itemsData.push({
                id, order_id: orderId, menu_item_id: dishByName.get(dish.name)!.id, quantity: qty, unit_price: dish.price, subtotal: lineTotal,
                special_instructions: chance(0.15) ? pick(['Less spicy please', 'No spring onion', 'Extra sauce on the side', 'Make it extra hot']) : null,
            });
            orderItemIds.push({ id, dish, qty });
        }
        const tax = r2(subtotal * TAX_RATE);
        const tip = p.tip ?? 0;
        const total = r2(subtotal + tax + tip);

        // kitchen
        const kitchenStarted = has('preparing') && !['cancelled', 'rejected'].includes(p.status);
        orderItemIds.forEach(({ id, dish, qty }, idx) => {
            if (p.status === 'draft' || p.status === 'pending' || p.status === 'rejected') return;
            if (p.status === 'accepted' && p.kitchen !== 'partial') return; // waiting for assignment
            if (p.status === 'cancelled') return;
            const chef = chefFor(dish);
            let status: 'assigned' | 'in_progress' | 'done' = 'done';
            if (p.status === 'preparing') status = idx === 0 ? 'in_progress' : idx === 1 ? 'done' : 'assigned';
            if (p.status === 'accepted') status = 'assigned';
            const started = status !== 'assigned' ? addMin(prepStart, idx) : null;
            assignmentsData.push({
                order_item_id: id, staff_id: chef.id, status,
                assigned_at: addMin(reviewedAt, 1),
                started_at: started,
                completed_at: status === 'done' ? addMin(prepStart, dish.prep + idx) : null,
            });
            if (started) {
                for (const [ing, q] of dish.recipe) {
                    invEvents.get(ing)!.push({
                        at: started, delta: -r3(q * qty), type: 'usage', orderItemId: id, by: chef.id, reason: `${qty} x ${dish.name}`,
                    });
                }
            }
        });

        // fulfillment for takeaway
        if (p.type === 'takeaway' && p.status !== 'draft') {
            fulfillmentsData.push({
                order_id: orderId,
                pickup_code: `CT-${100000 + ordersData.length * 7919 % 899999}`,
                estimated_ready_at: addMin(t, longest + 10),
                picked_up_at: has('served') && !['cancelled', 'rejected'].includes(p.status) ? servedAt : null,
            });
        }

        // payment
        let paymentStatus: 'unpaid' | 'paid' | 'refunded' = 'unpaid';
        let method: 'cash' | 'card' | 'wallet' | null = null;
        if (p.pay) {
            method = p.pay;
            const payAt = p.status === 'completed' ? completedAt : addMin(t, 1);
            if (method === 'wallet' && !canDebit(p.customer.id, payAt, total)) method = 'card';
            const paymentId = randomUUID();
            paymentsData.push({
                id: paymentId, order_id: orderId, method,
                provider: method === 'card' ? 'mock_gateway' : method === 'wallet' ? 'wallet' : null,
                transaction_id: `${method === 'card' ? 'MOCK' : method === 'wallet' ? 'WAL' : 'CASH'}-${randomUUID()}`,
                amount: total, status: 'succeeded',
                gateway_response: method === 'card' ? { simulated: true, approved: true, cardLast4: String(between(1000, 9999)) } : undefined,
                received_by: method === 'cash' ? pick(waiters).id : null,
                created_at: addMin(payAt, -1), updated_at: payAt,
            });
            if (method === 'wallet') {
                walletEvents.get(p.customer.id)!.push({
                    at: payAt, type: 'debit', amount: total, paymentId, description: `Payment for order #${orderId.slice(0, 8)}`,
                });
            }
            paymentStatus = 'paid';
            if (p.status === 'cancelled' || p.status === 'rejected') {
                const refundAt = addMin(t, 6);
                refundsData.push({ payment_id: paymentId, amount: total, reason: p.status === 'cancelled' ? 'Order cancelled' : 'Order rejected by restaurant', status: 'processed', processed_by: manager.id, created_at: refundAt, updated_at: refundAt });
                walletEvents.get(p.customer.id)!.push({
                    at: refundAt, type: 'refund', amount: total, description: 'Refund: order cancelled', key: `seed-refund-${paymentId}`,
                });
                paymentStatus = 'refunded';
            }
        }

        ordersData.push({
            id: orderId,
            customer_id: p.customer.id,
            restaurant_id: restaurant.id,
            order_type: p.type,
            table_id: p.type === 'dine_in' && p.status !== 'draft' ? tableByNo.get(p.table ?? pick(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'B1', 'B2']))!.id : null,
            status: p.status,
            rejection_reason: p.status === 'rejected' ? p.reason ?? 'Kitchen is at full capacity' : null,
            cancellation_reason: p.status === 'cancelled' ? p.reason ?? 'Changed my mind' : null,
            reviewed_by: has('accepted') || p.status === 'rejected' ? manager.id : null,
            reviewed_at: has('accepted') || p.status === 'rejected' ? reviewedAt : null,
            payment_method: method,
            payment_status: paymentStatus,
            subtotal, tax, tip, total,
            notes: chance(0.1) ? 'Birthday dinner, please bring the dessert with a candle' : null,
            placed_at: p.status === 'draft' ? null : t,
            preparing_at: kitchenStarted ? prepStart : null,
            ready_at: has('ready') && p.status !== 'cancelled' ? readyAt : null,
            served_at: has('served') && p.status !== 'cancelled' ? servedAt : null,
            completed_at: p.status === 'completed' ? completedAt : null,
            cancelled_at: p.status === 'cancelled' ? addMin(t, 5) : null,
            created_at: addMin(t, -5),
            updated_at: p.status === 'completed' ? completedAt : t,
        });

        // reviews
        if (p.status === 'completed' && p.review) {
            const [rating, comment] = RESTAURANT_REVIEWS[lowStockOrderNo++ % RESTAURANT_REVIEWS.length];
            const at = addMin(completedAt, between(30, 600));
            restaurantReviewsData.push({
                customer_id: p.customer.id, order_id: orderId, rating, comment,
                food_rating: Math.min(5, Math.max(1, rating + pick([0, 0, 1, -1]))),
                service_rating: Math.min(5, Math.max(1, rating + pick([0, 0, -1]))),
                ambience_rating: Math.min(5, Math.max(1, rating + pick([0, 1]))),
                created_at: at, updated_at: at,
            });
            for (const { id, dish } of orderItemIds) {
                if (!chance(0.7)) continue;
                const base = dish.popularity >= 4 ? [5, 5, 5, 4, 4, 3] : [5, 4, 4, 3, 3, 2];
                const dr = pick(base);
                dishReviewsData.push({
                    customer_id: p.customer.id, order_item_id: id, menu_item_id: dishByName.get(dish.name)!.id,
                    rating: dr, comment: pick(DISH_COMMENTS[dr]), created_at: at, updated_at: at,
                });
            }
        }
        return orderId;
    }

    // ------------------------------------------------------- 14 days of history
    for (let day = -14; day <= -1; day++) {
        const count = between(3, 6) + (new Date(NOW.getTime() + day * 86400000).getDay() % 6 === 5 ? 2 : 0);
        for (let n = 0; n < count; n++) {
            const hh = String(between(12, 22)).padStart(2, '0');
            const mm = String(between(0, 59)).padStart(2, '0');
            const r = rand();
            const status = r < 0.05 ? 'cancelled' : r < 0.08 ? 'rejected' : 'completed';
            buildOrder({
                customer: pick(customers),
                type: chance(0.7) ? 'dine_in' : 'takeaway',
                status,
                placedAt: localAt(day, `${hh}:${mm}`),
                pay: status === 'completed' ? pick(['cash', 'cash', 'card', 'card', 'wallet']) : status === 'cancelled' && chance(0.5) ? 'wallet' : null,
                tip: status === 'completed' && chance(0.3) ? pick([100, 150, 200, 300]) : 0,
                review: chance(0.55),
            });
        }
    }

    // ------------------------------------------------------- live orders today
    const [ali, zainab, omar, hira, saad, maryam] = customers;
    const d = (n: string) => dishByName.get(n)!.dish;
    const ago = (m: number) => new Date(NOW.getTime() - m * 60000);

    const liveCompleted = buildOrder({ customer: hira, type: 'dine_in', status: 'completed', placedAt: ago(180), pay: 'card', tip: 200, table: 'T3', review: false,
        lines: [[d('Hot & Sour Soup'), 2], [d('Chicken Manchurian'), 1], [d('Egg Fried Rice'), 1]] });
    buildOrder({ customer: omar, type: 'takeaway', status: 'completed', placedAt: ago(150), pay: 'cash', lines: [[d('Chicken Chow Mein'), 2], [d('Fresh Lime Soda'), 2]] });
    const servedUnpaid = buildOrder({ customer: ali, type: 'dine_in', status: 'served', placedAt: ago(70), pay: null, table: 'B1',
        lines: [[d('Chicken Siu Mai'), 1], [d('Kung Pao Chicken'), 1], [d('Chicken Fried Rice'), 1], [d('Mint Margarita'), 2]] });
    const readyTakeaway = buildOrder({ customer: zainab, type: 'takeaway', status: 'ready', placedAt: ago(35), pay: 'card',
        lines: [[d('Chicken Spring Rolls'), 1], [d('Singapore Rice Noodles'), 1]] });
    const preparing = buildOrder({ customer: saad, type: 'dine_in', status: 'preparing', placedAt: ago(20), pay: null, table: 'F1',
        lines: [[d('Beef Chilli Dry'), 1], [d('Chicken Corn Soup'), 3], [d('Vegetable Fried Rice'), 1]] });
    const accepted = buildOrder({ customer: maryam, type: 'dine_in', status: 'accepted', placedAt: ago(9), pay: null, table: 'T4',
        lines: [[d('Har Gow (Prawn Dumplings)'), 1], [d('Mapo Tofu'), 1], [d('Jasmine Tea Pot'), 1]] });
    const pendingWallet = buildOrder({ customer: omar, type: 'takeaway', status: 'pending', placedAt: ago(4), pay: 'wallet',
        lines: [[d('Chicken Lollipops'), 1], [d('Chicken Chow Mein'), 1]] });
    buildOrder({ customer: hira, type: 'dine_in', status: 'pending', placedAt: ago(2), pay: null, table: 'T6',
        lines: [[d('Wonton Soup'), 2], [d('Sweet & Sour Chicken'), 1]] });
    // Ali's cart (draft order)
    buildOrder({ customer: ali, type: 'dine_in', status: 'draft', placedAt: ago(1), pay: null,
        lines: [[d('Honey Noodles with Ice Cream'), 1], [d('Mango Pudding'), 1]] });

    // ------------------------------------------------------- inventory ledger
    const usageTotals = new Map<string, number>();
    for (const [name, evs] of invEvents) usageTotals.set(name, r3(evs.reduce((s, e) => s - e.delta, 0)));

    const inventoryRows: { id: string; ing: Ing; par: number; reorder: number }[] = [];
    for (const ing of INGREDIENTS) {
        const daily = (usageTotals.get(ing.name) ?? 0) / 14;
        const min = ing.unit === 'pcs' ? 60 : ing.unit === 'kg' && ing.cost > 2000 ? 1 : 5;
        const par = Math.max(min, Math.ceil(daily * 8 * (ing.unit === 'pcs' ? 1 : 2)) / (ing.unit === 'pcs' ? 1 : 2));
        const reorder = r3(Math.max(ing.unit === 'pcs' ? 20 : 0.5, par * 0.3));
        const row = await prisma.inventory_items.create({
            data: {
                restaurant_id: restaurant.id, ingredient_id: ingId.get(ing.name)!, category: ing.cat,
                par_level: par, reorder_level: reorder, unit_cost: ing.cost, default_supplier: ing.supplier,
            },
        });
        inventoryRows.push({ id: row.id, ing, par, reorder });
    }

    // purchase order received 6 days ago (everything) and one still on the way
    const receivedPoId = randomUUID();
    const pendingPoId = randomUUID();
    const poItems: Prisma.purchase_order_itemsCreateManyInput[] = [];
    const receivedAt = localAt(-6, '10:30');
    let receivedTotal = 0;
    for (const inv of inventoryRows) {
        const qty = inv.ing.unit === 'pcs' ? Math.round(inv.par * 0.6) : r3(inv.par * 0.6);
        const id = randomUUID();
        poItems.push({ id, purchase_order_id: receivedPoId, inventory_item_id: inv.id, quantity_ordered: qty, quantity_received: qty, unit_cost: inv.ing.cost });
        receivedTotal += qty * inv.ing.cost;
        invEvents.get(inv.ing.name)!.push({
            at: receivedAt, delta: qty, type: 'purchase', unitCost: inv.ing.cost, poItemId: id, by: manager.id,
            reason: `Received from ${inv.ing.supplier} (PO-${receivedPoId.slice(0, 6).toUpperCase()})`,
        });
    }

    // opening stock 15 days ago + realistic waste; top up when a usage would go negative
    const invTxns: Prisma.inventory_transactionsCreateManyInput[] = [];
    const finalQty = new Map<string, number>();
    for (const inv of inventoryRows) {
        const evs = invEvents.get(inv.ing.name)!;
        evs.push({ at: localAt(-15, '11:00'), delta: inv.par, type: 'purchase', unitCost: inv.ing.cost, by: manager.id, reason: 'Opening stock' });
        if (inv.ing.cat === 'vegetables' || inv.ing.cat === 'dairy') {
            evs.push({ at: localAt(-3, '23:00'), delta: -r3(inv.par * 0.05), type: 'waste', by: manager.id, reason: 'Spoiled / expired' });
        }
        evs.sort((a, b) => a.at.getTime() - b.at.getTime());
        let qty = 0;
        for (const e of evs) {
            if (qty + e.delta < 0) {
                const top = inv.par;
                const at = addMin(e.at, -60);
                invTxns.push({ inventory_item_id: inv.id, transaction_type: 'purchase', quantity: top, quantity_before: qty, quantity_after: r3(qty + top), unit_cost: inv.ing.cost, reason: `Local market purchase (${inv.ing.supplier})`, performed_by: manager.id, created_at: at });
                qty = r3(qty + top);
            }
            const after = r3(qty + e.delta);
            invTxns.push({
                inventory_item_id: inv.id, transaction_type: e.type, quantity: r3(e.delta), quantity_before: qty, quantity_after: after,
                order_item_id: e.orderItemId, performed_by: e.by ?? null, reason: e.reason, unit_cost: e.unitCost, purchase_order_item_id: e.poItemId, created_at: e.at,
            });
            qty = after;
        }
        finalQty.set(inv.id, qty);
    }
    // make a few items low / out of stock so the alerts and restock plan have something to show
    const forceLow = ['Prawns', 'Spring onion', 'Mango pulp', 'Chicken stock'];
    const forceOut = ['Mint'];
    for (const inv of inventoryRows) {
        const qty = finalQty.get(inv.id)!;
        let target: number | null = null;
        if (forceOut.includes(inv.ing.name)) target = 0;
        else if (forceLow.includes(inv.ing.name)) target = r3(inv.reorder * 0.6);
        if (target === null || target >= qty) continue;
        invTxns.push({
            inventory_item_id: inv.id, transaction_type: 'adjustment', quantity: r3(target - qty), quantity_before: qty, quantity_after: target,
            reason: 'Stock count', performed_by: manager.id, created_at: ago(90),
        });
        finalQty.set(inv.id, target);
    }

    await prisma.purchase_orders.create({
        data: {
            id: receivedPoId, restaurant_id: restaurant.id, supplier_name: 'Multiple suppliers (weekly order)', status: 'received',
            total_cost: r2(receivedTotal), created_by: admin.id, ordered_at: localAt(-7, '16:00'), expected_at: receivedAt, received_at: receivedAt,
            notes: 'Weekly restock', created_at: localAt(-7, '16:00'), updated_at: receivedAt,
        },
    });
    const lowItems = inventoryRows.filter((i) => forceLow.includes(i.ing.name) || forceOut.includes(i.ing.name));
    await prisma.purchase_orders.create({
        data: {
            id: pendingPoId, restaurant_id: restaurant.id, supplier_name: SEA, status: 'ordered',
            total_cost: r2(lowItems.filter((i) => i.ing.supplier === SEA).reduce((s, i) => s + i.par * i.ing.cost, 0)),
            created_by: admin.id, ordered_at: ago(120), expected_at: localAt(1, '11:00'), notes: 'Urgent: prawns running low',
        },
    });
    poItems.push(
        ...lowItems.filter((i) => i.ing.supplier === SEA).map((i) => ({
            purchase_order_id: pendingPoId, inventory_item_id: i.id, quantity_ordered: i.par, quantity_received: 0, unit_cost: i.ing.cost,
        })),
    );

    // ------------------------------------------------------- reservations
    const reservations: { id: string; customer: string; time: Date; dur: number; party: number; status: string; tables: string[]; request?: string; deposit?: 'held' | 'refunded' }[] = [
        { id: randomUUID(), customer: ali.id, time: localAt(1, '20:00'), dur: 90, party: 4, status: 'confirmed', tables: ['T5'], request: 'Window side if possible', deposit: 'held' },
        { id: randomUUID(), customer: zainab.id, time: localAt(2, '19:30'), dur: 90, party: 2, status: 'pending', tables: ['T2'] },
        { id: randomUUID(), customer: omar.id, time: localAt(3, '21:00'), dur: 120, party: 10, status: 'confirmed', tables: ['P1'], request: 'Office dinner, need a projector', deposit: 'held' },
        { id: randomUUID(), customer: saad.id, time: ago(25), dur: 90, party: 6, status: 'seated', tables: ['F1'], deposit: 'refunded' },
        { id: randomUUID(), customer: hira.id, time: localAt(-3, '20:30'), dur: 90, party: 3, status: 'completed', tables: ['T3'] },
        { id: randomUUID(), customer: maryam.id, time: localAt(-2, '13:30'), dur: 60, party: 2, status: 'no_show', tables: ['T1'] },
        { id: randomUUID(), customer: zainab.id, time: localAt(-5, '19:00'), dur: 90, party: 4, status: 'cancelled', tables: ['B2'] },
    ];
    for (const r of reservations) {
        await prisma.reservations.create({
            data: {
                id: r.id, customer_id: r.customer, restaurant_id: restaurant.id, party_size: r.party, reservation_time: r.time,
                duration_minutes: r.dur, status: r.status as 'pending', special_requests: r.request,
                cancelled_at: r.status === 'cancelled' ? addMin(r.time, -600) : null,
                cancellation_reason: r.status === 'cancelled' ? 'Plans changed' : null,
                created_at: new Date(Math.min(addMin(r.time, -2 * 24 * 60).getTime(), NOW.getTime() - 3 * 3600000 - 60000)),
            },
        });
        const active = ['pending', 'confirmed', 'seated'].includes(r.status);
        for (const t of r.tables) {
            await prisma.$executeRaw`
                INSERT INTO reservation_tables (reservation_id, table_id, during, is_active)
                VALUES (${r.id}::uuid, ${tableByNo.get(t)!.id}::uuid,
                        tstzrange(${r.time}::timestamptz, ${addMin(r.time, r.dur)}::timestamptz, '[)'), ${active})`;
        }
        if (r.deposit && DEPOSIT > 0) {
            const paidAt = new Date(Math.min(addMin(r.time, -2 * 24 * 60 + 5).getTime(), NOW.getTime() - 3 * 3600000));
            const paymentId = randomUUID();
            // make sure the wallet can cover the deposit at every later point in time
            if (!canDebit(r.customer, paidAt, DEPOSIT)) {
                walletEvents.get(r.customer)!.push({
                    at: addMin(paidAt, -30), type: 'credit', amount: 5000, description: 'Top-up by card •••• 1111', key: `seed-topup-dep-${r.id}`,
                });
            }
            paymentsData.push({
                id: paymentId, reservation_id: r.id, method: 'wallet', provider: 'wallet', transaction_id: `WAL-${randomUUID()}`,
                amount: DEPOSIT, status: 'succeeded', created_at: paidAt, updated_at: paidAt,
            });
            walletEvents.get(r.customer)!.push({ at: paidAt, type: 'debit', amount: DEPOSIT, paymentId, reservationId: r.id, description: `Deposit for reservation #${r.id.slice(0, 8)}` });
            if (r.deposit === 'refunded') {
                const at = addMin(r.time, 2);
                refundsData.push({ payment_id: paymentId, amount: DEPOSIT, reason: 'Deposit returned on arrival', status: 'processed', processed_by: waiters[0].id, created_at: at, updated_at: at });
                walletEvents.get(r.customer)!.push({ at, type: 'refund', amount: DEPOSIT, reservationId: r.id, description: 'Refund: Deposit returned on arrival', key: `seed-dep-refund-${paymentId}` });
            }
        }
    }

    // ------------------------------------------------------- write everything
    console.log(`Writing ${ordersData.length} orders, ${itemsData.length} order lines, ${invTxns.length} stock movements...`);
    await prisma.orders.createMany({ data: ordersData });
    await prisma.order_items.createMany({ data: itemsData });
    await prisma.order_item_assignments.createMany({ data: assignmentsData });
    await prisma.order_fulfillments.createMany({ data: fulfillmentsData });
    await prisma.payments.createMany({ data: paymentsData });
    await prisma.refunds.createMany({ data: refundsData });
    await prisma.purchase_order_items.createMany({ data: poItems });
    await prisma.inventory_transactions.createMany({ data: invTxns });
    for (const inv of inventoryRows) {
        await prisma.inventory_items.update({ where: { id: inv.id }, data: { current_quantity: finalQty.get(inv.id)! } });
    }

    // wallets: replay events in time order so balance_before / balance_after line up
    for (const c of customers) {
        const evs = walletEvents.get(c.id)!.sort((a, b) => a.at.getTime() - b.at.getTime());
        const wallet = await prisma.wallets.create({ data: { user_id: c.id } });
        let bal = 0;
        const rows: Prisma.wallet_transactionsCreateManyInput[] = [];
        for (const e of evs) {
            const before = bal;
            bal = r2(e.type === 'debit' ? bal - e.amount : bal + e.amount);
            if (bal < 0) throw new Error(`Seed bug: wallet of ${c.name} went negative`);
            rows.push({
                wallet_id: wallet.id, payment_id: e.type === 'debit' ? e.paymentId : undefined, reservation_id: e.reservationId,
                transaction_type: e.type, amount: e.amount, balance_before: before, balance_after: bal,
                description: e.description, idempotency_key: e.key, created_at: e.at,
            });
        }
        await prisma.wallet_transactions.createMany({ data: rows });
        await prisma.wallets.update({ where: { id: wallet.id }, data: { balance: bal } });
    }

    await prisma.restaurant_reviews.createMany({ data: restaurantReviewsData });
    await prisma.dish_reviews.createMany({ data: dishReviewsData });
    await prisma.$executeRaw`
        UPDATE menu_items mi SET
            avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM dish_reviews dr WHERE dr.menu_item_id = mi.id), 0),
            review_count = (SELECT COUNT(*) FROM dish_reviews dr WHERE dr.menu_item_id = mi.id)`;

    // ------------------------------------------------------- notifications
    const managementIds = [admin.id, manager.userId];
    for (const uid of managementIds) {
        notificationsData.push(
            { user_id: uid, type: 'order_placed', title: 'New order', message: `Order #${pendingWallet.slice(0, 8).toUpperCase()} (takeaway) is waiting for approval`, created_at: ago(4) },
            { user_id: uid, type: 'low_stock', title: 'Low stock', message: `Running low on: ${[...forceLow, ...forceOut].join(', ')}`, created_at: ago(90) },
            { user_id: uid, type: 'new_review', title: 'New 5★ review', message: 'Best Chinese in town. The Kung Pao chicken had real heat...', created_at: ago(600), is_read: true, read_at: ago(500) },
        );
    }
    notificationsData.push(
        { user_id: ali.id, type: 'order_served', title: 'Enjoy your meal!', message: `Your order #${servedUnpaid.slice(0, 8).toUpperCase()} has been served.`, created_at: ago(30) },
        { user_id: ali.id, type: 'reservation_confirmed', title: 'Reservation update', message: 'Your table is confirmed. See you soon!', created_at: ago(300) },
        { user_id: zainab.id, type: 'order_ready', title: 'Ready for pickup', message: `Order #${readyTakeaway.slice(0, 8).toUpperCase()} is ready. Show your pickup code at the counter.`, created_at: ago(3) },
        { user_id: saad.id, type: 'order_preparing', title: 'Cooking started', message: `Your order #${preparing.slice(0, 8).toUpperCase()} is being prepared.`, created_at: ago(12) },
        { user_id: maryam.id, type: 'order_accepted', title: 'Order accepted', message: `The kitchen accepted your order #${accepted.slice(0, 8).toUpperCase()}.`, created_at: ago(7) },
        { user_id: hira.id, type: 'payment_succeeded', title: 'Payment successful', message: 'Thanks for dining with us! Rate your order to help others.', created_at: ago(60) },
    );
    const chefWang = staff.find((s) => s.name === 'Wang Lei')!;
    notificationsData.push({ user_id: chefWang.userId, type: 'kitchen_assignment', title: 'New dish assigned', message: `You have new items for order #${preparing.slice(0, 8).toUpperCase()}`, created_at: ago(15) });
    await prisma.notifications.createMany({ data: notificationsData });

    void liveCompleted;

    // ------------------------------------------------------- summary
    const counts = await prisma.$queryRaw<{ status: string; n: number }[]>`SELECT status::text, count(*)::int AS n FROM orders GROUP BY status ORDER BY status`;
    console.log('Orders by status:', Object.fromEntries(counts.map((c) => [c.status, c.n])));
    console.log(`Menu: ${DISHES.length} dishes, inventory: ${inventoryRows.length} items, reservations: ${reservations.length}`);
    console.log(`Reviews: ${restaurantReviewsData.length} restaurant, ${dishReviewsData.length} dish`);
    console.log('\nLogins (password Password@123):');
    console.log('  admin@chinatown.pk | manager@chinatown.pk | waiter@chinatown.pk | chef@chinatown.pk | customer@chinatown.pk');
}

main()
    .then(() => console.log('\nSeed finished ✔'))
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
