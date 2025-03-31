import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Album, Track } from '@shared/schema';

interface CartItem {
  id: number;
  type: 'track' | 'album';
  title: string;
  artistName: string;
  price: number;
  coverImage: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  addTrack: (track: Track) => void;
  addAlbum: (album: Album) => void;
  removeItem: (id: number, type: 'track' | 'album') => void;
  clearCart: () => void;
}

// Helper function to get stored cart data if it exists
const getInitialState = (): { items: CartItem[], totalAmount: number } => {
  // Only run in the browser environment
  if (typeof window !== 'undefined') {
    try {
      const storedCart = localStorage.getItem('harmonia-cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        return {
          items: parsedCart.items || [],
          totalAmount: parsedCart.totalAmount || 0
        };
      }
    } catch (error) {
      console.error('Error loading cart data from localStorage:', error);
    }
  }
  return { items: [], totalAmount: 0 };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: getInitialState().items,
      totalAmount: getInitialState().totalAmount,
      
      addTrack: (track) => {
        if (!track.purchaseAvailable || !track.purchasePrice) return;
        
        const item: CartItem = {
          id: track.id,
          type: 'track',
          title: track.title,
          artistName: track.artistName,
          price: track.purchasePrice,
          coverImage: '', // Should be fetched from the album or track details
        };
        
        set((state) => {
          // Check if item already exists
          if (state.items.some(i => i.id === item.id && i.type === 'track')) {
            return state;
          }
          
          const newItems = [...state.items, item];
          const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
          
          return {
            items: newItems,
            totalAmount: newTotal
          };
        });
      },
      
      addAlbum: (album) => {
        // Should check if album is purchasable and has a price
        // For simplicity, we're calculating a dummy price
        const dummyAlbumPrice = 999; // $9.99
        
        const item: CartItem = {
          id: album.id,
          type: 'album',
          title: album.title,
          artistName: album.artistName,
          price: dummyAlbumPrice,
          coverImage: album.coverImage,
        };
        
        set((state) => {
          // Check if item already exists
          if (state.items.some(i => i.id === item.id && i.type === 'album')) {
            return state;
          }
          
          const newItems = [...state.items, item];
          const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
          
          return {
            items: newItems,
            totalAmount: newTotal
          };
        });
      },
      
      removeItem: (id, type) => {
        set((state) => {
          const newItems = state.items.filter(item => !(item.id === id && item.type === type));
          const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
          
          return {
            items: newItems,
            totalAmount: newTotal
          };
        });
      },
      
      clearCart: () => set({ items: [], totalAmount: 0 })
    }),
    {
      name: 'harmonia-cart', // unique name for localStorage
      partialize: (state) => ({ items: state.items, totalAmount: state.totalAmount })
    }
  )
);
