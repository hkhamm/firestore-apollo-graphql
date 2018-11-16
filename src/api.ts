import { ApolloServer, ApolloError, ValidationError, gql, IResolvers, AuthenticationError } from 'apollo-server-express'
import { DocumentNode } from 'graphql'
import firestore from './firestore'
import jwt from 'jsonwebtoken'
import { SECRET } from './config'
import uuid from 'uuid'
import bcrypt from 'bcrypt'

const typeDefs: DocumentNode = gql`
    type User {
        id: ID!
        name: String!
        email: String!
        password: String!
        messages: [Message]!
    }

    type Message {
        id: ID!
        text: String!
        userId: String!
        user: User!
    }

    type Query {
        messages: [Message]
        user(id: String!): User
        userByEmail(email: String!): User
    }

    type Mutation {
        addUser(id: String!, name: String!): User
        addMessage(id: ID!, text: String!, userId: String!): Message
    }
`

const resolvers: IResolvers = {
    Query: {
        messages: async () => {
            const messages = await firestore.collection('messages').get()
            return messages.docs.map((message) => message.data()) as Message[]
        },
        user: async (_: null, { id }: { id: string }) => {
            try {
                const userDoc = await firestore.doc(`users/${id}`).get()
                const user: User | undefined = userDoc.data() as User | undefined
                return user || new ValidationError(`User with id ${id} not found`)
            } catch (error) {
                throw new ApolloError(error)
            }
        },
        userByEmail: async (_: null, { email }: { email: string }) => {
            try {
                const userDoc = await firestore.collection('users').where('email', '==', email).get()
                const users = userDoc.docs.map((user) => user.data() as User)
                return users[0] || new ValidationError(`User with email ${email} not found`)
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    Mutation: {
        addUser: async (_: null, { name, email, password }: { name: string, email: string, password: string }) => {
            try {
                const saltRounds = 10
                const hashPassword = await bcrypt.hash(password, saltRounds)
                const id = uuid.v4()
                await firestore
                    .collection('users')
                    .doc(id)
                    .set({ id, name, email, password: hashPassword })
                const userDoc = await firestore.doc(`users/${id}`).get()
                const user = userDoc.data() as User | undefined
                return user || new ValidationError('Failed to retrieve added user')
            } catch (error) {
                throw new ApolloError(error)
            }
        },
        addMessage: async (_: null, { id, text, userId }: { id: string; text: string; userId: string }) => {
            try {
                await firestore
                    .collection('messages')
                    .doc(id)
                    .set({ id, text, userId, likes: 0 })
                const messageDoc = await firestore.doc(`messages/${id}`).get()
                const message = messageDoc.data() as Message | undefined
                return message || new ValidationError('Failed to retrieve added message')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    User: {
        messages: async (user: User) => {
            try {
                const userMessages = await firestore
                    .collection('messages')
                    .where('userId', '==', user.id)
                    .get()
                return userMessages.docs.map((message) => message.data()) as Message[]
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    Message: {
        user: async (message: Message) => {
            try {
                const messageAuthor = await firestore.doc(`users/${message.userId}`).get()
                return messageAuthor.data() as User
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
