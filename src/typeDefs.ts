import { gql } from 'apollo-server-express'
import { DocumentNode } from 'graphql'

export const typeDefs: DocumentNode = gql`
    type User {
        id: ID!
        name: String!
        username: String!
        password: String!
        messages: Messages!
        moreMessages: Messages!
    }

    type Message {
        id: ID!
        text: String!
        userId: String!
        date: String!
        user: User!
    }

    type Messages {
        cursor: String!
        data: [Message]!
    }

    type Token {
        token: String!
        userId: String!
    }

    type RemoveResponse {
        id: String!
    }

    type Query {
        messages: Messages
        moreMessages(cursor: String!): Messages
        messagesByUserId(id: String!): Messages
        moreMessagesByUserId(id: String!, cursor: String!): Messages
        user(id: String!): User
        userByUsername(username: String!): User
        login(username: String!, password: String!): Token
    }

    type Mutation {
        addUser(name: String!, username: String!, password: String!): User
        addMessage(text: String!, userId: String!): Message
        removeMessage(id: String!): RemoveResponse
    }
`
