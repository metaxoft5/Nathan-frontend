'use client'
import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useOrdersStore } from '@/store/ordersStore';
import Image from 'next/image';

// Reusable Badge component
const Badge = ({ children, color = "#FF5D39", className = "" }: { children: React.ReactNode, color?: string, className?: string }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${className}`}
    style={{ background: color, color: color === "#FF5D39" ? "white" : "black" }}
  >
    {children}
  </span>
);

// Reusable Card component
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl shadow-lg bg-white border-2 border-[#F1A900] p-6 ${className}`}>
    {children}
  </div>
);

// Define a type for the order item
type OrderItem = {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  total: number;
};

type ProductRef = {
  id?: string;
  name?: string | null;
  imageUrl?: string | null;
  sku?: string | null;
};

type BackendOrderItem = OrderItem & { product?: ProductRef };

// Reusable OrderItemCard
type DisplayOrderItem = OrderItem & { product?: ProductRef };
const OrderItemCard = ({ item }: { item: DisplayOrderItem }) => (
  <div className="flex items-center gap-4 bg-[#FFF7F4] rounded-lg p-3 border border-[#FF5D39]">
    {item.imageUrl ? (
      <Image
        src={item.imageUrl}
        alt={item.productName || item.product?.name || 'Product'}
        width={64}
        height={64}
        className="w-16 h-16 object-cover rounded-lg border-2 border-[#F1A900]"
      />
    ) : (
      <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-[#F1A900]" />
    )}
    <div className="flex-1">
      <div className="font-bold text-black">{item.productName || item.product?.name || 'Product'}</div>
      {item.product?.sku && (
        <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
      )}
      <div className="text-sm text-[#FF5D39] font-semibold">{item.quantity} × ${item.price.toFixed(2)}</div>
    </div>
    <div className="text-lg font-bold text-[#F1A900]">${item.total.toFixed(2)}</div>
  </div>
);

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params?.id[0] : '';
  const { order, loading, error, fetchOrderById, clearOrder } = useOrdersStore();

  // Authentication check
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
      return;
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (id && user) fetchOrderById(id).catch(() => {});
    return () => clearOrder();
  }, [id, fetchOrderById, clearOrder, user]);

  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5D39] mx-auto mb-4"></div>
          <p className="text-black text-lg">Loading order...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#FF5D39] border-b-4 " />
        <span className="ml-4 text-black font-semibold text-lg">Loading...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Badge color="#FF5D39" className="text-base">{error}</Badge>
      </div>
    );
  if (!order)
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Badge color="#F1A900" className="text-base">Order not found.</Badge>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <h1 className="text-3xl font-extrabold text-[#FF5D39] tracking-tight">
            Order <span className="text-black">#{order.id?.slice(0, 8) || 'Unknown'}</span>
          </h1>
          <div className="flex gap-2">
            <Badge color="#FF5D39">{order.status}</Badge>
            <Badge color="#F1A900">{order.paymentStatus}</Badge>
          </div>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-black">Total</span>
          <span className="text-2xl font-bold text-[#F1A900]">${order.total.toFixed(2)}</span>
        </div>
        <div className="text-sm text-gray-600 mb-4">Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown date'}</div>
        {order.orderNotes && (
          <div className="mb-4">
            <span className="font-semibold text-black">Notes: </span>
            <span className="text-[#FF5D39]">{order.orderNotes}</span>
          </div>
        )}
        <div>
          <div className="text-lg font-bold text-black mb-2">Items</div>
          <div className="space-y-3">
            {order.orderItems?.map((it) => {
              const item = it as BackendOrderItem;
              const derivedImage = item.imageUrl || item.product?.imageUrl || undefined;
              const derivedName = item.productName || item.product?.name || 'Product';
              return (
                <OrderItemCard
                  key={item.id}
                  item={{
                    ...item,
                    productName: derivedName,
                    imageUrl: derivedImage,
                    total: item.quantity * item.price,
                  }}
                />
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderDetailPage;