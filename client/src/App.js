import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import Monsters from "./Monsters";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Monsters data={{ monsters: [{ name: "cave rat" }] }} />
      </div>
    );
  }
}

export default App;
