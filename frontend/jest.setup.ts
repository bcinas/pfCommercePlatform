import '@testing-library/jest-dom'
import React from 'react'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image — render as plain img
jest.mock('next/image', () => {
  function MockImage({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
    return React.createElement('img', { src, alt, ...props })
  }
  MockImage.displayName = 'NextImage'
  return MockImage
})

// Mock next/link — render as plain <a>
jest.mock('next/link', () => {
  function MockLink({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode; href: string }) {
    return React.createElement('a', { href, ...props }, children)
  }
  MockLink.displayName = 'NextLink'
  return MockLink
})
