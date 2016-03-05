import {Observable} from "rx";
import {hJSX} from "@cycle/dom";
import classNames from 'classNames';

function intent(DOM) {
  let preventDefault = e => { e.preventDefault() };
  let root = DOM.select(':root');
  let trigger$ = root.events('dragover').do(preventDefault).flatMapLatest(e => {
    return Observable.timer(100).map(_ => false).startWith(true);
  }).startWith(false).distinctUntilChanged().share();
  let dropzone = DOM.select('.dropzone');
  let dragOver$ = Observable.merge(
    dropzone.events('dragover').do(preventDefault).map(e => true),
    dropzone.events('dragleave').map(e => false),
    dropzone.events('drop').do(preventDefault).map(e => false)
  ).startWith(false).distinctUntilChanged().share();
  let drop$ = dropzone.events('drop').map(e => e.dataTransfer.files).share();
  return {trigger$, dragOver$, drop$};
}

function model(props$, actions) {
  let initialState = {active: false};
  return Observable.combineLatest(
    props$, actions.trigger$, actions.dragOver$,
    (props, trigger, dragOver) => {
      let disabled =  !trigger || props.disabled;
      return {disabled, active: !disabled && dragOver};
    }
  ).startWith(initialState);
}

function view(state$) {
  return state$.map(state => {
    let dropzoneClass = {active: state.active};
    return (
      state.disabled
        ? <noscript></noscript>
        : <div className={classNames('dropzone', dropzoneClass)}></div>
    );
  });
}

export default function Dropzone({DOM, props$}) {
  let actions = intent(DOM);
  let state$ = model(props$, actions);
  let vtree$ = view(state$);
  let action$ = actions.drop$.map(value => ({type: 'drop', value})).share();

  return {
    DOM: vtree$,
    action$
  };
}
