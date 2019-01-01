import React from 'react';
import { Query } from 'react-apollo';
import { PropTypes } from "prop-types";
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Table from './styles/Table';
import SickButton from './styles/SickButton';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE'
]

const ALL_USERS_QUERY = gql`
  query {
    users {
      id 
      name
      email
      permissions
    }
  }
`;

const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({data, loading, error}) => (
      <div>
        <Error error={error} />
        <h2>Manage Permissions</h2>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>  
              { possiblePermissions.map(p => <th key={p}>{p}</th>)}
              <th>👇</th>
            </tr>
          </thead>
          <tbody>
            { data.users.map(user => {
              return (
                <UserPermissions key={user.id} user={user} />
              )
            })}
          </tbody>
        </Table>
      </div>
    )}
  </Query>
)

class UserPermissions extends React.Component {
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array
    }).isRequired
  }

  state = {
    permissions: this.props.user.permissions
  }

  handleChange = e => {
    const checkBox = e.target
    let updatedPermissions = [...this.state.permissions];
    if (checkBox.checked) {
      updatedPermissions.push(checkBox.value)
      this.setState({
        permissions: updatedPermissions
      })
    }
    else {
      this.setState({
        permissions: updatedPermissions.filter(permission => permission !== checkBox.value)
      })
    }
  }

  render() {
    const { user } = this.props;
    return (
      <tr>
        <td>{user.name}</td>
        <td>{user.email}</td>
        {possiblePermissions.map(permission => {
          return (
            <td key={`${user.id}-permission-${permission}`}>
              <label htmlFor={`${user.id}-permission-${permission}`}>
                <input 
                  type="checkbox" 
                  checked={this.state.permissions.includes(permission)}
                  value={permission}
                  onChange={this.handleChange}
                />
              </label>
            </td>
          )
        })}
        <td>
          <SickButton>Update</SickButton>
        </td>
      </tr>
    )
  }
}

export default Permissions;
