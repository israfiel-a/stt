'use strict';

async function loadFileText(name) {
  return await (await fetch(name)).text();
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
   * @type {{title:string, body:string}[]}
   * @constant
   */
  body;

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

    this.body = [];
    for (const input of content) {
      const titleEnd = input.indexOf('\n');
      this.body.push({
        title: input.substring(0, titleEnd),
        body: input.substring(titleEnd)
      });
    }
  }
}

class Book {
  /**
   * @type {string}
   */
  title = null;
  /**
   * @type {[string, string]}
   */
  exposition;
  /**
   * @type {Part[]}
   */
  parts = [];

  static LENGTH = 6;

  /**
   *
   * @param {string[][]} contents
   */
  constructor(contents) {
    const prelude = contents.splice(0, 1)[0][0];
    const titleEnd = prelude.indexOf('\n');
    this.title = prelude.substring(0, titleEnd);
    this.exposition = [prelude.substring(titleEnd), contents.pop()[0]];

    for (const part of contents) this.parts.push(new Part(part));
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

  // book, part, chapter
  static current = [0, 0, 0];

  static LENGTH = 5;

  constructor() {
    throw new Error('This is a static class.');
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
    }
  }

  static display() {
    document.body.children.item(0).innerHTML = this.books[this.current[0]]
                                                   .parts[this.current[1]]
                                                   .body[this.current[2]]
                                                   .title;
    document.body.children.item(1).innerHTML =
        this.books[this.current[0]].title + ' &mdash; ' +
        this.books[this.current[0]].parts[this.current[1]].title;
    document.body.children.item(3).innerHTML = this.books[this.current[0]]
                                                   .parts[this.current[1]]
                                                   .body[this.current[2]]
                                                   .body;
  }
}

window.onload = async () => {
  await Series.load();
  Series.display();
}