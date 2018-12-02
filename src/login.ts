import { ApolloError, ApolloServer, IResolverObject, IResolvers, ValidationError } from 'apollo-server-express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import uuid from 'uuid'
import { SECRET } from './config'
import firestore from './firestore'
import { typeDefs } from './typeDefs'
import { User } from './types'

const resolvers: IResolvers = {
    Query: {
        login: async (_: null, { username, password }: { username: string; password: string }) => {
            try {
                const userDoc = await firestore
                    .collection('users')
                    .where('username', '==', username)
                    .get()
                const users = userDoc.docs.map((user) => user.data() as User)
                if (users.length > 0) {
                    const user = users[0]
                    const match = await bcrypt.compare(password, user.password)
                    if (match) {
                        return {
                            token: jwt.sign({}, SECRET),
                            userId: user.id
                        }
                    } else {
                        return new ValidationError(`Invalid password for user ${username}`)
                    }
                } else {
                    return new ValidationError(`User ${username} not found`)
                }
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    } as IResolverObject,
    Mutation: {
        addUser: async (_: null, { name, username, password }: { name: string; username: string; password: string }) => {
            try {
                const saltRounds = 10
                const hashedPassword = await bcrypt.hash(password, saltRounds)
                const id = uuid.v4()
                await firestore
                    .collection('users')
                    .doc(id)
                    .set({ id, name, username, password: hashedPassword })
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
