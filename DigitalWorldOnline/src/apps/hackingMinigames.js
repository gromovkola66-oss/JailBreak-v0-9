export function bruteforceMinigame(options = {}) {
  return new Promise((resolve) => {
    const overlay = createOverlay();
    const content = document.createElement('div');
    content.className = 'minigame-content minigame-bruteforce';

    let round = 0;
    const baseIntervals = options.enhanced ? [1500, 1000, 700] : [1200, 800, 500];
    const intervals = baseIntervals;
    let currentInterval = null;
    let targetSequence = '';
    let scrolling = true;

    content.innerHTML = `
      <div class="minigame-title">ВЗЛОМ ПАРОЛЯ</div>
      <div class="minigame-round">Раунд: <span id="mg-round">1</span>/3</div>
      <div class="bf-scroll-container" id="bf-scroll">
        <div class="bf-numbers" id="bf-numbers"></div>
        <div class="bf-center-zone"></div>
      </div>
      <div class="bf-target">Цель: <span id="bf-target" class="bf-target-value"></span></div>
      <div class="minigame-buttons">
        <button class="mg-btn mg-btn-action" id="bf-capture">ЗАХВАТ</button>
        <button class="mg-btn mg-btn-cancel" id="bf-cancel">Отмена</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const numbersEl = content.querySelector('#bf-numbers');
    const targetEl = content.querySelector('#bf-target');
    const roundEl = content.querySelector('#mg-round');
    const captureBtn = content.querySelector('#bf-capture');
    const cancelBtn = content.querySelector('#bf-cancel');

    function genSequence() {
      return String(Math.floor(1000 + Math.random() * 9000));
    }

    function startRound() {
      targetSequence = genSequence();
      targetEl.textContent = targetSequence;
      roundEl.textContent = round + 1;
      scrolling = true;
      runScroll();
    }

    function runScroll() {
      if (currentInterval) clearInterval(currentInterval);
      numbersEl.innerHTML = '';

      currentInterval = setInterval(() => {
        if (!scrolling) return;
        const lines = [];
        for (let i = 0; i < 7; i++) {
          const seq = i === 3 ? (Math.random() < 0.3 ? targetSequence : genSequence()) : genSequence();
          const isCenter = i === 3;
          lines.push(`<div class="bf-line ${isCenter ? 'bf-line-center' : ''}">${seq}</div>`);
        }
        numbersEl.innerHTML = lines.join('');
      }, intervals[round]);
    }

    captureBtn.addEventListener('click', () => {
      const centerLine = numbersEl.querySelector('.bf-line-center');
      if (!centerLine) return;

      const captured = centerLine.textContent.trim();
      scrolling = false;

      if (captured === targetSequence) {
        centerLine.classList.add('bf-line-success');
        round++;
        if (round >= 3) {
          setTimeout(() => cleanup(resolve, overlay, true), 500);
        } else {
          setTimeout(startRound, 600);
        }
      } else {
        centerLine.classList.add('bf-line-fail');
        setTimeout(() => cleanup(resolve, overlay, false), 500);
      }
    });

    cancelBtn.addEventListener('click', () => cleanup(resolve, overlay, false));

    startRound();

    function cleanup(res, ov, result) {
      if (currentInterval) clearInterval(currentInterval);
      ov.remove();
      res(result);
    }
  });
}

export function decryptMinigame() {
  return new Promise((resolve) => {
    const overlay = createOverlay();
    const content = document.createElement('div');
    content.className = 'minigame-content minigame-decrypt';

    const words = ['сервер', 'доступ', 'пароль', 'данные', 'ключ', 'шифр', 'взлом', 'система'];
    const word = words[Math.floor(Math.random() * words.length)];
    const shift = Math.floor(Math.random() * 5) + 1;
    const encoded = caesarEncode(word, shift);
    let timeLeft = 30;
    let timerInterval = null;

    const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

    content.innerHTML = `
      <div class="minigame-title">ДЕШИФРОВКА</div>
      <div class="dc-timer" id="dc-timer">Время: ${timeLeft}с</div>
      <div class="dc-encoded">Зашифровано: <span class="dc-encoded-word">${encoded}</span></div>
      <div class="dc-hint">Сдвиг: +${shift}</div>
      <div class="dc-alphabet">Алфавит: ${alphabet}</div>
      <div class="dc-input-row">
        <input type="text" class="dc-input" id="dc-input" placeholder="Введите ответ..." autocomplete="off" />
        <button class="mg-btn mg-btn-action" id="dc-submit">OK</button>
      </div>
      <div class="minigame-buttons">
        <button class="mg-btn mg-btn-cancel" id="dc-cancel">Отмена</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const timerEl = content.querySelector('#dc-timer');
    const inputEl = content.querySelector('#dc-input');
    const submitBtn = content.querySelector('#dc-submit');
    const cancelBtn = content.querySelector('#dc-cancel');

    inputEl.focus();

    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `Время: ${timeLeft}с`;
      if (timeLeft <= 10) timerEl.classList.add('dc-timer-urgent');
      if (timeLeft <= 5) timerEl.classList.add('dc-timer-critical');
      if (timeLeft <= 0) {
        finish(false);
      }
    }, 1000);

    function checkAnswer() {
      const answer = inputEl.value.trim().toLowerCase();
      finish(answer === word);
    }

    submitBtn.addEventListener('click', checkAnswer);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkAnswer();
    });
    cancelBtn.addEventListener('click', () => finish(false));

    function finish(result) {
      if (timerInterval) clearInterval(timerInterval);
      overlay.remove();
      resolve(result);
    }
  });
}

export function exploitMinigame() {
  return new Promise((resolve) => {
    const overlay = createOverlay();
    const content = document.createElement('div');
    content.className = 'minigame-content minigame-exploit';

    const gridSize = 4;
    const connections = generateConnections(gridSize);
    let path = [0];
    let wrongClicks = 0;
    let timeLeft = 45;
    let timerInterval = null;
    const endNode = gridSize * gridSize - 1;

    content.innerHTML = `
      <div class="minigame-title">ОБХОД ФАЙРВОЛА</div>
      <div class="ex-timer" id="ex-timer">Время: ${timeLeft}с</div>
      <div class="ex-info">Ошибки: <span id="ex-errors">0</span>/3</div>
      <div class="ex-grid" id="ex-grid"></div>
      <div class="minigame-buttons">
        <button class="mg-btn mg-btn-cancel" id="ex-cancel">Отмена</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const gridEl = content.querySelector('#ex-grid');
    const timerEl = content.querySelector('#ex-timer');
    const errorsEl = content.querySelector('#ex-errors');
    const cancelBtn = content.querySelector('#ex-cancel');

    renderGrid();

    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `Время: ${timeLeft}с`;
      if (timeLeft <= 15) timerEl.classList.add('dc-timer-urgent');
      if (timeLeft <= 5) timerEl.classList.add('dc-timer-critical');
      if (timeLeft <= 0) finish(false);
    }, 1000);

    cancelBtn.addEventListener('click', () => finish(false));

    function renderGrid() {
      gridEl.innerHTML = '';
      gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

      for (let i = 0; i < gridSize * gridSize; i++) {
        const node = document.createElement('div');
        node.className = 'ex-node';
        node.dataset.index = i;

        if (i === 0) node.classList.add('ex-node-start');
        if (i === endNode) node.classList.add('ex-node-end');
        if (path.includes(i)) node.classList.add('ex-node-active');

        // Show connections as visual indicators
        const nodeConns = connections.filter(c => c.includes(i));
        if (nodeConns.length > 0) {
          const connDirs = [];
          nodeConns.forEach(c => {
            const other = c[0] === i ? c[1] : c[0];
            if (other === i - 1) connDirs.push('left');
            if (other === i + 1) connDirs.push('right');
            if (other === i - gridSize) connDirs.push('top');
            if (other === i + gridSize) connDirs.push('bottom');
          });
          connDirs.forEach(d => node.classList.add('ex-conn-' + d));
        }

        node.addEventListener('click', () => handleNodeClick(i));
        gridEl.appendChild(node);
      }
    }

    function handleNodeClick(index) {
      if (path.includes(index)) return;

      const lastNode = path[path.length - 1];
      const isConnected = connections.some(c =>
        (c[0] === lastNode && c[1] === index) || (c[0] === index && c[1] === lastNode)
      );

      if (!isConnected) {
        wrongClicks++;
        errorsEl.textContent = wrongClicks;
        if (wrongClicks >= 3) {
          finish(false);
        }
        return;
      }

      path.push(index);
      renderGrid();

      if (index === endNode) {
        finish(true);
      }
    }

    function finish(result) {
      if (timerInterval) clearInterval(timerInterval);
      overlay.remove();
      resolve(result);
    }
  });
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'minigame-overlay';
  return overlay;
}

function caesarEncode(word, shift) {
  const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  return word.split('').map(ch => {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) return ch;
    return alphabet[(idx + shift) % alphabet.length];
  }).join('');
}

function generateConnections(gridSize) {
  const connections = [];
  const totalNodes = gridSize * gridSize;

  // Generate a guaranteed path from 0 to end
  const visited = new Set([0]);
  let current = 0;
  const end = totalNodes - 1;

  while (current !== end) {
    const neighbors = getNeighbors(current, gridSize).filter(n => !visited.has(n));
    if (neighbors.length === 0) break;

    // Prefer moving toward the end
    const sorted = neighbors.sort((a, b) => {
      const aRow = Math.floor(a / gridSize);
      const aCol = a % gridSize;
      const bRow = Math.floor(b / gridSize);
      const bCol = b % gridSize;
      const aDist = Math.abs(aRow - (gridSize - 1)) + Math.abs(aCol - (gridSize - 1));
      const bDist = Math.abs(bRow - (gridSize - 1)) + Math.abs(bCol - (gridSize - 1));
      return aDist - bDist;
    });

    const next = Math.random() < 0.7 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
    connections.push([current, next]);
    visited.add(next);
    current = next;
  }

  // If path dead-ended before reaching end, force a connection chain to end
  if (current !== end) {
    let walker = current;
    while (walker !== end) {
      const neighbors = getNeighbors(walker, gridSize);
      // Prefer unvisited nodes closer to end
      const sorted = neighbors
        .filter(n => n !== walker)
        .sort((a, b) => {
          const aVisited = visited.has(a) ? 1 : 0;
          const bVisited = visited.has(b) ? 1 : 0;
          if (aVisited !== bVisited) return aVisited - bVisited;
          const aRow = Math.floor(a / gridSize);
          const aCol = a % gridSize;
          const bRow = Math.floor(b / gridSize);
          const bCol = b % gridSize;
          const aDist = Math.abs(aRow - (gridSize - 1)) + Math.abs(aCol - (gridSize - 1));
          const bDist = Math.abs(bRow - (gridSize - 1)) + Math.abs(bCol - (gridSize - 1));
          return aDist - bDist;
        });

      const next = sorted[0];
      const exists = connections.some(c =>
        (c[0] === walker && c[1] === next) || (c[0] === next && c[1] === walker)
      );
      if (!exists) {
        connections.push([walker, next]);
      }
      visited.add(next);
      walker = next;
    }
  }

  // Add some random extra connections
  for (let i = 0; i < totalNodes; i++) {
    const neighbors = getNeighbors(i, gridSize);
    neighbors.forEach(n => {
      if (Math.random() < 0.3) {
        const exists = connections.some(c =>
          (c[0] === i && c[1] === n) || (c[0] === n && c[1] === i)
        );
        if (!exists) {
          connections.push([i, n]);
        }
      }
    });
  }

  return connections;
}

function getNeighbors(index, gridSize) {
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  const neighbors = [];

  if (row > 0) neighbors.push(index - gridSize);
  if (row < gridSize - 1) neighbors.push(index + gridSize);
  if (col > 0) neighbors.push(index - 1);
  if (col < gridSize - 1) neighbors.push(index + 1);

  return neighbors;
}
