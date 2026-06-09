import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset, AssetCategory, AssetFilters, AssetStatus } from '@/types';
import { assets as mockAssets, categories as mockCategories } from '@/data/mockData';

interface AssetState {
  assets: Asset[];
  categories: AssetCategory[];
  loading: boolean;
  fetchAssets: (filters?: AssetFilters) => Promise<Asset[]>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAssetById: (id: string) => Asset | undefined;
  updateAssetStatus: (id: string, status: AssetStatus) => void;
}

const generateId = () => `ast-${Date.now().toString().slice(-6)}`;

export const useAssetStore = create<AssetState>()(
  persist(
    (set, get) => ({
      assets: mockAssets,
      categories: mockCategories,
      loading: false,

      fetchAssets: async (filters) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 200));
        
        let result = [...get().assets];
        
        if (filters?.keyword) {
          const keyword = filters.keyword.toLowerCase();
          result = result.filter(
            a => a.name.toLowerCase().includes(keyword) ||
                 a.assetNo.toLowerCase().includes(keyword) ||
                 a.managerName.toLowerCase().includes(keyword)
          );
        }
        
        if (filters?.categoryId) {
          result = result.filter(a => a.categoryId === filters.categoryId);
        }
        
        if (filters?.status) {
          result = result.filter(a => a.status === filters.status);
        }
        
        if (filters?.location) {
          result = result.filter(a => a.location.includes(filters.location!));
        }
        
        set({ loading: false });
        return result;
      },

      addAsset: (assetData) => {
        const now = new Date().toISOString();
        const newAsset: Asset = {
          ...assetData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set(state => ({ assets: [newAsset, ...state.assets] }));
      },

      updateAsset: (id, assetData) => {
        set(state => ({
          assets: state.assets.map(a =>
            a.id === id ? { ...a, ...assetData, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      deleteAsset: (id) => {
        set(state => ({
          assets: state.assets.filter(a => a.id !== id),
        }));
      },

      getAssetById: (id) => {
        return get().assets.find(a => a.id === id);
      },

      updateAssetStatus: (id, status) => {
        get().updateAsset(id, { status });
      },
    }),
    {
      name: 'asset-management-assets',
    }
  )
);
