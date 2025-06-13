'use strict';

async function loadFileText(name) {
  return await (await fetch(name)).text();
}

// credit https://stackoverflow.com/a/5530230/28813012
var ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'
];
var tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety'
];
var teens = [
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

function convert_millions(num) {
  if (num >= 1000000) {
    return convert_millions(Math.floor(num / 1000000)) + ' Million ' +
        convert_thousands(num % 1000000);
  } else {
    return convert_thousands(num);
  }
}

function convert_thousands(num) {
  if (num >= 1000) {
    return convert_hundreds(Math.floor(num / 1000)) + ' Thousand ' +
        convert_hundreds(num % 1000);
  } else {
    return convert_hundreds(num);
  }
}

function convert_hundreds(num) {
  if (num > 99) {
    return ones[Math.floor(num / 100)] + ' Hundred ' + convert_tens(num % 100);
  } else {
    return convert_tens(num);
  }
}

function convert_tens(num) {
  if (num < 10)
    return ones[num];
  else if (num >= 10 && num < 20)
    return teens[num - 10];
  else {
    return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
  }
}

function numberToText(num) {
  if (num == 0)
    return 'Zero';
  else
    return convert_millions(num);
}

class Chapter {
  /**
   * @type {string}
   */
  title;
  /**
   * @type {string[]}
   */
  body;

  /**
   *
   * @param {string} contents
   */
  constructor(contents) {
    this.body = contents.split('\n');
    this.title = this.body.splice(0, 1)[0];
  }
}

class Part {
  /**
   * @type {string}
   * @constant
   */
  title;
  /**
   * @type {string}
   */
  quote;
  /**
   * @type {Chapter[]}
   * @constant
   */
  chapters;

  #currentChapter = -1;

  static LENGTH = 16;

  /**
   *
   * @param {string[]} content
   */
  constructor(content) {
    const prologue = content.splice(0, 1)[0];
    const titleEnd = prologue.indexOf('\n');
    this.title = prologue.substring(0, titleEnd);
    this.quote = prologue.substring(titleEnd);

    this.chapters = [];
    for (const input of content) this.chapters.push(new Chapter(input));
  }

  /**
   *
   * @returns {[Chapter, number]}
   */
  getCurrentChapter() {
    return [this.chapters[++this.#currentChapter], this.#currentChapter];
  }
}

class Book {
  /**
   * @type {[string, string]}
   */
  //@ts-ignore
  title = [];
  /**
   * @type {[string, string]}
   */
  exposition;
  /**
   * @type {Part[]}
   */
  parts = [];

  #currentPart = -1;

  static LENGTH = 6;

  /**
   *
   * @param {string[][]} contents
   */
  constructor(contents) {
    const prelude = contents.splice(0, 1)[0][0];
    const titleEnd = prelude.indexOf('\n');
    this.title[0] = prelude.substring(0, titleEnd);
    //@ts-ignore
    this.title = this.title[0].split(':');
    this.exposition = [prelude.substring(titleEnd), contents.pop()[0]];

    for (const part of contents) this.parts.push(new Part(part));
  }

  /**
   *
   * @returns {[Part, number]}
   */
  getCurrentPart() {
    return [this.parts[++this.#currentPart], this.#currentPart];
  }
}

/**
 * @hideconstructor
 */
class Series {
  /**
   * @type {[[string, string], [string, string]]}
   */
  //@ts-ignore
  static exposition = [];
  /**
   * @type {Book[]}
   */
  static books = [];

  static LENGTH = 5;

  static #currentBook = -1;

  constructor() {
    throw new Error('This is a static class.');
  }

  /**
   *
   * @returns {[Book, number]}
   */
  static getCurrentBook() {
    return [this.books[++this.#currentBook], this.#currentBook];
  }

  /**
   *
   * @param {number} index
   */
  static async #loadBook(index) {
    const PATH = './Series/' + index + '/';

    let contents = [];
    for (let i = 0; i < Book.LENGTH; i++) {
      if (i == 0 || i == Book.LENGTH - 1) {
        contents.push([await loadFileText(PATH + i + '.md')]);
        continue;
      }

      contents.push([]);
      for (let j = 0; j < Part.LENGTH; j++)
        contents[contents.length - 1].push(
            await loadFileText(PATH + i + '/' + j + '.md'));
    }
    return contents;
  }

  static async load() {
    for (let i = 0; i < Series.LENGTH; i++) {
      if (i == 0 || i == Series.LENGTH - 1) {
        const text = await loadFileText('Series/' + i + '.md');
        const titleEnd = text.indexOf('\n');
        this.exposition.push(
            [text.substring(0, titleEnd), text.substring(titleEnd)]);
        continue;
      }

      this.books.push(new Book(await this.#loadBook(i)));
      // Display the first book once loaded.
      if (i == 1) Series.display();
    }
  }

  static display() {
    document.body.innerHTML = '';

    const currentBook = this.getCurrentBook();
    const currentPart = currentBook[0].getCurrentPart();
    const currentChapter = currentPart[0].getCurrentChapter();

    const header = document.createElement('h2');
    header.innerText = 'Chapter ' + numberToText(currentChapter[1] + 1) + ': ' +
        currentChapter[0].title;
    document.body.appendChild(header);

    const subheader = document.createElement('h4');
    subheader.innerHTML = 'Book ' + numberToText(currentBook[1] + 1) + ': ' +
        currentBook[0].title[0] + ' | Part ' +
        numberToText(currentPart[1] + 1) + ': ' + currentPart[0].title;
    document.body.appendChild(subheader);

    for (const paragraph of currentChapter[0].body) {
      const paragraphElement = document.createElement('p');
      paragraphElement.innerHTML = paragraph;
      document.body.appendChild(paragraphElement);
    }
  }
}

window.onload = () => {
  Series.load();
}