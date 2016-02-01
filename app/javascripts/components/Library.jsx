import {Observable, Subject} from "rx";
import {hJSX} from "@cycle/dom";
import SearchBox from './SearchBox.jsx';
import Toolbar from './Toolbar.jsx';
import VirtualScroll from './VirtualScroll.jsx';
import LibraryItem from './LibraryItem.jsx';
import Dropzone from './Dropzone.jsx';
import DBLP from '../utils/searchengines/DBLP'

// mock
function model(actions) {
  let initialState = {items: []};
  let itemsPromise = DBLP.searchPublications('geometry of interaction');
  return Observable.fromPromise(itemsPromise).map(items => {
    return {items};
  }).startWith(initialState).shareReplay(1);
}

function view(state$, {searchBoxVTree$, toolbarVTree$, listVTree$, dropzoneVTree$}) {
  return Observable.combineLatest(
    state$, searchBoxVTree$, toolbarVTree$, listVTree$, dropzoneVTree$,
    (state, searchBoxVTree, toolbarVTree, listVTree, dropzoneVTree) => {
      return (
        <div className="content library">
          <div className="library-header">
            {searchBoxVTree}
            {toolbarVTree}
          </div>
          <div className="library-content">
            {listVTree}
          </div>
          {dropzoneVTree}
        </div>
      );
    }
  );
}

export default function Library({DOM}) {
  let searchBoxProps$ = Observable.just();
  let {DOM: searchBoxVTree$, actions: searchBoxActions} = SearchBox({DOM, props$: searchBoxProps$});
  let toolbarProps$ = Observable.just();
  let {DOM: toolbarVTree$, actions: toolbarActions} = Toolbar({DOM, props$: toolbarProps$});
  let dropzoneProps$ = Observable.just({disabled: false});
  let {DOM: dropzoneVTree$, actions: dropzoneActions} = Dropzone({DOM, props$: dropzoneProps$});

  let actions = {dropzoneActions};
  let state$ = model(actions);

  let listProps$ = state$.map(state => {
    return {
      viewWidth: '100%',
      viewHeight: '100%',
      rowHeight: 50,
      items: state.items,
      total: state.items.length
    };
  }).shareReplay(1);
  let {DOM: listVTree$, listActions} = VirtualScroll(LibraryItem)({DOM, props$: listProps$});

  let children = {searchBoxVTree$, toolbarVTree$, listVTree$, dropzoneVTree$};
  let vtree$ = view(state$, children);

  return {DOM: vtree$};
}
