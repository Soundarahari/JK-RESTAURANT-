import { Product } from '../data/mock';
import { useNavigate } from 'react-router-dom';

export const VariantCard = ({ group }: { group: Product[] }) => {
  const navigate = useNavigate();
  
  // Base details from the first item
  const representative = group[0];
  const title = representative.sub_category; 
  const image = representative.image_url;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden flex flex-col mb-4 border border-gray-100 dark:border-gray-800 transition-colors relative cursor-pointer active:scale-[0.98] transform duration-150" onClick={() => navigate(`/category/${title}`)}>
      <div className="h-44 w-full relative">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-3 text-white font-black text-xl">{title}</div>
      </div>
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 font-medium bg-gray-50 dark:bg-gray-800 p-2 rounded">{group.length} Types Available</p>
        
        <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800 dark:text-white">Explore all variants</span>
            </div>
            
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/category/${title}`);
                }}
                className="bg-brand-50 text-brand-600 font-bold border border-brand-200 px-5 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm uppercase tracking-wider dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-400"
            >
                SEE ALL
            </button>
        </div>
      </div>
    </div>
  );
};
