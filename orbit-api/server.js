require('dotenv').config();
const jwtDecode = require('jwt-decode');
const jwksClient = require('jwks-rsa');
const { applyMiddleware } = require('graphql-middleware');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dashboardData = require('./data/dashboard');
const User = require('./data/User');
const InventoryItem = require('./data/InventoryItem');

const {
  ApolloServer,
  gql,
  ApolloError,
  AuthenticationError,
  UserInputError
} = require('apollo-server');

const { makeExecutableSchema } = require('graphql-tools');
const { rule, shield } = require('graphql-shield');

const {
  createToken,
  hashPassword,
  verifyPassword
} = require('./util');

const checkUserRole = (user, allowableRoles) => {
  if (!user || !allowableRoles.includes(user.role)) {
    throw new AuthenticationError('Not authorized');
  }
  return true;
};

const resolvers = {
  Query: {
    dashboardData: (parent, args, context) => {
      // checkUserRole(context.user, ['user', 'admin']);
      return dashboardData;
    },
    users: async (parent, args, context) => {
      // checkUserRole(context.user, ['admin']);
      try {
        return await User.find()
          .lean()
          .select('_id firstName lastName avatar bio');
      } catch (err) {
        return err;
      }
    },
    user: async (parent, args, context) => {
      // checkUserRole(context.user, ['user', 'admin']);
      try {
        const { userId } = context;
        return await User.findOne({ _id: userId })
          .lean()
          .select('_id firstName lastName role avatar bio');
      } catch (err) {
        return err;
      }
    },
    inventoryItems: async (parent, args, context) => {
      // checkUserRole(context.user, ['admin']);
      try {
        const { userId } = context;
        return await InventoryItem.find({
          user: userId
        });
      } catch (err) {
        return err;
      }
    },
    userBio: async (parent, args, context) => {
      // checkUserRole(context.user, ['user', 'admin']);
      try {
        const { userId } = context;
        const foundUser = await User.findOne({
          _id: userId
        })
          .lean()
          .select('bio');

        return { bio: foundUser.bio };
      } catch (err) {
        return err;
      }
    }
  },
  Mutation: {
    login: async (parent, args) => {
      try {
        const { email, password } = args;

        const user = await User.findOne({
          email
        }).lean();

        if (!user) {
          throw new UserInputError(
            'Wrong email or password'
          );
        }

        const passwordValid = await verifyPassword(
          password,
          user.password
        );

        if (passwordValid) {
          const { password, bio, ...rest } = user;
          const userInfo = Object.assign({}, { ...rest });

          const token = createToken(userInfo);

          const decodedToken = jwtDecode(token);
          const expiresAt = decodedToken.exp;

          return {
            message: 'Authentication successful!',
            token,
            userInfo,
            expiresAt
          };
        } else {
          throw new UserInputError(
            'Wrong email or password'
          );
        }
      } catch (err) {
        return err;
      }
    },
    signup: async (parent, args) => {
      try {
        const {
          firstName,
          lastName,
          email,
          password
        } = args;

        const hashedPassword = await hashPassword(password);

        const userData = {
          email: email.toLowerCase(),
          firstName,
          lastName,
          password: hashedPassword,
          role: 'admin'
        };

        const existingEmail = await User.findOne({
          email: userData.email
        }).lean();

        if (existingEmail) {
          throw new ApolloError('Email already exists');
        }

        const newUser = new User(userData);
        const savedUser = await newUser.save();

        if (savedUser) {
          const token = createToken(savedUser);
          const decodedToken = jwtDecode(token);
          const expiresAt = decodedToken.exp;

          const {
            _id,
            firstName,
            lastName,
            email,
            role
          } = savedUser;

          const userInfo = {
            _id,
            firstName,
            lastName,
            email,
            role
          };

          return {
            message: 'User created!',
            token,
            userInfo,
            expiresAt
          };
        } else {
          throw new ApolloError(
            'There was a problem creating your account'
          );
        }
      } catch (err) {
        return err;
      }
    },
    addInventoryItem: async (parent, args, context) => {
      // checkUserRole(context.user, ['admin']);
      try {
        const { userId } = context;
        const input = Object.assign({}, args, {
          user: userId
        });
        const inventoryItem = new InventoryItem(input);
        const inventoryItemResult = await inventoryItem.save();
        return {
          message: 'Invetory item created!',
          inventoryItem: inventoryItemResult
        };
      } catch (err) {
        return err;
      }
    },
    deleteInventoryItem: async (parent, args, context) => {
      // checkUserRole(context.user, ['admin']);
      try {
        const { userId } = context;
        const { id } = args;
        const deletedItem = await InventoryItem.findOneAndDelete(
          { _id: id, user: userId }
        );
        return {
          message: 'Inventory item deleted!',
          inventoryItem: deletedItem
        };
      } catch (err) {
        return err;
      }
    },
    updateUserRole: async (parent, args, context) => {
      // checkUserRole(context.user, ['user', 'admin']);
      try {
        const { userId } = context;
        const { role } = args;
        const allowedRoles = ['user', 'admin'];

        if (!allowedRoles.includes(role)) {
          throw new ApolloError('Invalid user role');
        }
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { role }
        );
        return {
          message:
            'User role updated. You must log in again for the changes to take effect.',
          user: updatedUser
        };
      } catch (err) {
        return err;
      }
    },
    updateUserBio: async (parent, args, context) => {
      // checkUserRole(context.user, ['user', 'admin']);
      try {
        const { userId } = context;
        const { bio } = args;
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: userId
          },
          {
            bio
          },
          {
            new: true
          }
        );

        return {
          message: 'Bio updated!',
          userBio: {
            bio: updatedUser.bio
          }
        };
      } catch (err) {
        return err;
      }
    }
  }
};

const typeDefs = gql`
  type Sale {
    date: String!
    amount: Int!
  }

  type DashboardData {
    salesVolume: Int!
    newCustomers: Int!
    refunds: Int!
    graphData: [Sale!]!
  }

  type User {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: String!
    avatar: String
    bio: String
  }

  type InventoryItem {
    _id: ID!
    user: String!
    name: String!
    itemNumber: String!
    unitPrice: String!
    image: String!
  }

  type AuthenticationResult {
    message: String!
    userInfo: User!
    token: String!
    expiresAt: String!
  }

  type InventoryItemResult {
    message: String!
    inventoryItem: InventoryItem
  }

  type UserUpdateResult {
    message: String!
    user: User!
  }

  type UserBioUpdateResult {
    message: String!
    userBio: UserBio!
  }

  type UserBio {
    bio: String!
  }

  type Query {
    dashboardData: DashboardData
    users: [User]
    user: User
    inventoryItems: [InventoryItem]
    userBio: UserBio
  }

  type Mutation {
    login(
      email: String!
      password: String!
    ): AuthenticationResult
    signup(
      firstName: String!
      lastName: String!
      email: String!
      password: String!
    ): AuthenticationResult
    addInventoryItem(
      name: String!
      itemNumber: String!
      unitPrice: Float!
    ): InventoryItemResult
    deleteInventoryItem(id: ID!): InventoryItemResult
    updateUserRole(role: String!): UserUpdateResult
    updateUserBio(bio: String!): UserBioUpdateResult
  }
`;

const isAuthenticated = rule()(
  async (parent, args, ctx) => {
    console.log('the user', ctx.user);
    return ctx.user !== null;
  }
);

const hasScope = (requiredScope) =>
  rule()(async (parent, args, ctx) => {
    try {
      const userScopes = ctx.user.scope.split(' ');
      console.log(
        'has scope',
        userScopes.includes(requiredScope)
      );

      return userScopes.includes(requiredScope);
    } catch (err) {
      console.log('the err', err);
    }
  });

const permissions = shield({
  Query: {
    dashboardData: isAuthenticated,
    inventoryItems: hasScope('read:inventory'),
    users: hasScope('read:users'),
    user: hasScope('read:user'),
    userBio: hasScope('edit:user')
  },
  Mutation: {
    addInventoryItem: hasScope('write:inventory'),
    deleteInventoryItem: hasScope('delete:inventory'),
    updateUserRole: hasScope('edit:user'),
    updateUserBio: hasScope('edit:user')
  }
});

const schema = applyMiddleware(
  makeExecutableSchema({
    typeDefs,
    resolvers
  }),
  permissions
);

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (error, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schema,
  context: async ({ req }) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return { user: null };
      }

      const authResult = new Promise((resolve, reject) => {
        jwt.verify(
          token.slice(7),
          getKey,
          {
            audience: process.env.API_IDENTIFIER,
            issuer: `https://${process.env.AUTH0_DOMAIN}/`,
            algorithms: ['RS256']
          },
          (error, decoded) => {
            if (error) {
              reject({ error });
            }
            if (decoded) {
              resolve(decoded);
            }
          }
        );
      });

      const decoded = await authResult;

      return {
        user: decoded,
        userId:
          decoded[`${process.env.AUTH0_JWT_NAMESPACE}/sub`]
      };
    } catch (err) {
      console.log(err);
      return { user: null };
    }
  }
});

async function connect() {
  try {
    mongoose.Promise = global.Promise;
    await mongoose.connect(process.env.ATLAS_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
  } catch (err) {
    console.log('Mongoose error', err);
  }
  server.listen(3001).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
}

connect();
