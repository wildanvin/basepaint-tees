'use client'

import { useState } from 'react'
import { CheckoutModal } from '@/components/checkout-modal'
import { OrderCountdown } from '@/components/order-countdown'
import {
  formatPrice,
  type DemoProduct,
  type ShirtSize,
} from '@/lib/demo-product'

export function ProductDetails({
  product,
  productEthPrice,
}: {
  product: DemoProduct
  productEthPrice?: string
}) {
  const [selectedSize, setSelectedSize] = useState<ShirtSize>('L')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const price = formatPrice(product.priceCents, product.currency)

  return (
    <aside className='self-start border border-white/15 bg-[#0b0d10] p-6 shadow-[8px_8px_0_#41c7ff] lg:sticky lg:top-6'>
      <p className='font-mono text-sm font-black uppercase tracking-[0.18em] text-[#2563eb]'>
        Today&apos;s mintable tee
      </p>
      <h1 className='mt-4 font-mono text-4xl font-black leading-[1.02] text-white sm:text-5xl'>
        {product.name}
      </h1>
      <p className='mt-4 text-xl text-white/65'>{product.theme}</p>

      <div className='mt-8 flex items-end justify-between gap-4 border-y border-white/10 py-5'>
        <div>
          <p className='font-mono text-xs font-black uppercase tracking-[0.16em] text-[#41c7ff]'>
            Price
          </p>
          <p className='mt-1 font-mono text-3xl font-black text-white'>
            {productEthPrice ? `${productEthPrice} ETH` : price}
          </p>
        </div>
        <div className='text-right'>
          <p className='font-mono text-xs font-black uppercase tracking-[0.16em] text-[#41c7ff]'>
            Color
          </p>
          <p className='mt-1 text-lg font-semibold text-white'>{product.shirtColor}</p>
        </div>
      </div>

      <fieldset className='mt-7'>
        <legend className='font-mono text-xs font-black uppercase tracking-[0.16em] text-white/55'>
          Size
        </legend>
        <div className='mt-3 grid grid-cols-5 gap-2'>
          {product.sizes.map((size) => {
            const isSelected = selectedSize === size

            return (
              <button
                className={`min-h-12 border text-sm font-semibold transition ${
                  isSelected
                    ? 'border-[#41c7ff] bg-[#41c7ff] text-[#050608]'
                    : 'border-white/20 bg-[#050608] text-white hover:border-[#41c7ff]'
                }`}
                key={size}
                onClick={() => setSelectedSize(size)}
                type='button'
              >
                {size}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className='mt-7'>
        <OrderCountdown />
      </div>

      <button
        className='mt-7 flex min-h-14 w-full items-center justify-center border border-[#41c7ff] bg-[#41c7ff] px-5 font-mono text-sm font-black uppercase tracking-[0.16em] text-[#050608] transition hover:bg-white'
        onClick={() => setIsCheckoutOpen(true)}
        type='button'
      >
        Buy
      </button>

      <p className='mt-4 text-sm leading-6 text-white/55'>
        Shipping is calculated before payment. Selected size: {selectedSize}.
      </p>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        selectedSize={selectedSize}
      />
    </aside>
  )
}
