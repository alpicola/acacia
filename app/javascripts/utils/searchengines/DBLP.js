import URLSearchParams from 'url-search-params'; // polyfill
import {fetchXML, fetchHTML} from '../fetch.js'

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
      let authorsElem = info.querySelector('authors');
      let authors = authorsElem ? Array.from(authorsElem.children, _ => _.textContent) : [];
      let title = info.querySelector('title').textContent;
      let venue = info.querySelector('venue').textContent;
      let year = info.querySelector('year').textContent;
      let bibURL = info.querySelector('url').textContent;
      return {id: hit.id, authors, title, venue, year, bibURL};
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


export default {searchPublications, getBibTexFromBibURL}
