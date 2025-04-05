import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        role
      }
    }
  }
`;
