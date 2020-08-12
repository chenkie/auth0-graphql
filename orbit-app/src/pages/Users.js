import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import Card from '../components/common/Card';
import PageTitle from '../components/common/PageTitle';
import defaultAvatar from './../images/defaultAvatar.png';

const UserDetailLabel = ({ text }) => (
  <p className="mt-2 uppercase font-bold text-gray-500 text-xs">
    {text}
  </p>
);

const UserDetail = ({ user }) => (
  <Card>
    <div className="flex">
      <div className="w-24">
        <img
          src={user.avatar || defaultAvatar}
          alt="avatar"
        />
      </div>

      <div>
        <p className="font-bold text-lg">
          {user.firstName} {user.lastName}
        </p>

        <div className="mt-2">
          <UserDetailLabel text="Bio" />
          {user.bio ? (
            <div
              dangerouslySetInnerHTML={{ __html: user.bio }}
            />
          ) : (
            <p className="text-gray-500 italic">
              No bio set
            </p>
          )}
        </div>
      </div>
    </div>
  </Card>
);

const USERS_DATA = gql`
  {
    users {
      _id
      firstName
      lastName
      avatar
      bio
    }
  }
`;

const Users = () => {
  const { loading, error, data } = useQuery(USERS_DATA);

  return (
    <>
      <PageTitle title="Users" />
      <div className="flex flex-col">
        {loading && <p>Loading...</p>}
        {error && <p>Something went wrong</p>}
        {data &&
          data.users.map(user => (
            <div className="m-2" key={user._id}>
              <UserDetail user={user} />
            </div>
          ))}
      </div>
    </>
  );
};

export default Users;
