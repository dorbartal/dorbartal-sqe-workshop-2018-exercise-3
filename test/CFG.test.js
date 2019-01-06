import assert from 'assert';
import {symbolicSubstitution,clearVarsMap,handleFuncArgs,getColorsMap} from '../src/js/symbolic-subtitution';
import {parseCode} from '../src/js/code-analyzer';
import * as CFG from '../src/js/CFG';

describe('The javascript parser', () => {
    beforeEach(()=>{
        clearVarsMap();
    });

    it('Test 1 - check createNewNode', () => {
        assert.deepEqual(CFG.createNewNode([], 'mrg', {}, true),{index: 0, content:[], type: 'mrg', next: {}, ToF: true});
    });

    it('Test 2 - check initAssNode', () => {
        assert.deepEqual(CFG.initAssNode({next: {type:'s', content:[]}},{}),{content:[],type:'s'});
    });

    it('Test 3 - gitLab example', () => {
        let codeLns = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z[0]) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z[0] * 5) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z[0] + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n';
        let prsCd = parseCode(codeLns);
        handleFuncArgs('x=1, y=2,z=[3]');
        symbolicSubstitution(codeLns, prsCd);
        let retVal = CFG.createGraph(prsCd);
        assert.deepEqual(retVal.next.false.true.next.type, 'mrg');
        assert.deepEqual(retVal.next.false.content,['(b < (z[0] * 5))']);
        assert.deepEqual(retVal.next.true.next.index, 2);
    });

    it(' Test 4 - if-while, while-if, else-if', () => {
        let codeLns='function test4(x) {\n' +
            '    let num = 0;\n' +
            '    while (x == 16) {\n' +
            '        if (x == 5) {\n' +
            '            while (x == 5) {\n' +
            '                if (x == 5) {\n' +
            '                    x = x\n' +
            '                } else if (x == 5) {\n' +
            '                    num = num \n' +
            '                }\n' +
            '            }\n' +
            '        } else {\n' +
            '            while (x == 16) {\n' +
            '                if (x == 5) {\n' +
            '                    x = x\n' +
            '                } else if (x == 16) {\n' +
            '                    num = num\n' +
            '                }\n' +
            '            }\n' +
            '        }\n' +
            '    }\n' +
            '    return -3;\n' +
            '}';
        let prsCd = parseCode(codeLns);
        handleFuncArgs('x=16')
        symbolicSubstitution(codeLns, prsCd)
        let retV = CFG.createGraph(prsCd);
        assert.deepEqual(retV.content, ['num = 0']);
        assert.deepEqual(retV.next.true.next.type, 'dec');
    });

    it('Test 5 - complex array', () => {
        let codeLns='let w = 1;\n' +
            'w = w + 0;\n' +
            'let t;\n' +
            't = -1;\n' +
            'let f;\n' +
            'function foo( y, z){\n' +
            '        let b = true;\n' +
            '\t\t\tif(b == true){\n' +
            '\t\t\t\treturn w ;\n' +
            '            }\n' +
            '}';
        let input='f=3, y=2, z=[1,2,\'bjbj\']';
        handleFuncArgs(input);
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length,7);
        assert.deepEqual(getColorsMap(),[true]);
    });

    it('Test 6 - member in globals 1', () => {
        let codeLns='let w = z[1];\n' +
            'w = w + 0;\n' +
            'let t;\n' +
            't = -1;\n' +
            'let f;\n' +
            'function foo( y, z){\n' +
            '        let b = true;\n' +
            '\t\t\tif(b == true){\n' +
            '\t\t\t\treturn w ;\n' +
            '            }\n' +
            '}';
        let input='f=3, y=2, z=[1,2,\'bjbj\']';
        handleFuncArgs(input);
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length,7);
        assert.deepEqual(getColorsMap(),[true]);
    });

    it('Test 7 - member in globals 2', () => {
        let codeLns='let w = z[1];\n' +
            'w = w + 0;\n' +
            'let t;\n' +
            't = -1;\n' +
            'let f;\n' +
            'function foo( y, z){\n' +
            '\tlet b = true;\n' +
            '\tif(b == true){\n' +
            '\t\treturn w ;\n' +
            '\t}\n' +
            '\telse if (5<2){}\n' +
            '\telse {}\n' +
            '}';
        let input='f=3, y=2, z=[1,2,\'bjbj\']';
        handleFuncArgs(input);
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length,9);
        assert.deepEqual(getColorsMap(),[true, false, false]);
    });

    it('Test 8 - Input-vector globals', () => {
        let codeLns='let num;\n' +
            'let f;\n' +
            'function x(){\n' +
            'if(num==3){\n' +
            'return w;\n' +
            '}\n' +
            '}';
        handleFuncArgs('num=3');
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length, 5);
        assert.deepEqual(getColorsMap(),[true]);
    });

    it('Test 9 - global arr - no arg', () => {
        const codeLns='let a1=a[1]\n' +
            'let five=2;\n' +
            'five=five+3;\n' +
            'function test9(){\n' +
            'if(five==5){\n' +
            'return -1;\n' +
            '}\n' +
            '}';
        handleFuncArgs('arr=[`hello`,5]');
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length, 6);
        assert.deepEqual(getColorsMap(),[true]);
    });

    it('Test 10 - if, else if, else', () => {
        const codeLns='function t10(){\n' +
            '\tlet h = \'hello\';\n' +
            '\tlet w = \' world\';\n' +
            '\tif (h+w === \'hello\')\n' +
            '\t\treturn -1;\n' +
            '\telse if (h+w === \'world\')\n' +
            '\t\treturn 0;\n' +
            '\telse\n' +
            '\t\treturn 1;\n' +
            '}\n';
        symbolicSubstitution(codeLns,parseCode(codeLns));
        assert.deepEqual(getColorsMap(),[false, false, true]);
    });

    it('Test 11 - if with assignment', () => {
        const codeLns='function t11(){\n' +
            '\tlet h = 5;\n' +
            '\tif (h<10) {\n' +
            '\t\th = h+2;\n' +
            '\t}\n' +
            '\tif (h==7)\n' +
            '\t\treturn -1;\n' +
            '\tif (h==11)\n' +
            '\t\treturn true;\n' +
            '}';
        symbolicSubstitution(codeLns,parseCode(codeLns));
        assert.deepEqual(getColorsMap(),[true, true, false]);
    });

    it('Test 12 - global arr', () => {
        const codeLns=
            'function test12(arr){\n' +
            'if(arr[1]==5)\n' +
            'return 2;\n' +
            '}';
        handleFuncArgs('arr=[`hello`,5]');
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length, 4);
        assert.deepEqual(getColorsMap(),[true]);
    });

    it('Test 13 - logical', () => {
        const codeLns=
            'function test13() {\n' +
            'let a = \'hello\';\n' +
            'let b = (a == \'hello\');\n' +
            'if (b || b)\n' +
            'return -25;\n' +
            'else\n' +
            'return 4;\n' +
            '}';
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length, 6);
        let retV = CFG.createGraph(parseCode(codeLns));
        assert.deepEqual(retV.content, ['a = \'hello\'', 'b = (a == \'hello\')' ]);
    });

    it('Test 14 - get undefined', () => {
        const input='function r(x) {\n' +
            '    let c = 0;\n' +
            '    if (x == 2) {\n' +
            '        x = 2;\n' +
            '        if (x == 2) {\n' +
            '            a = a;\n' +
            '        } else if (x == 1) {\n' +
            '            b = b;\n' +
            '        }\n' +
            '        let e = 1;\n' +
            '        b = f;\n' +
            '    } else {\n' +
            '        a = a\n' +
            '    }\n' +
            '    return e;\n' +
            '}';
        const parsed=parseCode(input);
        handleFuncArgs('x=1')
        symbolicSubstitution(input,parsed)
        const nodes=CFG.createGraph(parsed);
        assert.ifError(nodes.next.false.next.content);
    });

    it('Test 15 - logical', () => {
        const codeLns=
            'function foo() {\n' +
            '\tif (0==0)\n' +
            '\treturn a;\n' +
            '}';
        assert.equal(symbolicSubstitution(codeLns,parseCode(codeLns)).length, 4);
        CFG.createGraph(parseCode(codeLns));
        let retVal = 'op0=>operation: <0>\n' +
            '|green\n' +
            'op1=>condition: <1>\n' +
            '(0 == 0)\n' +
            '|green\n' +
            'op2=>start: <2>\n' +
            '|green\n' +
            'op4=>operation: <4>\n' +
            'return a\n' +
            '|green\n' +
            'op0->op1\n' +
            'op1(yes)->op4\n' +
            'op1(no)->op2\n';
        assert.deepEqual(CFG.getGraphString(), retVal);
    });

    it('Test 16 - expression in globals', () => {
        const codeLns='function test16(x, z){\n' +
            '            if(x != 5)\n' +
            '            return 2;\n' +
            '\t\t\telse if (z || z)\n' +
            '\t\t\treturn 5;\n' +
            '\t\t\telse\n' +
            '\t\t\treturn -x;\n' +
            '\t}';
        handleFuncArgs('x=5, z = true');
        symbolicSubstitution(codeLns,parseCode(codeLns));
        assert.deepEqual(getColorsMap(),[false, true, false]);
    });
});
