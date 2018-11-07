"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const apollo_server_1 = require("apollo-server");
const serviceAccount = require('../service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();
firestore.settings({ timestampsInSnapshots: true });
const typeDefs = apollo_server_1.gql `
    # A Twitter User
    type User {
        id: ID!
        name: String!
        screenName: String!
        statusesCount: Int!
        tweets: [Tweets]!
    }

    # A Tweet Object
    type Tweets {
        id: ID!
        text: String!
        userId: String!
        user: User!
        likes: Int!
    }

    type Query {
        tweets: [Tweets]
        user(id: String!): User
    }
`;
const resolvers = {
    Query: {
        async tweets() {
            const tweets = await firestore.collection('tweets').get();
            return tweets.docs.map((tweet) => tweet.data());
        },
        async user(_, args) {
            try {
                const userDoc = await firestore.doc(`users/${args.id}`).get();
                const user = userDoc.data();
                return user || new apollo_server_1.ValidationError('User ID not found');
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    },
    User: {
        async tweets(user) {
            try {
                const userTweets = await firestore
                    .collection('tweets')
                    .where('userId', '==', user.id)
                    .get();
                return userTweets.docs.map((tweet) => tweet.data());
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    },
    Tweets: {
        async user(tweet) {
            try {
                const tweetAuthor = await firestore.doc(`users/${tweet.userId}`).get();
                return tweetAuthor.data();
            }
            catch (error) {
                throw new apollo_server_1.ApolloError(error);
            }
        }
    }
};
const server = new apollo_server_1.ApolloServer({
    typeDefs,
    resolvers,
    // engine: {
    //     apiKey: '<APOLLO ENGINE API KEY HERE>'
    // },
    introspection: true
});
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
//# sourceMappingURL=index.js.map