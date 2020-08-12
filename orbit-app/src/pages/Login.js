import React, {
  useContext,
  useState,
  useEffect
} from 'react';
import { useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { Form, Formik } from 'formik';
import { Redirect } from 'react-router-dom';
import * as Yup from 'yup';
import Card from '../components/common/Card';
import GradientButton from '../components/common/GradientButton';
import { AuthContext } from '../context/AuthContext';
import GradientBar from './../components/common/GradientBar';
import Hyperlink from './../components/common/Hyperlink';
import Label from './../components/common/Label';
import FormError from './../components/FormError';
import FormInput from './../components/FormInput';
import FormSuccess from './../components/FormSuccess';
import logo from './../images/logo.png';

const LoginSchema = Yup.object().shape({
  email: Yup.string().required('Email is required'),
  password: Yup.string().required('Password is required')
});

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      message
      userInfo {
        _id
        firstName
        lastName
        email
        role
        avatar
        bio
      }
      token
      expiresAt
    }
  }
`;

const ProcessLogin = ({ loginData }) => {
  const authContext = useContext(AuthContext);
  const [redirectOnLogin, setRedirectOnLogin] = useState(
    false
  );

  useEffect(() => {
    const { login } = loginData;
    authContext.setAuthState(login);
    setRedirectOnLogin(true);
  }, [authContext, loginData]);

  return (
    <>{redirectOnLogin && <Redirect to="/dashboard" />}</>
  );
};

const Login = () => {
  const [login, { loading, error, data }] = useMutation(
    LOGIN
  );

  return (
    <>
      {data && <ProcessLogin loginData={data} />}

      <section className="w-full sm:w-1/2 h-screen m-auto p-8 sm:pt-10">
        <GradientBar />
        <Card>
          <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
              <div>
                <div className="w-32 m-auto mb-6">
                  <img src={logo} alt="Logo" />
                </div>
                <h2 className="mb-2 text-center text-3xl leading-9 font-extrabold text-gray-900">
                  Log in to your account
                </h2>
                <p className="text-gray-600 text-center">
                  Don't have an account?{' '}
                  <Hyperlink
                    to="signup"
                    text="Sign up now"
                  />
                </p>
              </div>
              <Formik
                initialValues={{
                  email: '',
                  password: ''
                }}
                onSubmit={values =>
                  login({
                    variables: { ...values }
                  })
                }
                validationSchema={LoginSchema}
              >
                {() => (
                  <Form className="mt-8">
                    {data && (
                      <FormSuccess
                        text={data.login.message}
                      />
                    )}
                    {error && (
                      <FormError text={error.message} />
                    )}
                    <div>
                      <div className="mb-2">
                        <div className="mb-1">
                          <Label text="Email" />
                        </div>
                        <FormInput
                          ariaLabel="Email"
                          name="email"
                          type="text"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <div className="mb-1">
                          <Label text="Password" />
                        </div>
                        <FormInput
                          ariaLabel="Password"
                          name="password"
                          type="password"
                          placeholder="Password"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-start">
                      <div className="text-sm leading-5">
                        <Hyperlink
                          to="forgot-password"
                          text="Forgot your password?"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <GradientButton
                        type="submit"
                        text="Log In"
                        loading={loading}
                      />
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
};

export default Login;
