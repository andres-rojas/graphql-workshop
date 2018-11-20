import React from "react";

const Monsters = ({ loading, error, data }) => {
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <ul>
      {data.monsters.map(({ name }) => {
        return <li>{name}</li>;
      })}
    </ul>
  );
};

export default Monsters;
