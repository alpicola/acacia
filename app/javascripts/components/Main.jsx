import {Observable} from "rx";
import {hJSX} from "@cycle/dom";
import Sidebar from './Sidebar.jsx';
import Library from './Library.jsx';

function view(state$, {sidebarVTree$, contentVTree$}) {
  return Observable.combineLatest(
    sidebarVTree$, contentVTree$,
    (sidebarVTree, contentVTree) => {
      return (
        <div className="main">
          {sidebarVTree}
          {contentVTree}
        </div>
      );
    }
  );
}

export default function Main({DOM}) {
  let state$ = Observable.just();
  let {DOM: sidebarVTree$} = Sidebar({DOM});
  let {DOM: contentVTree$} = Library({DOM});
  let vtree$ = view(state$, {sidebarVTree$, contentVTree$});

  return {DOM: vtree$};
}
