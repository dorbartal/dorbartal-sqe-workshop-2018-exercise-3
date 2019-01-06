import * as codeTable from './codeTable';
let varsMap = [];
let colorsMap = [];
let whileMap = [];
let whileIndx = 0;
//A dictionary - each cell is a line
let linesDictionary = [];
let line = 1;

export const clearVarsMap = () => varsMap = [];

export const symbolicSubstitution = (code, parsed) => {
    line = 1;
    whileMap = [];
    whileIndx = 0;
    let dic = [];
    colorsMap = [];
    linesDictionary = [];
    handleGlobals(parsed);
    dic = copyFromVarsMap(dic);
    handleAll(parsed, dic, undefined);
    return iterateInputCode(code);
};


export const handleAll = (arg, dic, scope) => {
    arg.body.forEach(b => {
        typeToHandlerMapping[b.type](b, dic, scope);
    });
};

export const varDec = (arg, dic, scope) => {
    arg.declarations.forEach(dec =>{
        let name = typeToHandlerMapping[dec.id.type](dec.id, dic, scope);
        let value = (dec.init ? typeToHandlerMapping[dec.init.type](dec.init, dic, scope): null);
        dic[name] = swapAllVariables(value, dic);
    });
    copyDictionary(dic, true);
};

//Function and arguments handlers
export const funcDec = (arg, dic, scope) => {
    paramsHandle(arg.params, dic, scope);
    copyDictionary(dic, true);
    typeToHandlerMapping[arg.body.type](arg.body, dic, scope);
};

export const paramsHandle = (params, dic) => {
    for (let i=0; i<params.length; i++) {
        let temp = typeToHandlerMapping[params[i].type](params[i], dic);
        dic[temp] = temp;
    }
};

//complexity
export const ifStat = (arg, dic, scope) => {
    //if (ifType === undefined) {ifType = 'if statement';}
    let cond = typeToHandlerMapping[arg.test.type](arg.test, dic, scope);
    let evaluateCondition = evaluate(cond, dic, scope);
    colorsMap.push(evaluateCondition);
    scope = evaluateCondition ? false : scope;
    copyDictionary(dic, true);
    let temp = copyDictionary(dic, false);
    typeToHandlerMapping[arg.consequent.type](arg.consequent, dic, evaluateCondition); dic = temp;
    if (arg.alternate){
        if (arg.alternate.type === 'IfStatement'){arg.alternate.type = 'ElseIfStatement';}
        else {
            colorsMap.push(scope !== false);
            copyDictionary(dic, true);
        }
        typeToHandlerMapping[arg.alternate.type](arg.alternate, dic, scope);
    }
};

//new
export const swapNumericVariables = (arg) => {
    if (isNaN(arg)) {
        let retVal = '';
        arg = arg.split(' ').join('');
        let values = arg.split(/[\s<>=]+/);
        let operators = arg.split(/[^\s<>=]+/);
        for (let i = 0; i < values.length; i++) {
            try {
                let evalSuccess = eval(values[i]) + operators[i + 1];
                if (/^[a-zA-Z]+$/.test(evalSuccess))
                    evalSuccess = arg;
                retVal += evalSuccess;
            } catch (e) {
                retVal = arg;
            }
        }
        return retVal;
    }
    return arg;
};

export const swapAllVariables = (arg, dic, argIsVariable) => {
    let currVar;
    let afterIllNum = illegalNumber(arg);
    afterIllNum.forEach(v => {
        currVar = v;
        if (dic[currVar] !== undefined && !(currVar in varsMap)) currVar = dic[currVar];
        arg = arg.replace(v, currVar);
    });
    return argIsVariable ? arg : swapNumericVariables(arg);
};

//Will be called from ifStat - to handle if scopes
export const evaluate = (arg, dic, scope)=> {
    let val = swapAllVariables(arg, dic);
    val.split(/[\s<>,=()*/;!|&{}%+-]+/).filter(i => i !== ' ').forEach(v => {
        if (v in varsMap)
            val = val.replace(v, varsMap[v]);
    });
    let evalSuccess = eval(val);
    return scope === undefined ? evalSuccess : (scope ? evalSuccess : false);
};

export const copyDictionary = (dic, toLinesDictionary) => {
    let temp = [];
    for (let key in dic)
        temp[key] = dic[key];
    if (toLinesDictionary) {
        linesDictionary[line] = temp;
        line++;
    }
    else
        return temp;
};

export const handleGlobals = (arg) => {
    arg.body.forEach(b => {
        if (b.type === 'ExpressionStatement') {
            let expNameValue = codeTable.typeToHandlerMapping[b.expression.type](b.expression);
            addToVarsMap(expNameValue.name, expNameValue.value);
        }
        if (b.type === 'VariableDeclaration') {
            b.declarations.forEach(dec => {
                addToVarsMap(typeToHandlerMapping[dec.id.type](dec.id), dec.init === null ? null : codeTable.typeToHandlerMapping[dec.init.type](dec.init));
            });
        }
    });
};

export const addToVarsMap = (key, value) => {
    illegalNumber(value).forEach(v => {
        if (v in varsMap)
            value = value.replace(v, varsMap[v]);
    });
    if(value === null)
        value = key in varsMap ? varsMap[key] : value;
    varsMap[key] = swapNumericVariables(value);
};

export const AssignmentExpression = (arg, dic, scope) => {
    let name = typeToHandlerMapping[arg.left.type](arg.left, dic, scope);
    let value = typeToHandlerMapping[arg.right.type](arg.right, dic, scope);
    dic[name] = swapAllVariables(value, dic);
    copyDictionary(dic, true);
    return {line: arg.loc.start.line, type: 'assignment expression', name: name , condition: '', value: value};
};

export const iterateInputCode = (arg) => {
    let retVal = [];
    let sub = 0;
    let codeLines = arg.split(/\r?\n/);
    for (let i = 0 ; i < codeLines.length; i++) {
        let line = codeLines[i].replace('\t','');
        if (isBlank(line)) {
            retVal.push(line);
            sub++;
        }
        else if ((assignToNameInVarsMap(line) in varsMap) || isStatement(line)) {
            let temp = swapAllVariables(line, linesDictionary[i - sub + 1], true);
            retVal.push(temp);
        }
    }
    return retVal;
};

//from app - maybe add something to avoid the blanks
export const handleFuncArgs = (args) => {
    args.split(/,(?![^([]*[\])])/g).filter(i => i !== '').forEach(arg => {insertToVarsMap(arg.split('=')[0].split(' ').join(''), arg.split('=')[1].split(' ').join(''));});
};

export const insertToVarsMap = (name, value) => {
    //array
    if (value[0] === '[')
    {
        value = value.substring(1, value.length - 1);
        value.split(',').forEach((arrElem, index) => {
            insertToVarsMap(name + '[' + index + ']', arrElem);
        });
    }
    else
        varsMap[name] = value;
};

export const copyFromVarsMap = (dic) => {
    for(let key in varsMap) {
        dic[key] = varsMap[key];
    }
    return dic;
};

//returns the "left" element of assignment
export const assignToNameInVarsMap = (arg) => { return arg.includes('=') ? (illegalNumber(arg).filter(i => i !== '')[0]) : '';};
//function/while/if/else/return
export const isStatement = (arg) => {return (arg.includes('function') || arg.includes('while') || arg.includes('if') || arg.includes('else') || arg.includes('return'));};
export const removeBlanks = (arg) => {return arg.split(' ').join('');};
export const isBlank = (arg) => {return (removeBlanks(arg) === '' || removeBlanks(arg) === '}' || arg === '{' || arg === '' || arg ==='}');};

export const illegalNumber = (arg) => {return isNaN(arg) ? arg.split(/[\s<>,=!&|()*/;{}%+-]+/).filter(i => i !== '') : [];};
//from app
export const getColorsMap = () => {return colorsMap;};

export const getWhileMap = () => {return whileMap;};

let typeToHandlerMapping = {
    'FunctionDeclaration': funcDec,
    'VariableDeclaration': varDec,
    'BlockStatement': (arg, dic, scope) => handleAll(arg, dic, scope),
    'ExpressionStatement': (arg, dic, scope) => {typeToHandlerMapping[arg.expression.type](arg.expression, dic, scope);},
    'ReturnStatement': (arg, dic) => {copyDictionary(dic, true);},
    'WhileStatement': function whileStat(arg, dic, scope){copyDictionary(dic, true); let cond = evaluate(typeToHandlerMapping[arg.test.type](arg.test, dic, scope), dic, scope); whileMap[whileIndx] = (cond && scope); whileIndx++; typeToHandlerMapping[arg.body.type](arg.body, dic, cond); copyDictionary(dic, true);},
    'IfStatement': ifStat,
    'ElseIfStatement': (arg, dic, scope) => {ifStat(arg, dic, scope, 'else if statement');},
    'Identifier': (arg)=> {return arg.name;},
    'Literal': (arg)=> { if (isNaN(arg.value)) return '\''+arg.value+'\''; else return arg.value;},
    'MemberExpression': (arg) => {return arg.object.name + '[' + typeToHandlerMapping[arg.property.type](arg.property) + ']';},
    'UnaryExpression': (arg) => {return arg.operator + typeToHandlerMapping[arg.argument.type](arg.argument);},
    'AssignmentExpression': AssignmentExpression,
    'BinaryExpression': (arg, dic, scope) => {return '(' + typeToHandlerMapping[arg.left.type](arg.left, dic, scope) + ' ' + arg.operator + ' ' + typeToHandlerMapping[arg.right.type](arg.right, dic, scope)+')';},
    'LogicalExpression': (arg, dic, scope) => {return '(' + typeToHandlerMapping[arg.left.type](arg.left, dic, scope) + ' ' + arg.operator + ' ' + typeToHandlerMapping[arg.right.type](arg.right, dic, scope)+')';}
};