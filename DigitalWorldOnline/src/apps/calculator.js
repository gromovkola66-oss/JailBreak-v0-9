import { createWindow } from '../core/windowManager.js';

export function open() {
  const win = createWindow({
    title: 'Calculator',
    icon: '/icons/calculator.svg',
    appId: 'calculator',
    width: 320,
    height: 480,
    minWidth: 280,
    minHeight: 400,
    content: '<div class="app-calculator"></div>'
  });

  const container = win.element.querySelector('.app-calculator');
  const state = {
    expression: '',
    display: '0',
    lastResult: null,
    newNumber: true
  };

  render(container, state);
}

function render(container, state) {
  container.innerHTML = `
    <div class="calculator-display">
      <div class="calculator-expression">${state.expression}</div>
      <div class="calculator-result">${state.display}</div>
    </div>
    <div class="calculator-buttons">
      <button class="calc-btn calc-btn-clear" data-action="clear">C</button>
      <button class="calc-btn calc-btn-clear" data-action="backspace">&#9003;</button>
      <button class="calc-btn calc-btn-operator" data-action="operator" data-value="%">%</button>
      <button class="calc-btn calc-btn-operator" data-action="operator" data-value="/">/</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="7">7</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="8">8</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="9">9</button>
      <button class="calc-btn calc-btn-operator" data-action="operator" data-value="*">&times;</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="4">4</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="5">5</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="6">6</button>
      <button class="calc-btn calc-btn-operator" data-action="operator" data-value="-">-</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="1">1</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="2">2</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="3">3</button>
      <button class="calc-btn calc-btn-operator" data-action="operator" data-value="+">+</button>
      <button class="calc-btn calc-btn-number" data-action="negate">+/-</button>
      <button class="calc-btn calc-btn-number" data-action="number" data-value="0">0</button>
      <button class="calc-btn calc-btn-number" data-action="decimal">.</button>
      <button class="calc-btn calc-btn-equals" data-action="equals">=</button>
    </div>
  `;

  const display = container.querySelector('.calculator-result');
  const expression = container.querySelector('.calculator-expression');

  container.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const value = btn.dataset.value;

      switch (action) {
        case 'number':
          if (state.newNumber) {
            state.display = value;
            state.newNumber = false;
          } else {
            state.display = state.display === '0' ? value : state.display + value;
          }
          break;

        case 'decimal':
          if (state.newNumber) {
            state.display = '0.';
            state.newNumber = false;
          } else if (!state.display.includes('.')) {
            state.display += '.';
          }
          break;

        case 'operator':
          state.expression += state.display + ' ' + value + ' ';
          state.newNumber = true;
          break;

        case 'equals':
          const fullExpr = state.expression + state.display;
          state.expression = '';
          try {
            const result = safeEval(fullExpr);
            if (result === Infinity || result === -Infinity || isNaN(result)) {
              state.display = 'Error';
            } else {
              state.display = formatNumber(result);
            }
          } catch (e) {
            state.display = 'Error';
          }
          state.newNumber = true;
          expression.textContent = fullExpr + ' =';
          display.textContent = state.display;
          return;

        case 'clear':
          state.display = '0';
          state.expression = '';
          state.newNumber = true;
          break;

        case 'backspace':
          if (state.display.length > 1) {
            state.display = state.display.slice(0, -1);
          } else {
            state.display = '0';
            state.newNumber = true;
          }
          break;

        case 'negate':
          if (state.display !== '0') {
            state.display = state.display.startsWith('-')
              ? state.display.slice(1)
              : '-' + state.display;
          }
          break;
      }

      display.textContent = state.display;
      expression.textContent = state.expression;
    });
  });
}

function safeEval(expr) {
  // Replace display operators with JS operators
  expr = expr.replace(/\s+/g, ' ').trim();
  // Handle percentage
  expr = expr.replace(/(\d+\.?\d*)\s*%/g, '($1/100)');

  // Tokenize and parse using a recursive descent parser
  // No Function() or eval() - only supports numbers and +-*/() operators
  const tokens = tokenize(expr);
  const result = parseExpression(tokens);
  if (tokens.pos < tokens.list.length) {
    throw new Error('Unexpected token');
  }
  return result;
}

function tokenize(expr) {
  const list = [];
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === ' ') {
      i++;
      continue;
    }
    if ('+-*/()'.includes(expr[i])) {
      list.push({ type: 'op', value: expr[i] });
      i++;
    } else if (/[0-9.]/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      const parsed = parseFloat(num);
      if (isNaN(parsed)) throw new Error('Invalid number');
      list.push({ type: 'num', value: parsed });
    } else {
      throw new Error('Invalid character');
    }
  }
  return { list, pos: 0 };
}

// Grammar:
// expression = term (('+' | '-') term)*
// term = unary (('*' | '/') unary)*
// unary = ('-' | '+')? factor
// factor = '(' expression ')' | number

function parseExpression(tokens) {
  let left = parseTerm(tokens);
  while (tokens.pos < tokens.list.length) {
    const tok = tokens.list[tokens.pos];
    if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      tokens.pos++;
      const right = parseTerm(tokens);
      left = tok.value === '+' ? left + right : left - right;
    } else {
      break;
    }
  }
  return left;
}

function parseTerm(tokens) {
  let left = parseUnary(tokens);
  while (tokens.pos < tokens.list.length) {
    const tok = tokens.list[tokens.pos];
    if (tok.type === 'op' && (tok.value === '*' || tok.value === '/')) {
      tokens.pos++;
      const right = parseUnary(tokens);
      left = tok.value === '*' ? left * right : left / right;
    } else {
      break;
    }
  }
  return left;
}

function parseUnary(tokens) {
  if (tokens.pos < tokens.list.length) {
    const tok = tokens.list[tokens.pos];
    if (tok.type === 'op' && (tok.value === '-' || tok.value === '+')) {
      tokens.pos++;
      const val = parseFactor(tokens);
      return tok.value === '-' ? -val : val;
    }
  }
  return parseFactor(tokens);
}

function parseFactor(tokens) {
  if (tokens.pos >= tokens.list.length) {
    throw new Error('Unexpected end of expression');
  }
  const tok = tokens.list[tokens.pos];
  if (tok.type === 'num') {
    tokens.pos++;
    return tok.value;
  }
  if (tok.type === 'op' && tok.value === '(') {
    tokens.pos++;
    const val = parseExpression(tokens);
    if (tokens.pos >= tokens.list.length || tokens.list[tokens.pos].value !== ')') {
      throw new Error('Missing closing parenthesis');
    }
    tokens.pos++;
    return val;
  }
  throw new Error('Unexpected token');
}

function formatNumber(num) {
  if (Number.isInteger(num)) return num.toString();
  const str = num.toPrecision(10);
  return parseFloat(str).toString();
}
