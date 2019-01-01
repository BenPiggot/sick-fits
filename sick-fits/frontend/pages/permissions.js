import React from 'react';
import PleaseSignin from '../components/PleaseSignin';
import Permissions from '../components/Permissions';

const PermissionsPage = props => {
  return (
    <div>
      <PleaseSignin>
        <p>Permissions!</p>
        <Permissions />
      </PleaseSignin>
    </div>
  )
}

export default PermissionsPage;
