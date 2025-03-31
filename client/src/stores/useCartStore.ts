import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track, Album } from '@shared/schema';

export type CartItemType = 'track' | 'album';

export interface CartItem {
  id: number;
  title: string;
  artistName: string;
  coverImage?: string;
  price: number;
  type: CartItemType;
}

interface CartStore {
  items: CartItem[];
  totalAmount: number;
  addItem: (item: CartItem) => void;
  addTrack: (track: Track) => void;
  addAlbum: (album: Album) => void;
  removeItem: (id: number, type: CartItemType) => void;
  updateQuantity: (id: number, type: CartItemType, quantity: number) => void;
  clearCart: () => void;
  isItemInCart: (id: number, type: CartItemType) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,
      
      addItem: (item: CartItem) => {
        if (get().isItemInCart(item.id, item.type)) {
          return; // Item already in cart
        }
        
        set((state) => {
          const updatedItems = [...state.items, item];
          const newTotalAmount = calculateTotal(updatedItems);
          
          return {
            items: updatedItems,
            totalAmount: newTotalAmount,
          };
        });
      },
      
      addTrack: (track) => {
        if (!track.purchaseAvailable || track.purchasePrice === undefined) {
          console.warn('Attempted to add a track that is not available for purchase');
          return;
        }
        
        const trackItem: CartItem = {
          id: track.id,
          title: track.title,
          artistName: track.artistName,
          // No coverImage property in Track, so we don't set it
          price: track.purchasePrice,
          type: 'track'
        };
        
        get().addItem(trackItem);
      },
      
      addAlbum: (album) => {
        // For this example, we'll calculate album price as sum of available track prices
        // or use a default price if no tracks are available
        let albumPrice = 9.99; // Default album price
        
        if (album.tracks && album.tracks.length > 0) {
          const trackPrices = album.tracks
            .filter((track: Track) => track.purchaseAvailable && track.purchasePrice !== undefined)
            .map((track: Track) => track.purchasePrice || 0);
            
          if (trackPrices.length > 0) {
            // Apply a discount for buying the whole album
            albumPrice = trackPrices.reduce((sum: number, price: number) => sum + price, 0) * 0.8;
          }
        }
        
        const albumItem: CartItem = {
          id: album.id,
          title: album.title,
          artistName: album.artistName,
          coverImage: album.coverImage,
          price: albumPrice,
          type: 'album'
        };
        
        get().addItem(albumItem);
      },
      
      removeItem: (id: number, type: CartItemType) => {
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => !(item.id === id && item.type === type)
          );
          const newTotalAmount = calculateTotal(updatedItems);
          
          return {
            items: updatedItems,
            totalAmount: newTotalAmount,
          };
        });
      },
      
      updateQuantity: (id: number, type: CartItemType, quantity: number) => {
        set((state) => {
          const updatedItems = state.items.map((item) => {
            if (item.id === id && item.type === type) {
              return { ...item };
            }
            return item;
          });
          
          const newTotalAmount = calculateTotal(updatedItems);
          
          return {
            items: updatedItems,
            totalAmount: newTotalAmount,
          };
        });
      },
      
      clearCart: () => {
        set({
          items: [],
          totalAmount: 0,
        });
      },
      
      isItemInCart: (id: number, type: CartItemType) => {
        return get().items.some((item) => item.id === id && item.type === type);
      },
    }),
    {
      name: 'harmonia-cart',
    }
  )
);

// Helper function to calculate the total amount
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price, 0);
};