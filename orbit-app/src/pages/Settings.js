import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { Field, Form, Formik } from 'formik';
import GradientButton from '../components/common/GradientButton';
import PageTitle from '../components/common/PageTitle';
import Card from './../components/common/Card';
import FormError from './../components/FormError';
import FormSuccess from './../components/FormSuccess';

const USER = gql`
  {
    user {
      _id
      firstName
      lastName
      role
      avatar
      bio
    }
  }
`;

const UPDATE_USER_BIO = gql`
  mutation UpdateUserBio($bio: String!) {
    updateUserBio(bio: $bio) {
      message
      userBio {
        bio
      }
    }
  }
`;

const Settings = () => {
  const { data } = useQuery(USER);

  const [
    updateUserBio,
    { error, data: mutationData }
  ] = useMutation(UPDATE_USER_BIO);

  return (
    <>
      <PageTitle title="Settings" />
      <Card>
        <h2 className="font-bold mb-2">
          Fill Out Your Bio
        </h2>
        {mutationData && (
          <FormSuccess
            text={mutationData.updateUserBio.message}
          />
        )}
        {error && <FormError text={error.message} />}
        {data && (
          <Formik
            initialValues={{
              bio: data && data.user ? data.user.bio : ''
            }}
            onSubmit={(values) =>
              updateUserBio({ variables: { ...values } })
            }
            enableReinitialize={true}
          >
            {() => (
              <Form>
                <Field
                  className="border border-gray-300 rounded p-1 w-full h-56 mb-2"
                  component="textarea"
                  name="bio"
                  placeholder="Your bio here"
                />
                <GradientButton text="Save" type="submit" />
              </Form>
            )}
          </Formik>
        )}
      </Card>
    </>
  );
};

export default Settings;
