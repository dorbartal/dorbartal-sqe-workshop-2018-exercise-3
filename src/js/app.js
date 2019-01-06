import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode} from './code-analyzer';
import * as symbolicSub from './symbolic-subtitution';
import {createGraph, getGraphString} from './CFG';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        symbolicSub.clearVarsMap();
        symbolicSub.handleFuncArgs($('#input').val());
        $('.red').remove();
        $('.green').remove();
        $('.white').remove();
        document.getElementById('diagram').innerHTML = '';
        paint(symbolicSub.symbolicSubstitution(codeToParse, parsedCode));
        createGraph(parsedCode);
        drawGraph(getGraphString());
        //draw(myTable);
    });
});
const getColor = (line, scope, colorsMap) => {
    if(line.includes('if') || line.includes('else'))
        return colorsMap[scope] ? 'green' : 'red';
    return 'white';
};

const paint = (codeLines) => {
    let scope = 0;
    let colorsMap = symbolicSub.getColorsMap();
    codeLines.forEach(line => {
        let color = getColor(line, scope, colorsMap);
        if(color != 'white')
            scope++;
        $('#res').append($('<div>' + line + '</div>').addClass(color));
    });
};

function drawGraph(gString)
{
    var diagram = flowchart.parse(gString);
    diagram.drawSVG('diagram', {
        'x': 0, 'y': 0,
        'line-width': 3, 'line-length': 50, 'text-margin': 10, 'font-size': 12, 'font-color': 'black', 'line-color': 'black',
        'element-color': 'black', 'fill': 'white', 'yes-text': 'T', 'no-text': 'F', 'arrow-end': 'block', 'scale': 1,
        'symbols': {
            'start': {
                'font-color': 'black', 'element-color': 'green', 'fill': 'yellow' ,'start-text': '',
            },
            'end':{
                'class': 'end-element'
            }
        },
        'flowstate' : {
            'green' : { 'fill' : 'green'}, 'white': {'fill' : 'white'}
        }
    });
}