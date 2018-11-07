# firebase-firestore-graphql

An example of a [GraphQL](https://graphql.org/) setup with a Firebase Firestore backend. Uses [Apollo Engine/Server 2.0](https://www.apollographql.com/).

## Setup

### Code Setup

```bash
git clone https://github.com/hkhamm/firestore-apollo-graphql.git
cd firestore-apollo-graphql
yarn install
```

### Firebase Setup

#### Service Account

1. If you don't already have a Firebase project, add one in the Firebase console. The Add project dialog also gives you the option to add Firebase to an existing Google Cloud Platform project.
2. Navigate to the Service Accounts tab in your project's settings page.
3. Click the Generate New Private Key button at the bottom of the Firebase Admin SDK section of the Service Accounts tab.

After you click the button, a JSON file containing your service account's credentials will be downloaded. Rename this to `service-account.json` and add it to the top level of the repo (e.g. `/path/to/firebase-firestore-graphql/service-account.json`).

#### Firestore

1. From the Firebase console, create a new Firestore database.
2. Create two collections, one of tweets and one of users. Follow these types:

```typescript
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
```

## Run the server

```bash
yarn serve
```

If you navigate to the URL you shoud be able to see a GraphQL playground where you can query your API.

## Sample query

```graphql
{
  user(id: "1") {
    name
    tweets {
      text
      likes
    }
  }
}
```

## Apollo Engine

[Apollo Engine](https://www.apollographql.com/engine) has features such as caching, tracing, and error logging. First get an [Apollo Engine API key](https://engine.apollographql.com/) then change your Apollo server config to turn on the engine.

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  engine: {
    apiKey: "<APOLLO ENGINE API KEY HERE>"
  },
  introspection: true
});
```

Now when you yarn serve and run some queries you should see some data populate the Apollo Engine dashboard with things like how fast your queries resolved.