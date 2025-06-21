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

  /**
   *
   * @param {HTMLElement} element
   */
  display(element) {
    element.innerHTML = '';

    let header = document.createElement('h3');
    header.innerHTML = this.title;
    element.appendChild(header);

    for (const paragraph of this.body) {
      let elem = document.createElement('p');
      elem.innerHTML = paragraph;
      element.appendChild(elem);
    }
  }
}

const LENGTH = (17 * 4 + 2) * 3 + 2;

let current = -1;

let currentBook = null;

/**
 * @type {Chapter[]}
 */
let chapters = [];

window.onload = async () => {
  for (let i = 0; i < 5; i++) {
    if (i == 0 || i == 4) {
      chapters.push(new Chapter(await loadFileText('./Series/' + i + '.md')));
      continue;
    }

    for (let j = 0; j < 6; j++) {
      if (j == 0 || j == 5) {
        chapters.push(
            new Chapter(await loadFileText('./Series/' + i + '/' + j + '.md')));
        continue;
      }

      for (let k = 0; k < 17; k++) {
        chapters.push(new Chapter(
            await loadFileText('./Series/' + i + '/' + j + '/' + k + '.md')));
      }
    }
  }

  document.addEventListener('keyup', (e) => {
    if (e.key == 'ArrowLeft' && current > -1) {
      current--;
      chapters[current].display(document.body);
    }
    if (e.key == 'ArrowRight' && current < LENGTH - 1) {
      current++;
      chapters[current].display(document.body);
    }
  });

  document.addEventListener('touchstart', (e) => {
    if (e.touches.item(0).clientX >= window.innerWidth * 0.75 &&
        current < LENGTH - 1) {
      current++;
      chapters[current].display(document.body);
    } else if (
        e.touches.item(0).clientX <= window.innerWidth * 0.25 && current > -1)
      current--;
    chapters[current].display(document.body);
  });

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

  document.body.appendChild(title);
}