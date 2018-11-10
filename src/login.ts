import { ApolloServer, ValidationError, gql, IResolvers } from 'apollo-server-express'
import { DocumentNode } from 'graphql'
import * as jwt from 'jsonwebtoken'
import { SECRET } from './config'

const typeDefs: DocumentNode = gql`
    type Token {
        token: String!
    }

    type Query {
        login(email: String!): Token
    }
`

const resolvers: IResolvers = {
    Query: {
        login: async (_: null, args: { email: string } ) => {
            if (args.email === 'hkhamm@gmail.com') {
                return {
                    token: jwt.sign({}, SECRET)
                }
            } else {
                return new ValidationError('Email not found')
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
