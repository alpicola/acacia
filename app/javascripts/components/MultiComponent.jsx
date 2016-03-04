import {Observer, Observable, Subject, CompositeDisposable} from "rx";
import isolate from "@cycle/isolate";

function makeComponent(index, DOM, Component, propsProxy$, actionsProxy$, vtreesProxy$) {
  let {DOM: vtree$, action$} = isolate(Component)({DOM, props$: propsProxy$});
  let actionsSubscription = subscribeComponentActions(index, action$, actionsProxy$)
  let vtreeSubscription = subscribeComponentVTree(index, vtree$, vtreesProxy$);
  return new CompositeDisposable(actionsSubscription, vtreeSubscription);
}

function subscribeComponentActions(index, action$, subject) {
  let subscription = action$.map(value => { return {index, value}; }).subscribe(subject);
  return subscription;
}

function subscribeComponentVTree(index, vtree$, subject) {
  let subscription = vtree$.map(value => { return {index, value}; }).subscribe(subject);
  return subscription;
}

export default function MultiComponent(Component) {
  return function MultiComponent({DOM, componentsProps$, props$}) {
    let vtreesProxy$ = new Subject();
    let actionsProxy$ = new Subject();
    let propsProxies = [];
    let propsBuffer = {};
    let subscriptions = [];

    componentsProps$.subscribe(({index, value: props}) => {
      if (propsProxies[index] != null) {
        propsProxies[index].onNext(props);
      } else if (index >= propsProxies.length) {
        propsBuffer[index] = props;
      }
    });

    let multiplicity$ = props$.pluck('multiplicity').distinctUntilChanged().share();
    multiplicity$.subscribe(multiplicityNew => {
      let multiplicity = subscriptions.length;
      if (multiplicity < multiplicityNew) {
        while (multiplicity < multiplicityNew) {
          let propsProxy$ = new Subject();
          propsProxies.push(propsProxy$);
          let subscription = makeComponent(
            multiplicity, DOM, Component, propsProxy$, actionsProxy$, vtreesProxy$
          );
          subscriptions.push(subscription);
          if (propsBuffer[multiplicity] != null) {
            propsProxies[multiplicity].onNext(propsBuffer[multiplicity]);
            delete propsBuffer[multiplicity];
          }
          multiplicity++;
        }
      } else {
        while (multiplicity > multiplicityNew) {
          subscriptions.pop().dispose();
          propsProxies.pop().dispose();
          multiplicity--;
        }
      }
    });

    let vtrees = [];
    let vtrees$ = multiplicity$.flatMapLatest(multiplicity => {
      vtrees.length = multiplicity;
      let numOfVTrees = 0;
      for (let i = 0; i < multiplicity; i++) {
        if (vtrees[i] != null) numOfVTrees++;
      }
      return vtreesProxy$.do(({index, value: vtree}) => {
        if (vtrees[index] == null) {
          numOfVTrees++;
        }
        vtrees[index] = vtree;
      }).skipWhile(_ => numOfVTrees < multiplicity).map(_ => vtrees);
    }).startWith([]).share();

    return {DOM: vtrees$, action$: actionsProxy$};
  };
}
