import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { renderWithRouter } from '~/test/router-utils'

import { EmptyCart } from './empty-cart'

function renderEmptyCart() {
  return renderWithRouter(<EmptyCart />)
}

describe('EmptyCart', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders empty message', async () => {
    // given

    // when
    await renderEmptyCart()

    // then
    expect(screen.getByText('장바구니가 비어있습니다')).toBeInTheDocument()
  })

  test('shows 상품 둘러보기 link that points to root', async () => {
    // given

    // when
    await renderEmptyCart()

    // then
    expect(screen.getByRole('link', { name: '상품 둘러보기' })).toHaveAttribute('href', '/')
  })
})
