import React, {
  lazy,
  Suspense,
  useCallback,
  useState,
  useEffect
} from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import {
  Auth0Provider,
  useAuth0
} from '@auth0/auth0-react';
import ApolloClient from 'apollo-boost';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch
} from 'react-router-dom';
import './App.css';
import AppShell from './AppShell';
import { FetchProvider } from './context/FetchContext';
import logo from './images/logo.png';
import FourOFour from './pages/FourOFour';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Account = lazy(() => import('./pages/Account'));
const Settings = lazy(() => import('./pages/Settings'));
const Users = lazy(() => import('./pages/Users'));

const LoadingFallback = () => (
  <AppShell>
    <div className="p-4">Loading...</div>
  </AppShell>
);

const UnauthenticatedRoutes = () => (
  <Switch>
    <Route path="/login">
      <Login />
    </Route>
    <Route path="/signup">
      <Signup />
    </Route>
    <Route exact path="/">
      <Home />
    </Route>
    <Route path="*">
      <FourOFour />
    </Route>
  </Switch>
);

const AuthenticatedRoute = ({ children, ...rest }) => {
  const { isAuthenticated, user } = useAuth0();

  console.log(user);
  return (
    <Route
      {...rest}
      render={() =>
        isAuthenticated ? (
          <AppShell>{children}</AppShell>
        ) : (
          <Redirect to="/" />
        )
      }
    ></Route>
  );
};

const AdminRoute = ({ children, ...rest }) => {
  const { user, isAuthenticated } = useAuth0();
  const roles =
    user[`${process.env.REACT_APP_JWT_NAMESPACE}/roles`];
  const isAdmin = roles[0] === 'admin' ? true : false;
  return (
    <Route
      {...rest}
      render={() =>
        isAuthenticated && isAdmin ? (
          <AppShell>{children}</AppShell>
        ) : (
          <Redirect to="/" />
        )
      }
    ></Route>
  );
};

const LoadingLogo = () => {
  return (
    <div className="self-center">
      <img className="w-32" src={logo} alt="logo" />
    </div>
  );
};

const AppRoutes = () => {
  const { isLoading } = useAuth0();
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center">
        <LoadingLogo />
      </div>
    );
  }
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <AuthenticatedRoute path="/dashboard">
            <Dashboard />
          </AuthenticatedRoute>
          <AdminRoute path="/inventory">
            <Inventory />
          </AdminRoute>
          <AuthenticatedRoute path="/account">
            <Account />
          </AuthenticatedRoute>
          <AuthenticatedRoute path="/settings">
            <Settings />
          </AuthenticatedRoute>
          <AuthenticatedRoute path="/users">
            <Users />
          </AuthenticatedRoute>
          <UnauthenticatedRoutes />
        </Switch>
      </Suspense>
    </>
  );
};

const AppRoot = () => {
  const [accessToken, setAccessToken] = useState();
  const {
    getAccessTokenSilently,
    loginWithRedirect
  } = useAuth0();

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      setAccessToken(token);
    } catch (err) {
      loginWithRedirect();
    }
  }, [getAccessTokenSilently, loginWithRedirect]);

  useEffect(() => {
    getAccessToken();
  }, [getAccessToken]);

  if (!accessToken) {
    return (
      <div className="h-screen flex justify-center">
        <LoadingLogo />
      </div>
    );
  }

  return (
    <ApolloProvider
      client={
        new ApolloClient({
          uri: process.env.REACT_APP_GRAPHQL_URI,
          request: async (operation) => {
            if (accessToken) {
              operation.setContext({
                headers: {
                  Authorization: `Bearer ${accessToken}`
                }
              });
            }
          }
        })
      }
    >
      <Router>
        <FetchProvider>
          <div className="bg-gray-100">
            <AppRoutes />
          </div>
        </FetchProvider>
      </Router>
    </ApolloProvider>
  );
};

const requestedScopes = [
  'read:dashboard',
  'read:inventory',
  'write:inventory',
  'edit:inventory',
  'delete:inventory',
  'read:users',
  'read:user',
  'edit:user'
];

function App() {
  return (
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={`${window.location.origin}/dashboard`}
      audience={process.env.REACT_APP_AUTH0_AUDIENCE}
      scope={requestedScopes.join(' ')}
    >
      <AppRoot />
    </Auth0Provider>
  );
}

export default App;
