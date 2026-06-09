import * as React from 'react';
import { cn, formatDate, formatCurrency } from '@/utils';
import { useUIStore, useUserStore } from '@/store';
import { Asset } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import {
  MapPin,
  User,
  Calendar,
  Eye,
  Edit,
  HandCoins,
  MoreHorizontal,
} from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  className?: string;
  style?: React.CSSProperties;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, className, style }) => {
  const { openAssetDetail, openBorrowModal, openAssetForm } = useUIStore();
  const { currentUser } = useUserStore();
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canBorrow = asset.status === 'available';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div
      className={cn(
        'group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1',
        className
      )}
      style={style}
    >
      <div className="relative h-40 bg-gradient-to-br from-dark-100 to-dark-50 overflow-hidden">
        <img
          src={asset.imageUrl}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute top-3 left-3">
          <StatusBadge type="asset" status={asset.status} size="sm" />
        </div>
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors text-dark-600"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg border border-dark-100 shadow-lg py-1 z-10 animate-fade-in">
              <button
                onClick={() => {
                  openAssetDetail(asset.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-dark-700 hover:bg-dark-50 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                查看详情
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    openAssetForm(asset.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-dark-700 hover:bg-dark-50 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  编辑资产
                </button>
              )}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
          <p className="text-xs text-white/80">{asset.assetNo}</p>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-dark-800 truncate">{asset.name}</h3>
        <p className="text-xs text-dark-500 mt-1">{asset.categoryName}</p>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{asset.location}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{asset.managerName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(asset.purchaseDate, 'yyyy/MM')}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-dark-100 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-700">{formatCurrency(asset.purchasePrice)}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => openAssetDetail(asset.id)}
            >
              详情
            </Button>
            {canBorrow && (
              <Button
                size="sm"
                variant="primary"
                icon={<HandCoins className="w-4 h-4" />}
                onClick={() => openBorrowModal(asset.id)}
              >
                借用
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
