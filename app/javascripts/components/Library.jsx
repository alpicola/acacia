import {Observable, Subject} from "rx";
import {hJSX} from "@cycle/dom";
import isolate from "@cycle/isolate";
import SearchBox from './SearchBox.jsx';
import Toolbar from './Toolbar.jsx';
import VirtualScroll from './VirtualScroll.jsx';
import LibraryItem from './LibraryItem.jsx';
import Dropzone from './Dropzone.jsx';
import Modal from './Modal.jsx';
import ItemForm from './ItemForm.jsx';
import DBLP from '../utils/searchengines/DBLP'
import PDFTextExtractor from '../utils/pdf/PDFTextExtractor'

function intent({toolbarAction$, dropzoneAction$}) {
  let addFile$ = Observable.merge(
    toolbarAction$.filter(e => e.type === 'add').map(_ => []),
    dropzoneAction$.filter(e => e.type === 'drop').pluck('value')
  ).share();
  return {addFile$};
}

function model(actions) {
  let initialState = {items: []};
  let itemsPromise = DBLP.searchPublications('bisimulation');
  return Observable.fromPromise(itemsPromise).map(items => {
    return {items};
  }).startWith(initialState).shareReplay(1);
}

function view(state$, {searchBoxVTree$, toolbarVTree$, listVTree$, dropzoneVTree$, modalVTree$}) {
  return Observable.combineLatest(
    state$, searchBoxVTree$, toolbarVTree$, listVTree$, dropzoneVTree$, modalVTree$,
    (state, searchBoxVTree, toolbarVTree, listVTree, dropzoneVTree, modalVTree) => {
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
          {modalVTree}
        </div>
      );
    }
  );
}

export default function Library({DOM}) {
  let searchBoxProps$ = Observable.just();
  let {DOM: searchBoxVTree$} = SearchBox({DOM, props$: searchBoxProps$});

  let toolbarProps$ = Observable.just();
  let {DOM: toolbarVTree$, action$: toolbarAction$} = Toolbar({DOM, props$: toolbarProps$});

  let dropzoneProps$ = Observable.just({disabled: false});
  let {DOM: dropzoneVTree$, action$: dropzoneAction$} = Dropzone({DOM, props$: dropzoneProps$});

  let listActionProxy$ = new Subject();
  let modalActionProxy$ = new Subject();
  let actions = intent({toolbarAction$, listAction$: listActionProxy$, dropzoneAction$, modalActionProxy$});
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
  let {DOM: listVTree$, action$: listAction$} =
    isolate(VirtualScroll(LibraryItem))({DOM, props$: listProps$});
  listAction$.subscribe(listActionProxy$);

  let formProps$ = actions.addFile$.flatMap(files => {
    if (files.length === 0) {
      return Observable.empty();
    } else {
      let itemPromise = PDFTextExtractor.fromFile(files[0]).then(pdf => {
        return pdf.extractTitle();
      }).then(title => {
        return Promise.resolve({title, file: files[0]});
      });
      return Observable.catch(
        Observable.fromPromise(itemPromise),
        Observable.empty()
      );
    }
  }).map(item => ({preset: item})).share();
  let modalProps$ = formProps$.map(_ => ({open: true}));
  let {DOM: modalVTree$, action$: modalAction$} =
    Modal(ItemForm)({DOM, componentProps$: formProps$, props$: modalProps$});
  modalAction$.subscribe(modalActionProxy$);

  let children = {searchBoxVTree$, toolbarVTree$, listVTree$, dropzoneVTree$, modalVTree$};
  let vtree$ = view(state$, children);

  return {DOM: vtree$};
}
