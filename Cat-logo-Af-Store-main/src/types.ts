export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'feminino' | 'masculino' | 'conjuntos' | 'leggings' | 'tops';
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  sizes: ('P' | 'M' | 'G' | 'GG')[];
  colors?: { name: string; hex: string }[];
  description: string;
  measurements?: string;
  isNew: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  active: boolean;
  gender: 'feminino' | 'masculino' | 'unissex';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AppConfig {
  whatsappNumber: string;
  whatsappMessage: string;
  heroImageUrl?: string;
  heroImageUrls?: string[];
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}
