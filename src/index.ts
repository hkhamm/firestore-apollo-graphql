import * as admin from 'firebase-admin'
import { ApolloServer, ApolloError, ValidationError, gql, IResolvers } from 'apollo-server'
import { DocumentNode } from 'graphql'

const serviceAccount = require('../service-account.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

interface User {
    id: string
    name: string
    screenName: string
    statusesCount: number
}

interface Tweet {
    id: string
    likes: number
    text: string
    userId: string
}

const typeDefs: DocumentNode = gql`
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
`

const resolvers: IResolvers = {
    Query: {
        async tweets() {
            const tweets = await firestore.collection('tweets').get()
            return tweets.docs.map((tweet) => tweet.data()) as Tweet[]
        },
        async user(_: null, args: { id: string }) {
            try {
                const userDoc = await firestore.doc(`users/${args.id}`).get()
                const user = userDoc.data() as User | undefined
                return user || new ValidationError('User ID not found')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    User: {
        async tweets(user) {
            try {
                const userTweets = await firestore
                    .collection('tweets')
                    .where('userId', '==', user.id)
                    .get()
                return userTweets.docs.map((tweet) => tweet.data()) as Tweet[]
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    Tweets: {
        async user(tweet) {
            try {
                const tweetAuthor = await firestore.doc(`users/${tweet.userId}`).get()
                return tweetAuthor.data() as User
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    // engine: {
    //     apiKey: '<APOLLO ENGINE API KEY HERE>'
    // },
    introspection: true
})

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`)
})
