import {Observable} from "rx";
import {hJSX} from "@cycle/dom";
import isolate from "@cycle/isolate";

function intent(DOM) {
  let close$ = DOM.select('.modal-dialog .close').events('click');
  return {close$};
}

function model(props$, actions) {
  return props$.flatMapLatest(props => {
    let initialState = {active: props.open};
    return actions.close$.map({active: false}).startWith(initialState);
  }).startWith({active: false}).share();
}

function view(state$, componentVTree$) {
  return Observable.combineLatest(
    state$, componentVTree$,
    (state, componentVTree) => {
      return (
        !state.active
          ? <noscript></noscript>
          : <div className="modal">
              <div className="modal-dialog">
                {componentVTree}
              </div>
            </div>
      );
    }
  );
}

export default function Modal(Component) {
  return function Modal({DOM, componentProps$, props$}) {
    let {DOM: componentVTree$, action$: componentAction$} =
      isolate(Component)({DOM, props$: componentProps$});
    let actions = intent(DOM);
    let state$ = model(props$, actions);
    let vtree$ = view(state$, componentVTree$);

    let action$ = componentAction$.map(value => ({type: 'component', value}));

    return {DOM: vtree$, action$};
  };
}
