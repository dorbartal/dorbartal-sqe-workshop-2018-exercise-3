import * as esprima from 'esprima';

const parseCode = (codeToParse) => esprima.parseScript(codeToParse, {loc: true});

export {parseCode};
