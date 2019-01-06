import {getColorsMap, getWhileMap} from './symbolic-subtitution';
let whileNode, next, graphString, clrs, whileIndx, whileMap, clrsIdx = 0, index = 0, nodes = {}, table = [];

export const initializeVars = () => {
    nodes = [];
    index = 0;
    whileIndx = 0;
    whileMap = getWhileMap();
    next = undefined;
    whileNode = undefined;
    clrsIdx = 0;
    clrs = getColorsMap();
};

export const createGraph = (parsedCode) => {
    initializeVars();
    let compNode = createNewNode([], 'comp', undefined, true);
    typeToHandlerMapping[parsedCode.type](parsedCode, compNode, undefined, true);
    spreadNode(compNode);
    graphString = convertToChart();
    return compNode;
};

export const getGraphString = () => {return graphString;};

/*
export const getNodes = () => {return nodes;};
 */

export const spreadNode = (node) => {
    if (node !== undefined) {
        if (nodes[node.index] === undefined) {
            node.next = getNext(node.next);
            node.false = getNext(node.false);
            node.true = getNext(node.true);
            nodes[node.index] = node;
            spreadNode(node.next);
            spreadNode(node.true);
            spreadNode(node.false);
        }
    }
};

const getNext = (node) => {
    return (node !== undefined && node.type !== 'mrg' && node.content !== undefined && node.content.length === 0) ? node.next : node;
};

const convertToChart = () => {
    let retVal = '';
    for (let i = 0; i < nodes.length; i++)
    {
        if (nodes[i] !== undefined) {
            let color = nodes[i].ToF ? 'green' : 'white';
            retVal += handleAndConcatByType(nodes[i], color);
        }
    }
    return buildEdges(retVal);
};

const handleAndConcatByType = (node, color) => {
    let gString = '';
    let fromSwitch;
    if (node.type === 'comp') {
        fromSwitch = '=>operation: ' + spreadContent(node);
    } else if (node.type === 'dec') {
        fromSwitch = '=>condition: ' + spreadContent(node);
    } else {
        fromSwitch = '=>start: <'+node.index+'>\n';
    }
    gString += 'op' + node.index + fromSwitch + '|' + color + '\n';
    return gString;
};

const buildDecNodeEdges = (node, nodeUnique, gString, YoN) => {
    gString += nodeUnique + '(' + YoN;
    if (!node.ToF)
        gString += ',right';
    gString += ')->' + 'op' + node.index + '\n';
    return gString;
};

const buildEdges = (gString) => {
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node !== undefined) {
            let nodeUnique = 'op' + node.index;
            if (node.type === 'dec') {
                gString = buildDecNodeEdges(node.true, nodeUnique, gString, 'yes');
                gString = buildDecNodeEdges(node.false, nodeUnique, gString, 'no');
            }
            if (node.next !== undefined)
                gString += nodeUnique + '->' + 'op' + node.next.index + '\n';
        }
    }
    return gString;
};

const spreadContent = (node) => {
    let retVal = '<'+node.index+'>\n';
    let content = node.content;
    content.forEach(c => retVal += (c + '\n'));
    return retVal;
};

export const funcDec = (arg, thisNode, nextNode, ToF) => {
    table.push({line: arg.loc.start.line, type: 'function declaration', name: arg.id.name, condition: '', value: ''});
    typeToHandlerMapping[arg.body.type](arg.body, thisNode, nextNode, ToF);
};

export const progDec = (arg, thisNode, nextNode, ToF) => {
    arg.body.forEach(b =>
        typeToHandlerMapping[b.type](b, thisNode, nextNode, ToF)
    );
};

/*
export const updateExp = (arg, thisNode, nextNode, ToF) => {
    let tempNode = thisNode;
    if (thisNode.content === undefined)
        tempNode = initAssNode(thisNode, nextNode);
    let name = typeToHandlerMapping[arg.argument.type](arg.argument);
    table.push({line: arg.loc.start.line, type: 'update expression', name: name , condition: '', value: arg.operator});
    tempNode.content.push(name + arg.operator);
    tempNode.ToF = ToF;
};
*/

export const varDec = (arg, thisNode, nextNode, ToF) => {
    for (let i = 0; i < arg.declarations.length; i++) {
        let dec = arg.declarations[i];
        let name = dec.id.name;
        let value = typeToHandlerMapping[dec.init.type](dec.init);
        let node = thisNode.content === undefined ? initAssNode(thisNode, nextNode) : thisNode;
        node.content.push(name + ' = ' + value);
        node.ToF = ToF;
        table.push({line: dec.id.loc.start.line, type: 'variable declaration', name: name, condition: '', value: value});
    }
};

export const createNewNode = (content, type, next, ToF) => {
    index++;
    return {index: index - 1, content: content, type: type, next: next, ToF: ToF};
};

export const initAssNode = (thisNode, nextNode) => {
    let node;
    if (thisNode.next !== undefined && thisNode.next.type !== 'dec' && thisNode.next.content !== undefined)
        node = thisNode.next;
    else {
        node = createNewNode([], 'comp', nextNode, undefined);
        thisNode.next = node;
    }
    return node;
};

export const AssignmentExpression = (arg, thisNode, nextNode, ToF) => {
    let name = typeToHandlerMapping[arg.left.type](arg.left);
    let value = typeToHandlerMapping[arg.right.type](arg.right);
    let node = thisNode.content === undefined ? initAssNode(thisNode, nextNode) : thisNode;
    node.content.push(name + ' = ' + value);
    node.ToF = ToF;
    return {line: arg.loc.start.line, type: 'assignment expression', name: name , condition: '', value: value};
};

export const whileStat = (arg, thisNode, nextNode, ToF) => {
    let test = typeToHandlerMapping[arg.test.type](arg.test, thisNode, nextNode, ToF);
    table.push({line: arg.test.loc.start.line, type: 'while statement', name: '', condition: test, value: ''});
    let decNode = createNewNode([], 'dec', nextNode, ToF);
    decNode.content.push('while ' + test);
    thisNode.next = decNode;
    nextNode = decNode;
    let compNode = createNewNode([], 'comp', nextNode, ToF);
    decNode.true = compNode;
    let whileToF = whileMap[whileIndx];
    whileIndx++;
    typeToHandlerMapping[arg.body.type](arg.body, compNode, nextNode, whileToF);
    whileNode = decNode;
};

export const ifStat = (arg, thisNode, nextNode, ToF, ifType) => {
    let test = typeToHandlerMapping[arg.test.type](arg.test, thisNode, nextNode, ToF);
    table.push({line: arg.test.loc.start.line, type: ifType, name: '', condition: test, value: ''});
    let ifToF = clrs[clrsIdx];
    clrsIdx++;
    let decNode = createNewNode([], 'dec', nextNode, ToF);
    decNode.content.push(test);
    let mrgNode = createNewNode(undefined, 'mrg', nextNode, ToF);
    thisNode.next = decNode;
    let compNode = createNewNode([], 'comp', mrgNode, thisNode.ToF);
    decNode.true = compNode;
    typeToHandlerMapping[arg.consequent.type](arg.consequent, compNode, mrgNode, ifToF);
    altStat(arg, mrgNode, ifToF, ToF, decNode);
    next = mrgNode;
};

export const elIfStat = (arg, thisNode, nextNode, ToF) => {
    let test = typeToHandlerMapping[arg.test.type](arg.test, thisNode, nextNode, ToF);
    table.push({line: arg.test.loc.start.line, type: 'else if statement', name: '', condition: test, value: ''});
    thisNode.ToF = ToF;
    thisNode.content.push(test);
    thisNode.type = 'dec';
    let ifToF = clrs[clrsIdx];
    clrsIdx++;
    let compNode = createNewNode([], 'comp', nextNode, thisNode.ToF);
    thisNode.true = compNode;
    let exToF = ifToF;
    typeToHandlerMapping[arg.consequent.type](arg.consequent, compNode, nextNode, ifToF);
    altStat(arg, nextNode, ifToF, ToF, thisNode, exToF);
};

export const altStat = (arg, nextNode, ifToF, ToF, decNode, exToF) => {
    if (arg.alternate !== null) {
        let eifNode = createNewNode([], undefined, undefined, undefined);
        exToF = ifToF;
        if (arg.alternate.type === 'ElseIfStatement')
            ifToF = (!exToF && ToF);
        else {
            eifNode.type = 'comp';
            eifNode.next = nextNode;
            ifToF = clrs[clrsIdx];
            clrsIdx++;
            eifNode.ToF = ifToF;
        }
        decNode.false = eifNode;
        typeToHandlerMapping[arg.alternate.type](arg.alternate, eifNode, nextNode, ifToF);
    }
    else
        decNode.false = nextNode;
};

export const retStat = (arg, thisNode, nextNode, ToF) => {
    let compNode = createNewNode([], 'comp', undefined, ToF);
    let argArgument = typeToHandlerMapping[arg.argument.type](arg.argument);
    compNode.content.push('return ' + argArgument);
    table.push({line: arg.loc.start.line, type: 'return statement', name: '', condition: '', argArgument});
    thisNode.next = compNode;
};

export const blockStat = (arg, thisNode, nextNode, ToF) => {
    for (let i = 0; i < arg.body.length; i++) {
        typeToHandlerMapping[arg.body[i].type](arg.body[i], thisNode, nextNode, ToF);
        if (next !== undefined) {
            thisNode = next;
            next = undefined;
        }
        if (whileNode !== undefined) {
            thisNode = whileNode;
            let compNode = createNewNode([], 'comp', thisNode.next, true);
            thisNode.false = compNode;
            thisNode = compNode;
            whileNode = undefined;
        }
    }
};

export let typeToHandlerMapping = {
    'FunctionDeclaration': funcDec,
    'VariableDeclaration': varDec,
    'BlockStatement': blockStat,
    'ExpressionStatement': (arg, thisNode, nextNode, ToF) => {typeToHandlerMapping[arg.expression.type](arg.expression, thisNode, nextNode, ToF);},
    'ReturnStatement': retStat,
    'WhileStatement': whileStat,
    'IfStatement': ifStat,
    'ElseIfStatement': elIfStat,
    'Program': progDec,
    /*
    'UpdateExpression' : updateExp,
     */
    'Identifier': (arg)=> {return arg.name;},
    'Literal': (arg)=> { if (isNaN(arg.value)) return '\''+arg.value+'\''; else return arg.value;},
    'MemberExpression': (arg) => {return typeToHandlerMapping[arg.object.type](arg.object) + '[' + typeToHandlerMapping[arg.property.type](arg.property) + ']';},
    'UnaryExpression': (arg) => {return arg.operator + typeToHandlerMapping[arg.argument.type](arg.argument);},
    'AssignmentExpression': AssignmentExpression,
    'BinaryExpression': (arg, dic, scope) => {return '(' + typeToHandlerMapping[arg.left.type](arg.left, dic, scope) + ' ' + arg.operator + ' ' + typeToHandlerMapping[arg.right.type](arg.right, dic, scope)+')';},
    'LogicalExpression': (arg, dic, scope) => {return '(' + typeToHandlerMapping[arg.left.type](arg.left, dic, scope) + ' ' + arg.operator + ' ' + typeToHandlerMapping[arg.right.type](arg.right, dic, scope)+')';}
};