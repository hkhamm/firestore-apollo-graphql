import {
    ApolloError,
    ApolloServer,
    AuthenticationError,
    IResolverObject,
    IResolvers,
    ValidationError
} from 'apollo-server-express'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import uuid from 'uuid'
import { SECRET } from './config'
import firestore from './firestore'
import { typeDefs } from './typeDefs'
import { Message, User } from './types'

const resolvers: IResolvers = {
    Query: {
        messages: async () => {
            const response = await firestore.collection('messages').get()
            const messages = response.docs.map((message) => message.data()) as Message[]
            return {
                data: messages,
                cursor: messages[messages.length - 1].date
            }
        },
        moreMessages: async (_: null, { cursor }: { cursor: string }) => {
            const response = await firestore
                .collection('messages')
                .where('date', '>', cursor)
                .limit(5)
                .get()
            const messages = response.docs.map((message) => message.data()) as Message[]
            return {
                data: messages,
                cursor: messages[messages.length - 1].date
            }
        },
        messagesByUserId: async (_: null, { id }: { id: string }) => {
            const response = await firestore
                .collection('messages')
                .where('userId', '==', id)
                .limit(5)
                .get()
            const data = response.docs.map((message) => message.data()) as Message[]
            const cursor = data[data.length - 1].date ? data[data.length - 1].date : ''
            return {
                data,
                cursor 
            }
        },
        moreMessagesByUserId: async (_: null, { id, cursor }: { id: string; cursor: string }) => {
            const response = await firestore
                .collection('messages')
                .where('date', '>', cursor)
                .where('userId', '==', id)
                .limit(5)
                .get()
            const data = response.docs.map((message) => message.data()) as Message[]
            const newCursor = data[data.length - 1].date ? data[data.length - 1].date : ''
            return {
                data,
                cursor: newCursor
            }
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
        userByUsername: async (_: null, { username }: { username: string }) => {
            try {
                const userDoc = await firestore
                    .collection('users')
                    .where('username', '==', username)
                    .get()
                const users = userDoc.docs.map((user) => user.data() as User)
                return users[0] || new ValidationError(`User with username ${username} not found`)
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject,
    Mutation: {
        addMessage: async (_: null, { text, userId }: { text: string; userId: string }) => {
            try {
                const id = uuid.v4()
                const date = moment().toISOString()
                await firestore
                    .collection('messages')
                    .doc(id)
                    .set({ id, text, userId, date })
                const messageDoc = await firestore.doc(`messages/${id}`).get()
                const message = messageDoc.data() as Message | undefined
                return message || new ValidationError('Failed to retrieve added message')
            } catch (error) {
                throw new ApolloError(error)
            }
        },
        removeMessage: async (_: null, { id }: { id: string }) => {
            try {
                await firestore
                    .collection('messages')
                    .doc(id)
                    .delete()
                return { id }
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
                    .limit(5)
                    .get()
                const messages = userMessages.docs.map((message) => message.data()) as Message[]
                return {
                    data: messages,
                    cursor: messages[messages.length - 1].date
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        },
        moreMessages: async (user: User, cursor: string) => {
            try {
                const response = await firestore
                    .collection('messages')
                    .where('userId', '==', user.id)
                    .where('date', '<', cursor)
                    .limit(5)
                    .get()
                const messages = response.docs.map((message) => message.data()) as Message[]
                return {
                    data: messages,
                    cursor: messages[messages.length - 1].date
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject,
    Message: {
        user: async (message: Message) => {
            try {
                const messageAuthor = await firestore.doc(`users/${message.userId}`).get()
                return messageAuthor.data() as User
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject
}

export const api = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    context: async ({ req }: { req: { headers: { authorization: string } } }) => {
        if (
            req.headers &&
            req.headers.authorization &&
            req.headers.authorization !== '' &&
            req.headers.authorization !== 'null'
        ) {
            const token = req.headers.authorization
            try {
                jwt.verify(token, SECRET)
            } catch (error) {
                throw new AuthenticationError('Unauthorized - the JWT token is invalid')
            }
        } else {
            throw new AuthenticationError('Unauthorized - you must log in first')
        }
    }
})

export default api
