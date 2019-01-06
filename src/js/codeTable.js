const valueParser=(arg) => {
    return arg.type === 'BinaryExpression' ? '' + valueParser(arg.left) + ' ' + arg.operator + ' ' + valueParser(arg.right) : typeToHandlerMapping[arg.type](arg);
};

var typeToHandlerMapping = {
    'AssignmentExpression': (arg) => {return {name: typeToHandlerMapping[arg.left.type](arg.left), value: typeToHandlerMapping[arg.right.type](arg.right)};},
    'BinaryExpression': (arg) => {return valueParser(arg);},
    'MemberExpression': (arg) => {return arg.object.name + '[' + typeToHandlerMapping[arg.property.type](arg.property) + ']';},
    'UnaryExpression': (arg) => {return arg.operator + typeToHandlerMapping[arg.argument.type](arg.argument);},
    'Identifier': (arg)=> {return arg.name;},
    'Literal': (arg)=> {return arg.value;}
};

module.exports = {
    typeToHandlerMapping
};