import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import Card from '../components/common/Card';
import PageTitle from '../components/common/PageTitle';

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($role: String!) {
    updateUserRole(role: $role) {
      message
      user {
        _id
        firstName
        lastName
        email
        role
        avatar
        bio
      }
    }
  }
`;

const Account = () => {
  const [updateUserRole, { error, data }] = useMutation(
    UPDATE_USER_ROLE
  );

  return (
    <>
      <PageTitle title="Account" />
      <Card>
        <p className="font-bold">User Role</p>
        <div className="mt-4">
          <p>Select a role for yourself</p>
          <div className="mt-2 flex">
            <select
              defaultValue={'admin'}
              onChange={(e) =>
                updateUserRole({
                  variables: { role: e.target.value }
                })
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {data && (
              <p className="text-green-700 ml-4">
                {data.updateUserRole.message}
              </p>
            )}
            {error && (
              <p className="text-red-500 ml-4">
                {error.message}
              </p>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

export default Account;
