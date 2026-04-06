
import { Product } from '../data/mock';
import { useStore } from '../store';
import { Plus, Minus, X } from 'lucide-react';

export const VariantModal = ({ group, onClose }: { group: Product[], onClose: () => void }) => {
  const { user, cart, addToCart, removeFromCart, updateQuantity } = useStore();
  const isStudentVerified = user?.is_student;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm transition-opacity p-4 sm:p-0">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-2xl overflow-hidden shadow-2xl slide-up">
        {/* Header Image */}
        <div className="h-40 relative">
          <img src={group[0].image_url} alt={group[0].sub_category} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 top-0 p-4 flex justify-end bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={onClose} className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-md transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-2xl font-black text-white">{group[0].sub_category} Variants</h2>
          </div>
        </div>

        {/* Variants List */}
        <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
          {group.map((product) => {
            const cartItem = cart.find(item => item.id === product.id);
            
            return (
              <div key={product.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {product.is_veg && (
                      <div className="border border-green-600 p-0.5 rounded-sm flex items-center justify-center bg-white w-3 h-3">
                        <div className="bg-green-600 rounded-full w-1.5 h-1.5"></div>
                      </div>
                    )}
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{product.name}</h4>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`font-black ${isStudentVerified ? 'text-brand-600 dark:text-brand-400' : 'text-gray-800 dark:text-white'}`}>
                      ₹{isStudentVerified ? product.student_price : product.base_price}
                    </span>
                    {isStudentVerified && (
                      <span className="text-xs text-gray-400 line-through">₹{product.base_price}</span>
                    )}
                  </div>
                </div>

                {/* Add to Cart logic */}
                <div className="flex-shrink-0 w-24 flex justify-end">
                  {cartItem ? (
                     <div className="flex items-center bg-brand-50 dark:bg-brand-900/40 rounded-lg border border-brand-200 dark:border-brand-800 w-full h-9">
                       <button onClick={() => cartItem.quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, cartItem.quantity - 1)} className="p-1 flex-1 flex justify-center text-brand-600"><Minus size={14}/></button>
                       <span className="w-6 text-center text-sm font-bold text-brand-700 dark:text-brand-300">{cartItem.quantity}</span>
                       <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="p-1 flex-1 flex justify-center text-brand-600"><Plus size={14}/></button>
                     </div>
                  ) : (
                    <button onClick={() => addToCart(product)} className="border-2 border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-400 text-xs font-black uppercase px-6 py-2 rounded-lg hover:bg-brand-100 transition-colors w-full">
                      ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
