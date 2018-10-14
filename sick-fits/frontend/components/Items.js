import React from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import styled from 'styled-components';

const ALL_ITEMS_QUERY = gql`
  query ALL_ITEMS_QUERY {
    items {
      id
      title
      price
      description
      image
      largeImage
    }
  }
`;

const Center = styled.div`
  text-align: center;
`;

class Items extends React.Component {
  render() {
    return (
      <Center>
        <p>Items</p>
        <Query query={ALL_ITEMS_QUERY}>
          {
            ({ data, error, loading }) => {
              if (loading) return <p>Loading...</p>
              if (error) return <p>Error: {error.message}</p>
              return <p>I found {data.items.length} items </p>
            }
          }
        </Query>
      </Center>
    )
  }
}

export default Items;
