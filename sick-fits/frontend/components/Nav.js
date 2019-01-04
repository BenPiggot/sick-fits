import React from 'react';
import { Mutation } from 'react-apollo';
import Link from 'next/link';
import NavStyles from './styles/NavStyles';
import User from './User';
import Signout from './Signout'
import { TOGGLE_CART_MUTATION } from './Cart';

const Nav = props => {
  return (
    <User>
    {({data: {me}}) => (
      <NavStyles>
        <Link href="/items">
          <a>Shop</a>
        </Link>
        {me && (
          <>
            <Link href="/orders">
              <a>Orders</a>
            </Link>
            <Link href="/sell">
              <a>Sell</a>
            </Link>
            <Link href="/me">
              <a>Account</a>
            </Link>
            <Signout />
            <Mutation mutation={TOGGLE_CART_MUTATION}>
              {(toggleCart) => (
                <button onClick={() => {
                  console.log('yo', toggleCart); toggleCart()
                }}>
                  My Cart
                </button>
              )}
            </Mutation>
          </>
          )
        }
        {!me && (
          <>
            <Link href="/signup">
              <a>Sign In</a>
            </Link>
          </>
        )
        }
      </NavStyles>
    )}
    </User>
  )
}

export default Nav;