import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
   	  return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
	  const stock = await api.get(`/stock/${productId}`);
	  if(stock.data.amount <= 0) {
		  toast.error('Quantidade solicitada fora de estoque');
	   } else {
			const item = cart.find(i => {
				return (i.id === productId);
			})

			if(item) {
				if(item.amount+1 > stock.data.amount) {
					toast.error('Quantidade solicitada fora de estoque');
				} else {
					const n = cart.filter(i => {
						return (i.id !== productId);
					});

					const newCart = [ ...n, {
						id: item.id,
						title: item.title,
						price: item.price,
						image: item.image,
						amount: item.amount + 1,
					} ]

					setCart(newCart);
					localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
				}
			} else {
				api.get(`/products/${productId}`)
				.then(res => res.data)
				.then(res => {
					const newCart = [...cart, {
						id: productId,
						title: res.title,
						price: res.price,
						image: res.image,
						amount: 1,
					}];
					setCart(newCart);
					localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
				})
			}
		}
    } catch {
	  toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
		const found = cart.find(product => {
			return product.id === productId;
		})

		if(found === undefined) {
			toast.error('Erro na remoção do produto');
		} else {
			const n = cart.filter(i => {
				return (i.id !== productId);
			});

			setCart(n);
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(n));
		}
    } catch {
		toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
	if(amount <= 0) {
		return;
	}
	try {
		const stock = await api.get(`/stock/${productId}`);
		const item = cart.find(product => productId === product.id);

		if(item) {
			if(amount > stock.data.amount) {
				toast.error('Quantidade solicitada fora de estoque');
			} else {
				const n = cart.filter(i => {
					return (i.id !== productId);
				});

				const newCart = [ ...n, {
					id: item.id,
					title: item.title,
					price: item.price,
					image: item.image,
					amount: amount,
				} ]

				setCart(newCart);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
			}
		}
	}
	catch {
		toast.error('Erro na alteração de quantidade do produto');
	}
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
