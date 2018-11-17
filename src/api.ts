import {
    ApolloServer,
    ApolloError,
    ValidationError,
    IResolvers,
    AuthenticationError,
    IResolverObject
} from 'apollo-server-express'
import firestore from './firestore'
import jwt from 'jsonwebtoken'
import { SECRET } from './config'
import uuid from 'uuid'
import { Message, User } from './types'
import { typeDefs } from './typeDefs'

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
                const userDoc = await firestore
                    .collection('users')
                    .where('email', '==', email)
                    .get()
                const users = userDoc.docs.map((user) => user.data() as User)
                return users[0] || new ValidationError(`User with email ${email} not found`)
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject,
    Mutation: {
        addMessage: async (_: null, { text, userId }: { text: string; userId: string }) => {
            try {
                const id = uuid.v4()
                await firestore
                    .collection('messages')
                    .doc(id)
                    .set({ id, text, userId })
                const messageDoc = await firestore.doc(`messages/${id}`).get()
                const message = messageDoc.data() as Message | undefined
                return message || new ValidationError('Failed to retrieve added message')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject,
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
    context: async ({ req }: { req: { headers: { authorization: string } } }) => {
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
