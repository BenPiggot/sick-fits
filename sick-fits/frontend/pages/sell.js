import React from 'react';
import CreateItems from '../components/CreateItems';
import PleaseSignin from '../components/PleaseSignin';

const Sell = props => {
  return (
    <div>
      <PleaseSignin>
        <CreateItems />
      </PleaseSignin>
    </div>
  )
}

export default Sell;
