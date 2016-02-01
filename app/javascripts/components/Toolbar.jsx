import {Observable} from "rx";
import {hJSX} from "@cycle/dom";

// Just mocked
function view(state$) {
  return state$.map(state => {
    return (
      <div className="toolbar">
        <span className="toolbar-button"><i className="glyphicon glyphicon-trash"></i></span>
        <span className="toolbar-button"><i className="glyphicon glyphicon-wrench"></i></span>
      </div>
    );
  });
}

export default function Toolbar({DOM, props$}) {
  let state$ = Observable.just();
  let vtree$ = view(state$);

  return {DOM: vtree$};
}
