import {Observable, Subject} from "rx";
import {hJSX} from "@cycle/dom";
import MultiComponent from "./MultiComponent.jsx";

function intent(DOM) {
  let view = DOM.select('.virtualscroll');
  let viewScroll$ = view.events('scroll', {useCapture: true})
    .map(e => e.target.scrollTop);
  let viewResize$ = Observable.fromEvent(window, 'resize')
    .debounce(300).startWith(null).flatMapLatest(() => {
      return view.observable.flatMap(elements => {
        let element = elements[0];
        return element != null
          ? Observable.just({height: element.clientHeight, scroll: element.scrollTop})
          : Observable.empty();
      }).take(1);
    });
  return {viewScroll$, viewResize$};
}

function model(props$, actions) {
  let initialProps = {
    viewWidth: '100%',
    viewHeight: '100%',
    items: [],
    total: 0
  };
  let initialState = {
    props: initialProps,
    rowScroll: 0,
    numOfVisibleRows: 0,
    visibleRows: [],
    visibleRowsBeginAt: 0,
    updatedItems: []
  };
  return Observable.combineLatest(
    props$, actions.viewResize$,
    (props, viewResize) => {
      return {props, viewHeight: viewResize.height, viewScroll: viewResize.scroll};
    }
  ).flatMapLatest(({props, viewHeight, viewScroll}) => {
    let initialState = initializeState(props, viewHeight, viewScroll);
    return actions.viewScroll$.scan((state, viewScroll) => {
      return updateState(props, viewScroll, state);
    }, initialState).startWith(initialState).distinctUntilChanged(_ => _.rowScroll);
  }).share().startWith(initialState);
}

function initializeState(props, viewHeight, viewScroll) {
  let firstVisibleRow = Math.floor(viewScroll / props.rowHeight);
  let numOfVisibleRows = Math.min(props.total, Math.ceil(viewHeight / props.rowHeight) + 1);
  let visibleRows = Array(numOfVisibleRows);
  let updatedItems = Array(numOfVisibleRows);
  for (var index = 0; index < numOfVisibleRows; index++) {
    let row = firstVisibleRow + index;
    if (row < props.total) {
      visibleRows[index] = row;
      updatedItems[index] = {index, value: props.items[row]};
    } else {
      visibleRows[index] = null;
      updatedItems[index] = {index, value: props.items[0]}; // dummy
    }
  }
  return {
    props,
    rowScroll: firstVisibleRow,
    numOfVisibleRows,
    visibleRows,
    visibleRowsBeginAt: 0,
    updatedItems
  };
}

function updateState(props, viewScroll, state) {
  let {rowScroll, visibleRows, visibleRowsBeginAt, numOfVisibleRows} = state;
  let rowScrollNew = Math.floor(viewScroll / props.rowHeight);
  if (rowScrollNew === rowScroll) {
    return state; // skipped
  } else {
    let updatedItems = [];
    if (rowScrollNew > rowScroll) {
      let row = visibleRows[visibleRowsBeginAt] + numOfVisibleRows;
      let lastVisibleRow = rowScrollNew + numOfVisibleRows - 1;
      while (row <= lastVisibleRow) {
        if (row < props.total) {
          visibleRows[visibleRowsBeginAt] = row;
          updatedItems.push({index: visibleRowsBeginAt, value: props.items[row]});
        } else {
          visibleRows[visibleRowsBeginAt] = null;
        }
        row++;
        visibleRowsBeginAt++;
        if (visibleRowsBeginAt >= numOfVisibleRows) {
          visibleRowsBeginAt -= numOfVisibleRows;
        }
      }
    } else {
      let row = visibleRows[visibleRowsBeginAt] - 1;
      let firstVisibleRow = rowScrollNew;
      let visibleRowsEndAt = (visibleRowsBeginAt || numOfVisibleRows) - 1;
      while (row >= firstVisibleRow) {
        if (0 <= row) {
          visibleRows[visibleRowsEndAt] = row;
          updatedItems.push({index: visibleRowsEndAt, value: props.items[row]});
        } else {
          visibleRows[visibleRowsEndAt] = null;
        }
        row--;
        visibleRowsEndAt--;
        if (visibleRowsEndAt < 0) {
          visibleRowsEndAt += numOfVisibleRows;
        }
      }
      visibleRowsBeginAt = (visibleRowsEndAt + 1) % numOfVisibleRows;
    }
    return {
      props,
      rowScroll: rowScrollNew,
      numOfVisibleRows,
      visibleRows: visibleRows.slice(),
      visibleRowsBeginAt,
      updatedItems
    };
  }
}

function view(state$, itemsVTrees$) {
  itemsVTrees$.subscribe();
  // state affects itemsVTrees
  return state$.flatMapLatest(state => {
    return itemsVTrees$.map(itemsVTrees => {
      let viewStyle = {
        width: toCSSLength(state.props.viewWidth),
        height: toCSSLength(state.props.viewHeight)
      };
      let listStyle = {
        height: `${state.props.total * state.props.rowHeight}px`
      };

      let listItemVTrees = itemsVTrees.map((itemVTree, index) => {
        let rowIndex = state.visibleRows[index];
        if (rowIndex != null) {
          let listItemClass = rowIndex == 0 ? 'first-child' : 'not-first-child';
          let listItemStyle = {
            top: `${state.props.rowHeight * rowIndex}px`,
            height: `${state.props.rowHeight}px`
          };
          return (
            <li className={listItemClass} style={listItemStyle}>
              {itemVTree}
            </li>
          );
        } else {
          let listItemStyle = {
            display: 'none'
          };
          return (
            <li style={listItemStyle}></li>
          );
        }
      });

      return (
        <div style={viewStyle} className="virtualscroll">
          <ul style={listStyle}>
            {listItemVTrees}
          </ul>
        </div>
      );
    });
  });
}

function toCSSLength(value) {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number') {
    if (isNaN(value)) {
      console.log('toCSSLength(): value is NaN');
    }
    return value + 'px';
  } else {
    return 'auto';
  }
}

export default function VituralScroll(Component) {
  return function VituralScroll({DOM, props$}) {
    let actions = intent(DOM);
    let state$ = model(props$, actions);

    let multiProps$ = state$.map(state => {
      return {multiplicity: state.numOfVisibleRows};
    });
    let itemsProps$ = state$.flatMap(state => {
      return Observable.from(state.updatedItems);
    });
    let {DOM: itemsVTrees$, actions: itemsActions} =
      MultiComponent(Component)({DOM, componentsProps$: itemsProps$, props$: multiProps$});

    let vtree$ = view(state$, itemsVTrees$);

    return {DOM: vtree$};
  };
}
