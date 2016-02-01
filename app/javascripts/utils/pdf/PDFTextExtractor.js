import 'pdfjs-dist';
import PDFRect from './PDFRect';

function getPage(doc, pageIndex, pagesCache) {
  if (pagesCache[pageIndex] === undefined) {
    pagesCache[pageIndex] = doc.getPage(pageIndex + 1).then(page => {
      return page.getTextContent().then(content => {
        let viewport = page.getViewport(1.0);
        return {
          pageWidth: viewport.width,
          pageHeight: viewport.height,
          pageIndex: pageIndex,
          blocks: squashTextItems(content.items, pageIndex)
        };
      });
    });
  }
  return pagesCache[pageIndex];
}

function createTextBlock(textContent, fontSize, boundingRect, pageIndex) {
  return {
    textContent: textContent,
    fontSize: fontSize,
    boundingRect: boundingRect,
    pageIndex: pageIndex
  }
}

// em
const MAX_LINE_SPACE = 0.6;
const MAX_CHAR_SPACE = 1.2;
const TOLERANCE = 0.5;

function squashTextItems(items, pageIndex) {
  let blocks = [];
  let currentBlock = null;
  let lineFull = true;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let transform = item.transform;
    if (transform[0] != transform[3] || transform[1] != 0 || transform[2] != 0) {
      continue;
    }
    let lineRect = new PDFRect(transform[4], transform[5], item.width, item.height);

    if (currentBlock === null) {
      currentBlock = createTextBlock(item.str, item.height, lineRect, pageIndex);
    } else {
      let blockRect = currentBlock.boundingRect;
      let bottomMargin = currentBlock.fontSize * MAX_LINE_SPACE;
      let rightMargin = currentBlock.fontSize * MAX_CHAR_SPACE;
      let expandedRect = new PDFRect(
        blockRect.x,
        blockRect.y - bottomMargin,
        blockRect.width + rightMargin,
        blockRect.height + bottomMargin
      );
      let strongIntersect = blockRect.doesIntersect(lineRect);
      let weakIntersect = expandedRect.doesIntersect(lineRect);
      if (strongIntersect || weakIntersect && item.height == currentBlock.fontSize) {
        if (strongIntersect) {
          currentBlock.textContent += ' ' + item.str;
        } else {
          currentBlock.textContent += lineFull ? ' ' + item.str : '\n' + item.str;
        }
        currentBlock.boundingRect = blockRect.union(lineRect);
        lineFull = lineRect.right + currentBlock.fontSize * TOLERANCE > blockRect.right;
      } else {
        blocks.push(currentBlock);
        currentBlock = createTextBlock(item.str, item.height, lineRect, pageIndex);
        lineFull = true;
      }
    }
  }
  blocks.push(currentBlock);

  return blocks;
}

const MAX_PAGE_NUM_FOR_TITLE_SEARCH = 3;

function extractTitle(doc, pagesCache) {
  let pageLimit = Math.min(MAX_PAGE_NUM_FOR_TITLE_SEARCH, doc.numPages);
  let promise = Promise.resolve(null);
  for (let pageIndex = 0; pageIndex < pageLimit; pageIndex++) {
    promise = promise.then(candidateBlock => {
      return getPage(doc, pageIndex, pagesCache).then(page => {
        let blocks = page.blocks;
        for (let i = 0; i < blocks.length; i++) {
          let block = blocks[i];
          if (candidateBlock === null || block.fontSize > candidateBlock.fontSize) {
            candidateBlock = block;
          }
        }
        return candidateBlock;
      });
    });
  }
  return promise;
}

export default class PDFTextExtractor {
  constructor(doc) {
    this.doc = doc;
    this._pagesCache = [];
    this._titleBlockCache = null;
  }

  extractTitle() {
    if (this._titleBlockCache === null) {
      this._titleBlockCache = extractTitle(this.doc, this._pagesCache);
    }

    return this._titleBlockCache.then(titleBlock => {
      return titleBlock === null ? null : titleBlock.textContent;
    });
  }

  extractAuthors() {}

  extractFullText() {}

  static fromTypedArray(array) {
    return PDFJS.getDocument(array).then(doc => {
      return new PDFTextExtractor(doc);
    });
  }

  static fromFile(file) {
    let fileReader = new FileReader();
    let promise = new Promise((resolve, reject) => {
      fileReader.onload = e => { resolve(new Uint8Array(e.target.result)); };
      fileReader.onerror = e => { reject(new Error(e)); };
    });
    fileReader.readAsArrayBuffer(file);

    return promise.then(data => {
      return PDFTextExtractor.fromTypedArray(data);
    });
  }
}
