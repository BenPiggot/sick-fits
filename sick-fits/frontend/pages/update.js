import React from 'react';
import Link from 'next/link';
import UpdateItem from '../components/UpdateItem';

const Sell = props => {
  return (
    <div>
      <UpdateItem id={props.query.id} />
    </div>
  )
}

export default Sell;
