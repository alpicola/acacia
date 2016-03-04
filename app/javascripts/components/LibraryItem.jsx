import {Observable} from "rx";
import {hJSX} from "@cycle/dom";

function view(props$) {
  return props$.map(props => {
    let item = props;
    return (
      <div className="library-item">
        <div className="library-item-info">
          {renderAuthors(item.authors)}
          <div className="library-item-title-meta library-item-info-row">
            <span className="library-item-title">{item.title}</span>
            <span className="library-item-meta">{item.venue} ({item.year})</span>
          </div>
        </div>
      </div>
    );
  });
}

function renderAuthors(authors) {
  if (authors.length > 0) {
    let vtrees = [];
    vtrees.push(renderAuthor(authors[0]));
    for (let i = 1; i < authors.length; i++) {
      vtrees.push(<span className="delimiter">,</span>, renderAuthor(authors[i]));
    }
    vtrees.push(<span>:</span>)
    return (
      <div className="library-item-authors library-item-info-row">
        {vtrees}
      </div>
    );
  } else {
    return (
      <noscript></noscript>
    );
  }
}

function renderAuthor(author) {
  return (
    <span className="library-item-author">{author}</span>
  );
}

export default function LibraryItem({DOM, props$}) {
  let vtree$ = view(props$);
  let action$ = Observable.empty();

  return {DOM: vtree$, action$};
}
