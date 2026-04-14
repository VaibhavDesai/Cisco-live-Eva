import { useState, useRef, useEffect, useCallback } from 'react'
import Icon from './Icon'

const PRODUCTS = [
  { id: 'ai-agent-studio', name: 'AI Agent Studio', icon: 'bot-bold' },
  { id: 'cx-desktop', name: 'CX Desktop', icon: 'headset-bold' },
]

/**
 * Compact product switcher: shows the current product and opens a listbox of fixed options
 * (`AI Agent Studio`, `CX Desktop`); closes on outside click.
 *
 * @param {Object} props
 * @param {string} [props.value] Selected product id (`'ai-agent-studio'` | `'cx-desktop'`); falls back visually to the first product when unknown.
 * @param {(id: string) => void} [props.onChange] Called with the chosen product id when the user selects an item.
 * @example
 * <ProductSelector value={productId} onChange={setProductId} />
 */
export default function ProductSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = PRODUCTS.find((p) => p.id === value) || PRODUCTS[0]

  const handleToggle = useCallback(() => setOpen((prev) => !prev), [])
  const handleSelect = useCallback(
    (id) => {
      onChange?.(id)
      setOpen(false)
    },
    [onChange],
  )

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="product-selector" ref={ref}>
      <button
        type="button"
        className={`product-selector__trigger ${open ? 'open' : ''}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Product: ${selected.name}`}
      >
        <Icon name={selected.icon} size={16} />
        <span className="product-selector__label">{selected.name}</span>
        <Icon name="arrow-down-bold" size={12} />
      </button>

      {open && (
        <ul className="product-selector__menu" role="listbox">
          {PRODUCTS.map((product) => (
            <li
              key={product.id}
              className={`product-selector__item ${product.id === value ? 'selected' : ''}`}
              role="option"
              aria-selected={product.id === value}
              onClick={() => handleSelect(product.id)}
            >
              <Icon name={product.icon} size={16} />
              <span>{product.name}</span>
              {product.id === value && <Icon name="check-bold" size={14} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
