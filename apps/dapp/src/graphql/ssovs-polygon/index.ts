import { graphql } from 'gql/ssovs-polygon';

export const getSsovUserDataDocument = graphql(`
  query getSsovUserData($user: ID!) {
    users(where: { id: $user }) {
      id
      userPositions {
        id
        epoch
        strike
        amount
      }
      userSSOVDeposit {
        id
        transaction {
          id
        }
        user {
          id
        }
        sender
        epoch
        strike
        amount
        ssov {
          id
        }
      }
      userSSOVOptionPurchases {
        id
        transaction {
          id
        }
        epoch
        strike
        user {
          id
        }
        sender
        amount
        fee
        premium
        ssov {
          id
        }
      }
    }
  }
`);
