import { ApolloServer, ApolloError, ValidationError, gql, IResolvers, AuthenticationError } from 'apollo-server-express'
import { DocumentNode } from 'graphql'
import firestore from './firestore'
import * as jwt from 'jsonwebtoken'
import { SECRET } from './config'

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
        tweets: [Tweet]!
    }

    # A Tweet Object
    type Tweet {
        id: ID!
        text: String!
        userId: String!
        user: User!
        likes: Int!
    }

    type Token {
        token: String!
    }

    type Query {
        tweets: [Tweet]
        user(id: String!): User
    }

    type Mutation {
        addUser(id: String!, name: String!, screenName: String!): User
        addTweet(id: ID!, text: String!, userId: String!): Tweet
    }
`

const resolvers: IResolvers = {
    Query: {
        tweets: async () => {
            const tweets = await firestore.collection('tweets').get()
            return tweets.docs.map((tweet) => tweet.data()) as Tweet[]
        },
        user: async (_: null, { id }: { id: string }) => {
            try {
                const userDoc = await firestore.doc(`users/${id}`).get()
                const user = userDoc.data() as User | undefined
                return user || new ValidationError('User ID not found')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    Mutation: {
        addUser: async (_: null, { id, name, screenName }: { id: string; name: string; screenName: string }) => {
            try {
                await firestore
                    .collection('users')
                    .doc(id)
                    .set({ id, name, screenName, statusesCount: 0 })
                const userDoc = await firestore.doc(`users/${id}`).get()
                const user = userDoc.data() as User | undefined
                return user || new ValidationError('User ID not found')
            } catch (error) {
                throw new ApolloError(error)
            }
        },
        addTweet: async (_: null, { id, text, userId }: { id: string; text: string; userId: string }) => {
            try {
                await firestore
                    .collection('tweets')
                    .doc(id)
                    .set({ id, text, userId, likes: 0 })
                const tweetDoc = await firestore.doc(`tweets/${id}`).get()
                const tweet = tweetDoc.data() as Tweet | undefined
                return tweet || new ValidationError('Tweet not found')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    User: {
        tweets: async (user: User) => {
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
    Tweet: {
        user: async (tweet: Tweet) => {
            try {
                const tweetAuthor = await firestore.doc(`users/${tweet.userId}`).get()
                return tweetAuthor.data() as User
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    }
}

export const api = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    context: async ({ req }) => {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization
            const decoded = jwt.verify(token, SECRET)
            if (decoded) {
                return
            } else {
                throw new AuthenticationError('Unauthorized - the JWT token is invalid')
            }
        } else {
            throw new AuthenticationError('Unauthorized - you must log in first')
        }
    }
})

export default api
