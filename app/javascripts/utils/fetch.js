function fetchJSON(url) {
  return fetch(url).then(response => {
    return response.json();
  });
}

function fetchXML(url) {
  return fetch(url).then(response => {
    return response.text();
  }).then(text => {
    let parser = new DOMParser();
    return parser.parseFromString(text, 'application/xml');
  });
}

function fetchHTML(url) {
  return fetch(url).then(response => {
    return response.text();
  }).then(text => {
    let parser = new DOMParser();
    return parser.parseFromString(text, 'text/html');
  });
}

export {fetchJSON, fetchXML, fetchHTML}
