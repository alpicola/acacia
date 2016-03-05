import {Observable} from "rx";
import {hJSX} from "@cycle/dom";
import {propHook} from "../utils/hook";

function intent(DOM) {
  let preventDefault = e => { e.preventDefault() };
  DOM.select("input[type=\"submit\"]").events('click').do(preventDefault).subscribe();
  return {};
}

function model(props$, actions) {
  return Observable.just();
}

function view(state$) {
  return state$.map(state => {
    return (
      <form className="form">
        <div className="form-group">
          <label>Title</label>
          <input name="title" type="text"></input>
        </div>
        <div className="form-group">
          <label>Authors</label>
          <textarea name="authors" rows="4"></textarea>
        </div>
        <div className="form-group">
          <label>Venue</label>
          <input name="venue" type="text"></input>
        </div>
        <div className="form-group">
          <label>Year</label>
          <input name="year" type="number"></input>
        </div>
        <div className="form-action">
          <button className="close" type="reset">Cancel</button>
          <button className="close" type="submit">Add</button>
        </div>
      </form>
    );
  });
}

export default function ItemForm({DOM, props$}) {
  let actions = intent(DOM);
  let state$ = model(props$, actions);
  let vtree$ = view(state$);
  let action$ = Observable.empty();

  return {DOM: vtree$, action$};
}
