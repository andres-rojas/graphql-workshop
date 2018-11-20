import React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";

const getMonsters = gql`
  {
    monsters {
      name
    }
  }
`;

const Monsters = () => {
  return (
    <Query query={getMonsters}>
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error :(</p>;

        return (
          <ul>
            {data.monsters.map(({ name }) => {
              return <li>{name}</li>;
            })}
          </ul>
        );
      }}
    </Query>
  );
};

export default Monsters;
