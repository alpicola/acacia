import {Observable} from "rx";
import {hJSX} from "@cycle/dom";

// Just mocked
function view(state$) {
  return state$.map(state => {
    return (
      <div className="searchbox">
        <input type="text" placeholder="Search"></input>
      </div>
    );
  })
}

export default function SearchBox({DOM, props$}) {
  let state$ = Observable.just();
  let vtree$ = view(state$);

  return {DOM: vtree$};
}
