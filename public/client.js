'use strict';

var value = 0;

var states = {
    "start": 0,
    "operand1": 1,
    "operator": 2,
    "operand2": 3,
    "complete": 4
};

var state = states.start;

var operand1 = 0;
var operand2 = 0;
var operation = null;

function calculate(operand1, operand2, operation) {
    var uri = location.origin + "/arithmetic";

    switch (operation) {
        case '+':
            uri += "?operation=add";
            break;
        case '-':
            uri += "?operation=subtract";
            break;
        case '*':
            uri += "?operation=multiply";
            break;
        case '/':
            uri += "?operation=divide";
            break;
        case '^':
            uri += "?operation=power";
            break;
        default:
            setError();
            return;
    }

    uri += "&operand1=" + encodeURIComponent(operand1);
    uri += "&operand2=" + encodeURIComponent(operand2);

    setLoading(true);

    var http = new XMLHttpRequest();
    http.open("GET", uri, true);
    http.onload = function () {
        setLoading(false);

        if (http.status == 200) {
            var response = JSON.parse(http.responseText);
            setValue(response.result);
        } else {
            setError();
        }
    };
    http.send(null);
}

function clearPressed() {
    setValue(0);

    operand1 = 0;
    operand2 = 0;
    operation = null;
    state = states.start;
}

function clearEntryPressed() {
    setValue(0);
    state = (state == states.operand2) ? states.operator : states.start;
}

function numberPressed(n) {
    var current = getValue();

    if (state == states.start || state == states.complete) {
        current = n.toString();
        state = (n == '0' ? states.start : states.operand1);
    } else if (state == states.operator) {
        current = n.toString();
        state = (n == '0' ? states.operator : states.operand2);
    } else if (current.replace(/[-\.]/g, '').length < 8) {
        current += n;
    }

    setValue(current);
}

function decimalPressed() {
    if (state == states.start || state == states.complete) {
        setValue('0.');
        state = states.operand1;
    } else if (state == states.operator) {
        setValue('0.');
        state = states.operand2;
    } else if (!getValue().toString().includes('.')) {
        setValue(getValue() + '.');
    }
}

function signPressed() {
    var value = getValue();

    if (value != 0) {
        setValue(-1 * value);
    }
}

function operationPressed(op) {
    operand1 = getValue();
    operation = op;
    state = states.operator;
}

function equalPressed() {
    if (state < states.operand2) {
        state = states.complete;
        return;
    }

    if (state == states.operand2) {
        operand2 = getValue();
        state = states.complete;
    } else if (state == states.complete) {
        operand1 = getValue();
    }

    calculate(operand1, operand2, operation);
}

// Keyboard handling: numbers, decimal, operators (^ included), Enter, Backspace, Escape
document.addEventListener('keydown', (event) => {
    const k = event.key;

    if (/^\d$/.test(k)) {
        numberPressed(k);
        return;
    }

    if (k === '.') {
        decimalPressed();
        return;
    }

    if (/^[\+\-\*\/\^]$/.test(k)) {
        operationPressed(k);
        return;
    }

    if (k === 'Enter') {
        equalPressed();
        return;
    }

    if (k === 'Backspace') {
        clearEntryPressed();
        return;
    }

    if (k === 'Escape') {
        clearPressed();
        return;
    }
});

function getValue() {
    return value === undefined || value === null ? "0" : value.toString();
}

function setValue(n) {
    value = n;
    var numeric = Number(n);
    var displayValue;

    if (n === 'ERROR') {
        displayValue = 'ERROR';
    } else if (!isFinite(numeric) || isNaN(numeric)) {
        displayValue = n.toString();
    } else {
        if (numeric > 99999999 || numeric < -99999999 ||
            (numeric > 0 && numeric < 0.0000001) ||
            (numeric < 0 && numeric > -0.0000001)) {
            displayValue = numeric.toExponential(4);
        } else {
            displayValue = numeric.toString();
        }
    }

    var chars = displayValue.toString().split("");
    var html = "";

    for (var c of chars) {
        if (c == '-') {
            html += "<span class=\"resultchar negative\">" + c + "</span>";
        } else if (c == '.') {
            html += "<span class=\"resultchar decimal\">" + c + "</span>";
        } else if (c == 'e') {
            html += "<span class=\"resultchar exponent\">e</span>";
        } else if (c != '+') {
            html += "<span class=\"resultchar digit" + c + "\">" + c + "</span>";
        }
    }

    document.getElementById("result").innerHTML = html;
}

function setError(n) {
    document.getElementById("result").innerHTML = "ERROR";
}

function setLoading(loading) {
    if (loading) {
        document.getElementById("loading").style.visibility = "visible";
    } else {
        document.getElementById("loading").style.visibility = "hidden";
    }

    var buttons = document.querySelectorAll("BUTTON");

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = loading;
    }
}
