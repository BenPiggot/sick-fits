import React, { Component } from 'react'
import { Mutation } from 'react-apollo';
import styled from 'styled-components';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: none;
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`

const REMOVE_FROM_CART_MUTATION = gql`
  mutation removeFromCart($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`

class RemoveFromCart extends Component {
  update = (cache, payload) => {
    // first read cache
    const data = cache.readQuery({
      query: CURRENT_USER_QUERY
    })
    // remove item from cart
    const cartItemId = payload.data.removeFromCart.id;
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId)
    // write back to the cart
    cache.writeQuery({ query: CURRENT_USER_QUERY, data })
  }
  render() {
    return (
      <Mutation 
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{id: this.props.id }}
        update={this.update}
        optimisticResponse={{
          __typename: 'Mutation',
          removeFromCart: {
            __typename: 'CartItem',
            id: this.props.id
          }
        }}
      >
        {(removeFromCart, { loading, error }) => (
          <BigButton 
            title="Delete Item" 
            onClick={() => {
              removeFromCart().catch(err => alert(err.message))
            }}
          >
            &times;
          </BigButton>
        )}
      </Mutation>
    )
  }
}

export default RemoveFromCart;
