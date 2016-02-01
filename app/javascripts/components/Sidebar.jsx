import {Observable} from "rx";
import {hJSX} from "@cycle/dom";

// Just mocked
function view(state$) {
  return state$.map(state => {
    return (
      <div className="sidebar">
        <h1>My Library</h1>
        <ul>
          <li><a className="active" href="/library/"><i className="glyphicon glyphicon-briefcase"></i>All Documents</a></li>
          <li><a href="/library/authors/"><i className="glyphicon glyphicon-education"></i>All Authors</a></li>
        </ul>
        <h1>Database</h1>
        <ul>
          <li><a href="/database/dblp/"><i className="glyphicon glyphicon-globe"></i>DBLP</a></li>
        </ul>
      </div>
    );
  });
}

export default function Sidebar({DOM, props$}) {
  let state$ = Observable.just();
  let vtree$ = view(state$);

  return {DOM: vtree$};
}
