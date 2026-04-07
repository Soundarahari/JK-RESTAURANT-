export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sub_category: string;
  base_price: number;
  student_price: number;
  image_url: string;
  is_available: boolean;
  rating: number;
  reviews: number;
  is_veg: boolean;
  bestseller: boolean;
  spicy: boolean;
  prep_time: number;
}

export const COLLEGES = [
  "JKKN EDUCATIONAL INSTITUTIONS",
  "SSM EDUCATIONAL INSTITUTIONS",
  "EXCEL EDUCATIONAL INSTITUTIONS",
  "JKKM EDUCATIONAL INSTITUTIONS",
  "VIVEKANANDHA EDUCATIONAL INSTITUTIONS"
];

const DEFAULT_IMAGES = {
  Meals: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b0?auto=format&fit=crop&q=80&w=500',
  Chinese: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=500',
  Coolers: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=500',
  Snacks: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=500'
};

// Markup for base price (student_price + 30)

export const MOCK_PRODUCTS: Product[] = [
  // Dosas (Meals)
  { id: 'd1', name: 'Plain Dosa', description: 'Traditional crispy rice crepe.', category: 'Meals', sub_category: 'Dosas', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'd2', name: 'Masala Dosa', description: 'Dosa with spiced potato filling.', category: 'Meals', sub_category: 'Dosas', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'd3', name: 'Onion Dosa', description: 'Crispy dosa with onion toppings.', category: 'Meals', sub_category: 'Dosas', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'd4', name: 'Kal Dosa', description: 'Soft and thick dosa.', category: 'Meals', sub_category: 'Dosas', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'd5', name: 'Plain Roast', description: 'Paper thin crispy roast.', category: 'Meals', sub_category: 'Dosas', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'd6', name: 'Salem Dosai', description: 'Specially flavored dosa.', category: 'Meals', sub_category: 'Dosas', student_price: 100, base_price: 130, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'd7', name: 'Podi Roast', description: 'Dosa topped with spicy podi.', category: 'Meals', sub_category: 'Dosas', student_price: 110, base_price: 140, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: true, prep_time: 15 },
  { id: 'd8', name: 'Ghee Roast', description: 'Fragrant ghee-flavored dosa.', category: 'Meals', sub_category: 'Dosas', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'd9', name: 'Onion Roast', description: 'Crispy roast with golden onions.', category: 'Meals', sub_category: 'Dosas', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'd10', name: 'Uthappam (Plain)', description: 'Classic soft uthappam.', category: 'Meals', sub_category: 'Dosas', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Idly (Meals)
  { id: 'i1', name: 'Idli', description: 'Steamed rice and lentil cakes.', category: 'Meals', sub_category: 'Idly', student_price: 40, base_price: 70, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'i2', name: 'Idli Ghee Podi', description: 'Idli with ghee and spicy podi.', category: 'Meals', sub_category: 'Idly', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: true, prep_time: 15 },
  { id: 'i3', name: 'Chilly Idli', description: 'Spicy stir-fried idli.', category: 'Meals', sub_category: 'Idly', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: true, prep_time: 15 },
  { id: 'i4', name: 'Mini Sambar Idli', description: 'Small idli soaked in delicious sambar.', category: 'Meals', sub_category: 'Idly', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Fried Rice (Chinese)
  { id: 'fr1', name: 'Veg Fried Rice', description: 'Aromatic rice with fresh vegetables.', category: 'Chinese', sub_category: 'Fried Rice', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'fr2', name: 'Mushroom Fried Rice', description: 'Rice with perfectly sautéed mushrooms.', category: 'Chinese', sub_category: 'Fried Rice', student_price: 140, base_price: 170, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'fr3', name: 'Paneer Fried Rice', description: 'Rice with soft paneer cubes.', category: 'Chinese', sub_category: 'Fried Rice', student_price: 140, base_price: 170, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'fr4', name: 'Babycorn Fried Rice', description: 'Rice with crunchy babycorn.', category: 'Chinese', sub_category: 'Fried Rice', student_price: 140, base_price: 170, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'fr5', name: 'Gobi Fried Rice', description: 'Rice with spicy gobi manchurian.', category: 'Chinese', sub_category: 'Fried Rice', student_price: 150, base_price: 180, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: true, prep_time: 15 },

  // Noodles (Chinese)
  { id: 'n1', name: 'Veg Noodles', description: 'Classic stir-fried noodles.', category: 'Chinese', sub_category: 'Noodles', student_price: 130, base_price: 160, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'n2', name: 'Mushroom Noodles', description: 'Noodles with fresh mushrooms.', category: 'Chinese', sub_category: 'Noodles', student_price: 150, base_price: 180, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'n3', name: 'Paneer Noodles', description: 'Noodles with soft paneer.', category: 'Chinese', sub_category: 'Noodles', student_price: 150, base_price: 180, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'n4', name: 'Babycorn Noodles', description: 'Noodles with crispy babycorn.', category: 'Chinese', sub_category: 'Noodles', student_price: 150, base_price: 180, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Milkshakes (Coolers)
  { id: 'ms1', name: 'Vanilla Milkshake', description: 'Creamy vanilla bliss.', category: 'Coolers', sub_category: 'Milkshakes', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ms2', name: 'Strawberry Milkshake', description: 'Fresh strawberry delight.', category: 'Coolers', sub_category: 'Milkshakes', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ms3', name: 'Chocolate Milkshake', description: 'Rich chocolate indulgence.', category: 'Coolers', sub_category: 'Milkshakes', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'ms4', name: 'Banana Milkshake', description: 'Healthy and creamy banana shake.', category: 'Coolers', sub_category: 'Milkshakes', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ms5', name: 'Apple Milkshake', description: 'Nutritious apple shake.', category: 'Coolers', sub_category: 'Milkshakes', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ms6', name: 'Mango Milkshake', description: 'Summer favorite mango shake.', category: 'Coolers', sub_category: 'Milkshakes', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },

  // Mojitos (Coolers)
  { id: 'mj1', name: 'Lime Mojito (Mint)', description: 'Refreshing mint and lime mix.', category: 'Coolers', sub_category: 'Mojitos', student_price: 40, base_price: 70, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'mj2', name: 'Blue Morraco Mojito', description: 'Exotic blue mojito.', category: 'Coolers', sub_category: 'Mojitos', student_price: 40, base_price: 70, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'mj3', name: 'Watermelon Mojito', description: 'Cool watermelon flavor.', category: 'Coolers', sub_category: 'Mojitos', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Fast Food & Snacks (Snacks)
  { id: 'ff1', name: 'Fried Momos', description: 'Crispy fried veg momos.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: true, prep_time: 15 },
  { id: 'ff2', name: 'French Fries', description: 'Golden crispy fries.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'ff3', name: 'Cheese Corn Nuggets', description: 'Gooey cheese and corn inside.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ff4', name: 'Veg Sandwich', description: 'Classic grilled veg sandwich.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ff5', name: 'Veg Burger', description: 'Tasty veg patty burger.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'ff6', name: 'Assorted Bajji', description: 'Typical Indian street snack.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 35, base_price: 65, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ff7', name: 'Palooda', description: 'Rich and creamy dessert drink.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'ff8', name: 'Sambar Vadai', description: 'Vadai soaked in hot sambar.', category: 'Snacks', sub_category: 'Fast Food & Snacks', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Snacks, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Meals & Rice Bowls (Meals)
  { id: 'm1', name: 'Normal Meals', description: 'Standard South Indian meals.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 130, base_price: 160, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'm2', name: 'Special Meals', description: 'Full grand South Indian meals.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 180, base_price: 210, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'm3', name: 'Sambar Rice', description: 'Comforting sambar rice bowl.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'm4', name: 'Tomato Rice', description: 'Tangy tomato rice.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'm5', name: 'Lemon Rice', description: 'Zesty lemon rice bowl.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'm6', name: 'Curd Rice', description: 'Soothing curd rice bowl.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'm7', name: 'Veg Pulav', description: 'Mild and aromatic veg pulav.', category: 'Meals', sub_category: 'Meals & Rice Bowls', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Indian Breads (Meals)
  { id: 'b1', name: 'Chappatis (2)', description: 'Soft wheat chappatis.', category: 'Meals', sub_category: 'Indian Breads', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'b2', name: 'Parota (2)', description: 'Flaky layered parotas.', category: 'Meals', sub_category: 'Indian Breads', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'b3', name: 'Parota Kothu', description: 'Minced parota with spices.', category: 'Meals', sub_category: 'Indian Breads', student_price: 100, base_price: 130, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: true, prep_time: 15 },
  { id: 'b4', name: 'Butter Naan', description: 'Naan topped with melting butter.', category: 'Meals', sub_category: 'Indian Breads', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'b5', name: 'Garlic Naan', description: 'Naan with garlic infusion.', category: 'Meals', sub_category: 'Indian Breads', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'b6', name: 'Tandoori Parota', description: 'Parota baked in tandoor.', category: 'Meals', sub_category: 'Indian Breads', student_price: 50, base_price: 80, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'b7', name: 'Paneer Stuffed Kulcha', description: 'Kulcha filled with soft paneer.', category: 'Meals', sub_category: 'Indian Breads', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'b8', name: 'Poori', description: 'Deep fried puffed poori.', category: 'Meals', sub_category: 'Indian Breads', student_price: 60, base_price: 90, image_url: DEFAULT_IMAGES.Meals, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Starters & Gravies (Chinese)
  { id: 'sg1', name: 'Paneer Butter Masala', description: 'Creamy paneer in tomato gravy.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 150, base_price: 180, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'sg2', name: 'Kadai Paneer', description: 'Paneer cooked with bell peppers.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 150, base_price: 180, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: true, prep_time: 15 },
  { id: 'sg3', name: 'Mushroom Masala', description: 'Mushroom in flavorful gravy.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 120, base_price: 150, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'sg4', name: 'Gobi Manchurian', description: 'Spicy and tangy cauliflower balls.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 140, base_price: 170, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: true, prep_time: 15 },
  { id: 'sg5', name: 'Paneer 65', description: 'Crispy fried spicy paneer.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 140, base_price: 170, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: true, prep_time: 15 },
  { id: 'sg6', name: 'Mushroom 65', description: 'Crispy fried spicy mushroom.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 140, base_price: 170, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: true, prep_time: 15 },
  { id: 'sg7', name: 'Channa Masala', description: 'Chickpeas in spicy gravy.', category: 'Chinese', sub_category: 'Starters & Gravies', student_price: 90, base_price: 120, image_url: DEFAULT_IMAGES.Chinese, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },

  // Fresh Juices (Coolers)
  { id: 'j1', name: 'Pomegranate Juice', description: 'Pure fresh pomegranate juice.', category: 'Coolers', sub_category: 'Fresh Juices', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'j2', name: 'Apple Juice', description: 'Pure fresh apple juice.', category: 'Coolers', sub_category: 'Fresh Juices', student_price: 80, base_price: 110, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'j3', name: 'ABC Juice', description: 'Apple, Beetroot, Carrot mix.', category: 'Coolers', sub_category: 'Fresh Juices', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
  { id: 'j4', name: 'Sweetlime (Mosambi)', description: 'Refreshing sweetlime juice.', category: 'Coolers', sub_category: 'Fresh Juices', student_price: 70, base_price: 100, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: false, spicy: false, prep_time: 15 },
  { id: 'j5', name: 'Watermelon Juice', description: 'Fresh watermelon hydration.', category: 'Coolers', sub_category: 'Fresh Juices', student_price: 40, base_price: 70, image_url: DEFAULT_IMAGES.Coolers, is_available: true, rating: 4.5, reviews: 10, is_veg: true, bestseller: true, spicy: false, prep_time: 15 },
];
