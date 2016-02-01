import Cycle from "@cycle/core";
import {makeDOMDriver} from "@cycle/dom";
import Main from './components/Main.jsx';

Cycle.run(Main, {
  DOM: makeDOMDriver(document.body)
});
