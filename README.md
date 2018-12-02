# firebase-firestore-graphql

An example of a [GraphQL](https://graphql.org/) setup with a Firebase Firestore backend. Uses [Apollo Server 2.0](https://www.apollographql.com/).

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

After you click the button, a JSON file containing your service account's credentials will be downloaded. Rename this to `service-account.json` and add it to src.

#### Firestore

From the Firebase console, create a new Firestore database.

### Authorization Setup

Create a file named `config.ts` and place it in src. Add a line like this, with your own secret that will be used to create the JWTs:
```
export const SECRET = 'sdfasdfasdfafdafdasfs'
```

## Run the server

```bash
yarn start
```

If you navigate to the URL you shoud be able to see a GraphQL playground where you can query your API.

## Sample query

```graphql
{
  user(id: "1sdfjk3s-sdfjk32fdkdjsf-sdfsd") {
    name
    messages {
      text
    }
  }
}
```
