import {Observer, Observable, Subject, CompositeDisposable} from "rx";
import isolate from "@cycle/isolate";

function makeComponent(index, DOM, Component, propsProxy$, actionsProxies, vtreesProxy$) {
  // TODO: isolate
  let {DOM: vtree$, actions} = isolate(Component)({DOM, props$: propsProxy$});
  let actionsSubscription = subscribeComponentActions(index, actions, actionsProxies)
  let vtreeSubscription = subscribeComponentVTree(index, vtree$, vtreesProxy$);
  return new CompositeDisposable();
}

function subscribeComponentActions(index, actions, subjects) {
  let subscription = new CompositeDisposable();
  for (let key in Object.keys(actions)) {
    subscription.add(
      actions[key].map(action => { return {index, action}; }).subscribe(subjects[key])
    );
  }
  return subscription;
}

function subscribeComponentVTree(index, vtree$, subject) {
  let subscription = vtree$.map(value => { return {index, value}; }).subscribe(subject);
  return subscription;
}

function makeComponentPropsProxy() {
  return new Subject();
}

function makeComponentActionsProxies(actions) {
  let subjects = {};
  for (let key in Object.keys(actions)) {
    subjects[key] = new Subject();
  }
  return subjects;
}

function makeComponentVTreeProxy() {
  return new Subject();
}

export default function MultiComponent(Component) {
  return function MultiComponent({DOM, componentsProps$, props$}) {
    let {actions: dummyActions} = Component({DOM, props$: Observable.empty()});
    let vtreesProxy$ = makeComponentVTreeProxy();
    let actionsProxies = makeComponentActionsProxies(dummyActions);
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
          let propsProxy$ = makeComponentPropsProxy();
          propsProxies.push(propsProxy$);
          let subscription = makeComponent(
            multiplicity, DOM, Component, propsProxy$, actionsProxies, vtreesProxy$
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
    }).startWith([]).shareReplay(1);

    return {DOM: vtrees$, actions: actionsProxies};
  };
}
