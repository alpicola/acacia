import URLSearchParams from 'url-search-params'; // polyfill

const DBLP_SEARCH_API_ENDPOINT = 'http://dblp.uni-trier.de/search/publ/api'

function getDefaultSearchParams() {
  return new URLSearchParams('h=1000');
}

function searchPublications(query) {
  let searchParams = getDefaultSearchParams();
  searchParams.append('q', query);
  searchParams.append('format', 'xml');
  let url = DBLP_SEARCH_API_ENDPOINT + '?' + searchParams.toString();
  return fetchXML(url).then(doc => {
    return Array.from(doc.querySelectorAll('result > hits > hit'), hit => {
      let info = hit.querySelector('info');
      return {
        id: hit.id,
        authors: Array.from(info.querySelector('authors').children, _ => _.textContent),
        title: info.querySelector('title').textContent,
        venue: info.querySelector('venue').textContent,
        year: info.querySelector('year').textContent,
        bibURL: info.querySelector('url').textContent
      };
    });
  });
}

function getBibTexFromBibURL(url) {
  return fetchHTML(url).then(doc => {
    let pre = doc.querySelector('#bibtex-section pre');
    if (pre != null) {
      return pre.textContent;
    } else {
      throw new Error(`invalid biburl: {url}`);
    }
  })
}

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

export default {
  searchPublications,
  getBibTexFromBibURL
}
