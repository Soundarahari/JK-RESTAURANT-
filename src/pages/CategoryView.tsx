import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft } from 'lucide-react';

export const CategoryView = () => {
  const { subCategoryId } = useParams<{ subCategoryId: string }>();
  const navigate = useNavigate();
  const { products } = useStore();

  const categoryProducts = useMemo(() => {
    return products.filter(p => p.sub_category === subCategoryId);
  }, [products, subCategoryId]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-4 py-4 sticky top-0 z-20 shadow-sm flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
        </button>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">{subCategoryId} Menu</h1>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Explore all available {subCategoryId?.toLowerCase()} options.</p>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No items found for this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-20">
            {categoryProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
