// Detección de marca de tarjeta + validación Luhn (espejo del backend).

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'otra'

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function detectCardBrand(numero: string): CardBrand | null {
  const d = onlyDigits(numero)
  if (!d) return null
  if (/^4/.test(d)) return 'visa'
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^(6011|65|64[4-9])/.test(d)) return 'discover'
  if (/^3(0[0-5]|[68])/.test(d)) return 'diners'
  if (/^(35|2131|1800|00622126)/.test(d)) return 'jcb'
  return 'otra'
}

const LENGTHS: Record<CardBrand, number[]> = {
  visa: [13, 16, 19],
  mastercard: [16],
  amex: [15],
  discover: [16, 19],
  diners: [14, 16],
  jcb: [16, 17, 18, 19],
  otra: [12, 13, 14, 15, 16, 17, 18, 19],
}

export function luhnValid(numero: string): boolean {
  const d = onlyDigits(numero)
  if (d.length < 12) return false
  let sum = 0
  let dbl = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }
  return sum % 10 === 0
}

export function isPlausibleCard(numero: string): boolean {
  const d = onlyDigits(numero)
  const brand = detectCardBrand(d) ?? 'otra'
  return (LENGTHS[brand] ?? LENGTHS.otra).includes(d.length) && luhnValid(d)
}

export interface BrandMeta {
  label: string
  gradient: string
  text: string
}

export const BRAND_META: Record<CardBrand, BrandMeta> = {
  visa: { label: 'VISA', gradient: 'from-[#1a1f71] to-[#2f3aa0]', text: 'text-white' },
  mastercard: { label: 'Mastercard', gradient: 'from-[#eb001b] to-[#f79e1b]', text: 'text-white' },
  amex: { label: 'AMEX', gradient: 'from-[#006fcf] to-[#0097e1]', text: 'text-white' },
  discover: { label: 'Discover', gradient: 'from-[#f26722] to-[#ff9600]', text: 'text-white' },
  diners: { label: 'Diners', gradient: 'from-[#004a97] to-[#0072ce]', text: 'text-white' },
  jcb: { label: 'JCB', gradient: 'from-[#0e4c92] to-[#c6093f]', text: 'text-white' },
  otra: { label: 'Tarjeta', gradient: 'from-slate-500 to-slate-700', text: 'text-white' },
}
