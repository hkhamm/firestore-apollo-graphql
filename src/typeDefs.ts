import { DocumentNode } from 'graphql'
import { gql } from 'apollo-server-express'

export const typeDefs: DocumentNode = gql`
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

    type Token {
        token: String!
    }

    type Query {
        messages: [Message]
        user(id: String!): User
        userByEmail(email: String!): User
        login(email: String!, password: String!): Token
    }

    type Mutation {
        addUser(name: String!, email: String!, password: String!): User
        addMessage(text: String!, userId: String!): Message
    }
`
