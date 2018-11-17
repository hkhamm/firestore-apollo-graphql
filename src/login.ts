import { ApolloServer, ValidationError, IResolvers, ApolloError, IResolverObject } from 'apollo-server-express'
import jwt from 'jsonwebtoken'
import { SECRET } from './config'
import firestore from './firestore'
import bcrypt from 'bcrypt'
import { User } from './types'
import { typeDefs } from './typeDefs'
import uuid from 'uuid'

const resolvers: IResolvers = {
    Query: {
        login: async (_: null, { email, password }: { email: string; password: string }) => {
            try {
                const userDoc = await firestore
                    .collection('users')
                    .where('email', '==', email)
                    .get()
                const users = userDoc.docs.map((user) => user.data() as User)
                if (users.length > 0) {
                    const match = await bcrypt.compare(password, users[0].password)
                    if (match) {
                        return {
                            token: jwt.sign({}, SECRET)
                        }
                    } else {
                        return new ValidationError(`Invalid password for user ${email}`)
                    }
                } else {
                    return new ValidationError(`User ${email} not found`)
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject,
    Mutation: {
        addUser: async (_: null, { name, email, password }: { name: string; email: string; password: string }) => {
            try {
                const saltRounds = 10
                const hashedPassword = await bcrypt.hash(password, saltRounds)
                const id = uuid.v4()
                await firestore
                    .collection('users')
                    .doc(id)
                    .set({ id, name, email, password: hashedPassword })
                const userDoc = await firestore.doc(`users/${id}`).get()
                const user = userDoc.data() as User | undefined
                return user || new ValidationError('Failed to retrieve added user')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject
}

const login = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
})

export default login
