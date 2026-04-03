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
}

export const COLLEGES = [
  "JKKN EDUCATIONAL INSTITUTIONS",
  "SSM EDUCATIONAL INSTITUTIONS",
  "EXCEL EDUCATIONAL INSTITUTIONS",
  "JKKM EDUCATIONAL INSTITUTIONS",
  "VIVEKANANDHA EDUCATIONAL INSTITUTIONS"
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy curry made with paneer, spices, onions, tomatoes, and butter.',
    category: 'Fast Food',
    sub_category: 'Rolls',
    base_price: 90,
    student_price: 180,
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true,
    rating: 4.8,
    reviews: 245,
    is_veg: true,
    bestseller: true,
    spicy: false,
  },
  {
    id: 'p2',
    name: 'Veg Veggie Burger',
    description: 'Crispy veg patty with fresh lettuce, tomatoes, and our special sauce.',
    category: 'Fast Food',
    sub_category: 'Burgers',
    base_price: 150,
    student_price: 120,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true,
    rating: 4.2,
    reviews: 89,
    is_veg: true,
    bestseller: false,
    spicy: false,
  },
  {
    id: 'p3',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe stuffed with spiced potato filling, served with chutney and sambar.',
    category: 'Meals',
    sub_category: 'Breakfast',
    base_price: 70,
    student_price: 80,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true,
    rating: 4.6,
    reviews: 512,
    is_veg: true,
    bestseller: true,
    spicy: true,
  },
  {
    id: 'p4',
    name: 'Spicy Veg Biryani',
    description: 'Aromatic basmati rice cooked with mixed vegetables and special fiery biryani spices.',
    category: 'Meals',
    sub_category: 'Combo',
    base_price: 150,
    student_price: 150,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true,
    rating: 4.3,
    reviews: 167,
    is_veg: true,
    bestseller: false,
    spicy: true,
  },
  {
    id: 'p5',
    name: 'Mango Lassi',
    description: 'Refreshing yogurt-based drink with sweet mango pulp.',
    category: 'Fast Food',
    sub_category: 'Burgers',
    base_price: 80,
    student_price: 60,
    image_url: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    is_available: true,
    rating: 4.9,
    reviews: 890,
    is_veg: true,
    bestseller: true,
    spicy: false,
  }
];
