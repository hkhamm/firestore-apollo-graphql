import { ApolloServer, ValidationError, gql, IResolvers, ApolloError } from 'apollo-server-express'
import { DocumentNode } from 'graphql'
import jwt from 'jsonwebtoken'
import { SECRET } from './config'
import firestore from './firestore'
import bcrypt from 'bcrypt'

const typeDefs: DocumentNode = gql`
    type Token {
        token: String!
    }

    type Query {
        login(email: String!, password: String!): Token
    }
`

const resolvers: IResolvers = {
    Query: {
        login: async (_: null, { email, password }: { email: string, password: string } ) => {
            try {
                const userDoc = await firestore.collection('users').where('email', '==', email).get()
                const users = userDoc.docs.map((user) => user.data() as User)
                if (users.length > 0) {
                    const match = await bcrypt.compare(password, users[0].password)
                    if (match) {
                        return {
                            token: jwt.sign({}, SECRET)
                        }
                    } else {
                        return new ValidationError(`User with email ${email} not found`)
                    }
                } else {
                    return new ValidationError(`User with email ${email} not found`)
                }
            } catch (error) {
                throw new ApolloError(error)
            }
            
        }
    }
}

const login = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
})

export default login
