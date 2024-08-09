const chunk = require('lodash/chunk');
const getAllBetween = require('./utils/between-headings');
const mdastToHtml = require('./utils/mdast-to-html');

function plugin() {
  return transformer;

  function transformer(tree, file) {
    const hintNodes = getAllBetween(tree, '--hints--');
    if (hintNodes.length % 2 !== 0)
      throw Error('Tests must be in (text, ```testString```) order');

    const tests = chunk(hintNodes, 2).map(getTest);
    file.data.tests = tests;
  }
}

function getTest(hintNodes, idx) {
  let [textNode, testStringNode] = hintNodes;

  const newNode = {
    type: 'text',
    value: `${idx + 1}. `,
    position: {
      start: textNode.position.start,
      end: textNode.position.start
    }
  };

  textNode = JSON.parse(JSON.stringify(textNode));

  // Insert the new node at the beginning of the children array
  textNode.children.unshift(newNode);

  const text = mdastToHtml([textNode]);
  const testString = testStringNode.value;

  if (!text) throw Error('text is missing from hint');
  // stub tests (i.e. text, but no testString) are allowed, but the md must
  // have a code block, even if it is empty.
  if (!testString && testString !== '')
    throw Error('testString (code block) is missing from hint');

  return { text, testString };
}

module.exports = plugin;
