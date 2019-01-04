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
  render() {
    return (
      <Mutation 
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{id: this.props.id }}
        refetchQueries={[
          { query: CURRENT_USER_QUERY }
        ]}
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
