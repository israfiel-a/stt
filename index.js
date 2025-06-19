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
    this.body = contents.split('\n').filter((v) => v != '\n' && v != '');
    this.title = this.body.splice(0, 1)[0];

    for (let i = 0; i < this.body.length; i++) {
      const paragraph = this.body[i];

      let italic = false;

      let digestedParagraph = '';
      for (const letter of paragraph) {
        switch (letter) {
          case '_':
            if (!italic)
              digestedParagraph += '<i>';
            else
              digestedParagraph += '</i>';
            italic = !italic;
            break;
          case '+':
            digestedParagraph +=
                '<p align="center" style="font-size: x-large;">···</p>';
            break;
          default:
            digestedParagraph += letter;
        }
      }
      this.body[i] = digestedParagraph;
    }
  }
}

class Part {
  /**
   * @type {Chapter}
   */
  hook;
  /**
   * @type {Chapter[]}
   * @constant
   */
  chapters;

  static LENGTH = 17;

  /**
   *
   * @param {string[]} content
   */
  constructor(content) {
    this.hook = new Chapter(content.splice(0, 1)[0]);
    this.chapters = [];
    for (const input of content) this.chapters.push(new Chapter(input));
  }
}

class Book {
  /**
   * @type {[string, string]}
   */
  //@ts-ignore
  title = [];
  /**
   * @type {[Chapter, Chapter]}
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
    let prelude = contents.splice(0, 1)[0][0];
    const titleEnd = prelude.indexOf('\n');
    this.title[0] = prelude.substring(0, titleEnd);
    prelude = prelude.substring(titleEnd);
    //@ts-ignore
    this.title = this.title[0].split(': ');
    this.exposition = [new Chapter(prelude), new Chapter(contents.pop()[0])];

    for (const part of contents) this.parts.push(new Part(part));
  }
}

/**
 * @hideconstructor
 */
class Series {
  /**
   * @type {[Chapter, Chapter]}
   */
  //@ts-ignore
  static exposition = [];
  /**
   * @type {Book[]}
   */
  static books = [];

  static LENGTH = 5;

  static current = [-1, 0, 0];

  constructor() {
    throw new Error('This is a static class.');
  }

  /**
   *
   * @returns {Book|Chapter}
   */
  static getCurrentBook() {
    if (this.current[0] == 0) return this.exposition[0];
    if (this.current[0] == Series.LENGTH - 1) return this.exposition[1];
    return this.books[this.current[0] - 1];
  }

  /**
   *
   * @returns {Part | Chapter}
   */
  static getCurrentPart() {
    const book = this.getCurrentBook();
    if (book instanceof Chapter) return book;

    if (this.current[1] == 0) return book.exposition[0];
    if (this.current[1] == Book.LENGTH - 1) return book.exposition[1];
    return book.parts[this.current[1] - 1];
  }

  /**
   *
   * @returns {Chapter}
   */
  static getCurrentChapter() {
    const part = this.getCurrentPart();
    if (part instanceof Chapter) return part;

    if (this.current[2] == 0) return part.hook;
    return part.chapters[this.current[2] - 1];
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
        this.exposition.push(new Chapter(text));
        // Display the beginning once loaded.
        if (i == 0)
          Series.display(document.getElementsByTagName('main').item(0));
        continue;
      }

      this.books.push(new Book(await this.#loadBook(i)));
    }
  }

  /**
   *
   * @param {HTMLElement} display
   * @returns
   */
  static display(display, direction = true) {
    display.innerHTML = '';
    display.style.display = 'initial';
    display.style.textAlign = 'initial';

    if (direction) {
      // Display the title page if we're supposed to be displaying that.
      if (this.current[0] == -1) {
        const title = document.createElement('div');
        const header = document.createElement('h2');
        header.innerText = 'The Surface Tension Trilogy';
        title.appendChild(header);

        const subheader = document.createElement('h4');
        subheader.innerText = 'Heaven Torn Asunder';
        title.appendChild(subheader);

        const author = document.createElement('p');
        author.innerText = 'Israfil Argos';
        title.appendChild(author);

        display.appendChild(title);
        this.current[0]++;
        return;
      }

      if (this.current[0] == 0 || this.current[0] == Series.LENGTH - 1) {
        const header = document.createElement('h2');
        let isPrelude = this.current[0] == 0;
        const text = (isPrelude ? this.exposition[0] : this.exposition[1]);
        header.innerText = (isPrelude ? 'Prelude' : 'Postlude') +
            ' to the Surface Tension Trilogy';
        display.appendChild(header);

        const subheader = document.createElement('h4');
        subheader.innerHTML = text.title;
        display.appendChild(subheader);

        for (const paragraph of text.body) {
          const paragraphElement = document.createElement('p');
          paragraphElement.innerHTML = paragraph;
          display.appendChild(paragraphElement);
        }

        if (isPrelude) this.current[0]++;
        return;
      }

      if (this.current[1] == 0 || this.current[1] == Book.LENGTH - 1) {
        const header = document.createElement('h2');

        const isPrologue = this.current[1] == 0;
        /**
         * @type {Chapter}
         */
        // @ts-ignore
        const text = this.getCurrentPart();
        header.innerText = (isPrologue ? 'Prologue' : 'Epilogue') + ' to ' +
            this.getCurrentBook().title[0];
        display.appendChild(header);

        const subheader = document.createElement('h4');
        subheader.innerHTML = text.title;
        display.appendChild(subheader);

        for (const paragraph of text.body) {
          const paragraphElement = document.createElement('p');
          paragraphElement.innerHTML = paragraph;
          display.appendChild(paragraphElement);
        }

        if (isPrologue)
          this.current[1]++;
        else {
          this.current[1] = 0;
          this.current[0]++;
        }
        return;
      }

      if (this.current[2] == 0) {
        const header = document.createElement('h2');
        const text = this.getCurrentChapter();
        header.innerText = 'Part ' + numberToText(this.current[1]) + ' of ' +
            this.getCurrentBook().title[0];
        display.appendChild(header);

        const subheader = document.createElement('h4');
        subheader.innerHTML = text.title;
        display.appendChild(subheader);

        for (const paragraph of text.body) {
          const paragraphElement = document.createElement('p');
          paragraphElement.innerHTML = paragraph;
          display.appendChild(paragraphElement);
        }

        display.style.justifyContent = 'center';
        display.style.alignItems = 'center';
        display.style.display = 'flex';
        display.style.flexDirection = 'column';
        display.style.textAlign = 'center';

        this.current[2]++;
        return;
      }

      const text = this.getCurrentChapter();
      const header = document.createElement('h2');
      header.innerText =
          'Chapter ' + numberToText(this.current[2]) + ': ' + text.title;
      display.appendChild(header);

      const subheader = document.createElement('h4');
      subheader.innerHTML = 'Book ' + numberToText(this.current[0]) + ': ' +
          this.getCurrentBook().title[0] + ' | Part ' +
          numberToText(this.current[1]) + ': ' +
          //@ts-ignore
          this.getCurrentPart().hook.title;
      display.appendChild(subheader);

      for (const paragraph of text.body) {
        const paragraphElement = document.createElement('p');
        paragraphElement.innerHTML = paragraph;
        display.appendChild(paragraphElement);
      }

      if (this.current[2]++ == Part.LENGTH - 1) {
        this.current[2] = 0;
        if (this.current[1]++ == Book.LENGTH - 1) {
          this.current[1] = 0;
          if (this.current[0]++ == Series.LENGTH - 1)
            this.current[0] = Series.LENGTH - 1;
        }
      }
    }

    // const text = this.getCurrentChapter();
    // if (this.current[0] == 0 || this.current[0] == Series.LENGTH) {
    //   const header = document.createElement('h2');
    //   header.innerText = (this.current[0] == 0 ? 'Prelude' : 'Postlude') +
    //       ' to the Surface Tension Trilogy';
    //   display.appendChild(header);

    //   const subheader = document.createElement('h4');
    //   subheader.innerHTML = text.title;
    //   display.appendChild(subheader);

    //   for (const paragraph of text.body) {
    //     const paragraphElement = document.createElement('p');
    //     paragraphElement.innerHTML = paragraph;
    //     display.appendChild(paragraphElement);
    //   }
    //   return;
    // }

    // if (this.current[1] == 0 || this.current[1] == Book.LENGTH) {
    //   const header = document.createElement('h2');
    //   header.innerText = (this.current[1] == 0 ? 'Prologue' : 'Epilogue') +
    //       ' to ' + this.books[this.current[0] - 1].title[0];
    //   display.appendChild(header);

    //   const subheader = document.createElement('h4');
    //   subheader.innerHTML = text.title;
    //   display.appendChild(subheader);

    //   for (const paragraph of text.body) {
    //     const paragraphElement = document.createElement('p');
    //     paragraphElement.innerHTML = paragraph;
    //     display.appendChild(paragraphElement);
    //   }
    //   return;
    // }

    // const currentPart = currentBook.getCurrentPart();
    // if (currentPart instanceof Chapter) {
    //   const header = document.createElement('h2');
    //   header.innerText =
    //       (currentPart == currentBook.exposition[0] ? 'Prologue' :
    //       'Epilogue') + ' to ' + currentBook.title[0];
    //   display.appendChild(header);

    //   const subheader = document.createElement('h4');
    //   subheader.innerHTML = currentPart.title;
    //   display.appendChild(subheader);

    //   for (const paragraph of currentPart.body) {
    //     const paragraphElement = document.createElement('p');
    //     paragraphElement.innerHTML = paragraph;
    //     display.appendChild(paragraphElement);
    //   }

    //   if (direction && != Series.LENGTH)
    //     this.currentBook++;
    //   else if (this.currentBook != Series.LENGTH)
    //     this.currentBook--;
    //   return;
    // }

    // if (this.currentBook == -1) {
    //   const title = document.createElement('div');
    //   const header = document.createElement('h2');
    //   header.innerText = 'The Surface Tension Trilogy';
    //   title.appendChild(header);

    //   const subheader = document.createElement('h4');
    //   subheader.innerText = 'Heaven Torn Asunder';
    //   title.appendChild(subheader);

    //   const author = document.createElement('p');
    //   author.innerText = 'Israfil Argos';
    //   title.appendChild(author);

    //   display.appendChild(title);
    //   if (direction) this.currentBook++;
    //   return;
    // }

    // if (this.currentBook == 0) {
    //   const header = document.createElement('h2');
    //   header.innerText = 'Prelude to the Surface Tension Trilogy';
    //   display.appendChild(header);

    //   const subheader = document.createElement('h4');
    //   subheader.innerHTML = this.exposition[0].title;
    //   display.appendChild(subheader);

    //   for (const paragraph of this.exposition[0].body) {
    //     const paragraphElement = document.createElement('p');
    //     paragraphElement.innerHTML = paragraph;
    //     display.appendChild(paragraphElement);
    //   }

    //   if (direction)
    //     this.currentBook++;
    //   else
    //     this.currentBook--;
    //   return;
    // }

    // if (this.currentBook == Series.LENGTH) {
    //   if (!direction) this.currentBook--;
    //   return;
    // }

    // const currentBook = this.getCurrentBook();
    // if (Array.isArray(currentBook)) {
    //   const header = document.createElement('h2');
    //   header.innerText = 'Prelude to the Surface Tension Trilogy';
    //   display.appendChild(header);

    //   const subheader = document.createElement('h4');
    //   subheader.innerHTML = 'Book ' + numberToText(this.currentBook + 1) +
    //       ': ' + currentBook.title[0] + ' | Part ' +
    //       numberToText(currentBook.currentPart + 1) + ': ' +
    //       currentPart.title;
    //   display.appendChild(subheader);
    //   this.currentBook += bookJump;
    //   this.books[this.currentBook].currentPart += partJump;
    //   return;
    // }

    // const currentPart = currentBook.getCurrentPart();
    // const currentChapter = currentPart.getCurrentChapter();

    // const header = document.createElement('h2');
    // header.innerText = 'Chapter ' +
    //     numberToText(currentPart.currentChapter + 1) + ': ' +
    //     currentChapter.title;
    // display.appendChild(header);

    // const subheader = document.createElement('h4');
    // subheader.innerHTML = 'Book ' + numberToText(this.currentBook + 1) + ': '
    // +
    //     currentBook.title[0] + ' | Part ' +
    //     numberToText(currentBook.currentPart + 1) + ': ' + currentPart.title;
    // display.appendChild(subheader);

    // for (const paragraph of currentChapter.body) {
    //   const paragraphElement = document.createElement('p');
    //   paragraphElement.innerHTML = paragraph;
    //   display.appendChild(paragraphElement);
    // }
  }
}

window.onload = () => {
  document.addEventListener('keyup', (e) => {
    if (e.key == 'ArrowUp')
      document.body.children.item(0).style.display = 'none';
    if (e.key == 'ArrowDown')
      document.body.children.item(0).style.display = 'initial';
    if (e.key == 'ArrowLeft')
      Series.display(document.body.children.item(1), false);
    if (e.key == 'ArrowRight') Series.display(document.body.children.item(1));
  });
  Series.load();
}