import {Observable} from "rx";
import {hJSX} from "@cycle/dom";

function action(DOM) {
  let plusButton = DOM.select('.glyphicon-plus');
  let add$ = plusButton.events('click');
  return {add$};
}

// Just mocked
function view(state$) {
  return state$.map(state => {
    return (
      <div className="toolbar">
        <span className="toolbar-button"><i className="glyphicon glyphicon-plus"></i></span>
        <span className="toolbar-button"><i className="glyphicon glyphicon-minus"></i></span>
      </div>
    );
  });
}

export default function Toolbar({DOM, props$}) {
  let actions = action(DOM);
  let state$ = Observable.just();
  let vtree$ = view(state$);
  let action$ = actions.add$.map(_ => ({type: 'add'}));

  return {DOM: vtree$, action$};
}
