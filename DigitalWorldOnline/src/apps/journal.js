import { createWindow } from '../core/windowManager.js';
import { getAvailableQuests, getActiveQuests, getCompletedQuests, startQuest, getQuestById } from '../core/questSystem.js';
import { getNpcById } from '../core/npcSystem.js';

export function open() {
  const win = createWindow({
    title: '\u0416\u0443\u0440\u043d\u0430\u043b',
    icon: '/icons/journal.svg',
    appId: 'journal',
    width: 650,
    height: 500,
    content: '<div class="app-journal"></div>'
  });

  const container = win.element.querySelector('.app-journal');
  const state = { tab: 'active' };
  render(container, state);
}

function render(container, state) {
  const activeQuests = getActiveQuests();
  const availableQuests = getAvailableQuests();
  const completedQuests = getCompletedQuests();

  container.innerHTML = `
    <div class="journal-header">
      <h1 class="journal-title">\u{1F4D6} \u0416\u0443\u0440\u043d\u0430\u043b \u043a\u0432\u0435\u0441\u0442\u043e\u0432</h1>
    </div>
    <div class="journal-tabs">
      <button class="journal-tab ${state.tab === 'active' ? 'active' : ''}" data-tab="active">\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 (${activeQuests.length})</button>
      <button class="journal-tab ${state.tab === 'available' ? 'active' : ''}" data-tab="available">\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 (${availableQuests.length})</button>
      <button class="journal-tab ${state.tab === 'completed' ? 'active' : ''}" data-tab="completed">\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043d\u043d\u044b\u0435 (${completedQuests.length})</button>
    </div>
    <div class="journal-content"></div>
  `;

  const contentEl = container.querySelector('.journal-content');

  if (state.tab === 'active') {
    renderActiveQuests(contentEl, activeQuests, container, state);
  } else if (state.tab === 'available') {
    renderAvailableQuests(contentEl, availableQuests, container, state);
  } else {
    renderCompletedQuests(contentEl, completedQuests);
  }

  container.querySelectorAll('.journal-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.tab = btn.dataset.tab;
      render(container, state);
    });
  });
}

function renderActiveQuests(contentEl, quests, container, state) {
  if (quests.length === 0) {
    contentEl.innerHTML = '<p class="journal-empty">\u041d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043a\u0432\u0435\u0441\u0442\u043e\u0432</p>';
    return;
  }

  contentEl.innerHTML = quests.map(quest => {
    const giver = getNpcById(quest.giver);
    const giverName = giver ? giver.name : quest.giver;
    const stepsHtml = quest.steps.map(step => {
      const done = step.current >= step.required;
      return `
        <div class="journal-objective ${done ? 'done' : ''}">
          <span class="journal-objective-icon">${done ? '\u2713' : '\u25CB'}</span>
          <span class="journal-objective-text">${step.desc}</span>
          <span class="journal-objective-progress">${step.current}/${step.required}</span>
        </div>
      `;
    }).join('');

    const rewardsHtml = renderRewards(quest.rewards);

    return `
      <div class="journal-quest-card active">
        <div class="journal-quest-header">
          <h3 class="journal-quest-title">${quest.title}</h3>
          <span class="journal-quest-type">${quest.type === 'main' ? '\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439' : '\u041f\u043e\u0431\u043e\u0447\u043d\u044b\u0439'}</span>
        </div>
        <p class="journal-quest-giver">\u043e\u0442 ${giverName}</p>
        <p class="journal-quest-desc">${quest.description}</p>
        <div class="journal-objectives">${stepsHtml}</div>
        ${rewardsHtml}
      </div>
    `;
  }).join('');
}

function renderAvailableQuests(contentEl, quests, container, state) {
  if (quests.length === 0) {
    contentEl.innerHTML = '<p class="journal-empty">\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u043a\u0432\u0435\u0441\u0442\u043e\u0432</p>';
    return;
  }

  contentEl.innerHTML = quests.map(quest => {
    const giver = getNpcById(quest.giver);
    const giverName = giver ? giver.name : quest.giver;
    const rewardsHtml = renderRewards(quest.rewards);

    return `
      <div class="journal-quest-card available">
        <div class="journal-quest-header">
          <h3 class="journal-quest-title">${quest.title}</h3>
          <span class="journal-quest-type">${quest.type === 'main' ? '\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439' : '\u041f\u043e\u0431\u043e\u0447\u043d\u044b\u0439'}</span>
        </div>
        <p class="journal-quest-giver">\u043e\u0442 ${giverName}</p>
        <p class="journal-quest-desc">${quest.description}</p>
        ${rewardsHtml}
        <button class="journal-start-btn" data-quest-id="${quest.id}">\u041d\u0430\u0447\u0430\u0442\u044c \u043a\u0432\u0435\u0441\u0442</button>
      </div>
    `;
  }).join('');

  contentEl.querySelectorAll('.journal-start-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startQuest(btn.dataset.questId);
      render(container, state);
    });
  });
}

function renderCompletedQuests(contentEl, quests) {
  if (quests.length === 0) {
    contentEl.innerHTML = '<p class="journal-empty">\u041d\u0435\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d\u043d\u044b\u0445 \u043a\u0432\u0435\u0441\u0442\u043e\u0432</p>';
    return;
  }

  contentEl.innerHTML = quests.map(quest => {
    const giver = getNpcById(quest.giver);
    const giverName = giver ? giver.name : quest.giver;
    const rewardsHtml = renderRewards(quest.rewards);

    return `
      <div class="journal-quest-card completed">
        <div class="journal-quest-header">
          <h3 class="journal-quest-title">${quest.title}</h3>
          <span class="journal-quest-badge-done">\u2713 \u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d</span>
        </div>
        <p class="journal-quest-giver">\u043e\u0442 ${giverName}</p>
        <p class="journal-quest-desc">${quest.description}</p>
        ${rewardsHtml}
      </div>
    `;
  }).join('');
}

function renderRewards(rewards) {
  if (!rewards) return '';
  const parts = [];
  if (rewards.dc) parts.push(`<span class="journal-reward-badge">\u{1F4B0} ${rewards.dc} DC</span>`);
  if (rewards.whiteRep && rewards.whiteRep > 0) parts.push(`<span class="journal-reward-badge white">\u2B50 +${rewards.whiteRep} \u0440\u0435\u043f.</span>`);
  if (rewards.blackRep) parts.push(`<span class="journal-reward-badge black">\u{1F480} +${rewards.blackRep} \u0442\u0451\u043c. \u0440\u0435\u043f.</span>`);
  if (rewards.relationship) {
    for (const [npcId, amount] of Object.entries(rewards.relationship)) {
      const npc = getNpcById(npcId);
      const name = npc ? npc.name.split(' ')[0] : npcId;
      parts.push(`<span class="journal-reward-badge rel">\u2764 +${amount} ${name}</span>`);
    }
  }
  if (parts.length === 0) return '';
  return `<div class="journal-rewards">${parts.join('')}</div>`;
}
