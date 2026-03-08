import { create } from "zustand";
import type { ClothingItem, User } from "@/db/schema";

export type PopulatedOutfit = {
  id: string;
  userId: string;
  explanation: string;
  outfit_description?: string;
  modelImageUrl?: string | null;
  items: ClothingItem[];
  createdAt: string;
};

type AppStore = {
  user: User | null;
  setUser: (user: User | null) => void;

  wardrobeItems: ClothingItem[];
  setWardrobeItems: (items: ClothingItem[]) => void;
  addWardrobeItem: (item: ClothingItem) => void;
  removeWardrobeItem: (id: string) => void;

  outfits: PopulatedOutfit[];
  setOutfits: (outfits: PopulatedOutfit[]) => void;

  processingItemIds: string[];
  addProcessingItem: (id: string) => void;
  removeProcessingItem: (id: string) => void;

  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  activeStatus: "owned" | "wishlisted" | null;
  setActiveStatus: (status: "owned" | "wishlisted" | null) => void;

  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
};

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  wardrobeItems: [],
  setWardrobeItems: (items) => set({ wardrobeItems: items }),
  addWardrobeItem: (item) =>
    set((state) => ({ wardrobeItems: [item, ...state.wardrobeItems] })),
  removeWardrobeItem: (id) =>
    set((state) => ({
      wardrobeItems: state.wardrobeItems.filter((i) => i.id !== id),
    })),

  outfits: [],
  setOutfits: (outfits) => set({ outfits }),

  processingItemIds: [],
  addProcessingItem: (id) =>
    set((state) => ({ processingItemIds: [...state.processingItemIds, id] })),
  removeProcessingItem: (id) =>
    set((state) => ({
      processingItemIds: state.processingItemIds.filter((i) => i !== id),
    })),

  activeCategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),
  activeStatus: null,
  setActiveStatus: (status) => set({ activeStatus: status }),

  showOnboarding: false,
  setShowOnboarding: (val) => set({ showOnboarding: val }),
}));
