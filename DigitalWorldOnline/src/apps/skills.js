import { createWindow, registerCleanup } from '../core/windowManager.js';
import { getLevel, getXP, getXPForNextLevel, getSkillPoints } from '../core/levelSystem.js';
import { getSkillsByBranch, isSkillUnlocked, canUnlockSkill, unlockSkill } from '../core/skillSystem.js';

const BRANCHES = [
  { id: 'hacking', name: 'Хакинг', emoji: '\u{1F513}' },
  { id: 'defense', name: 'Защита', emoji: '\u{1F6E1}\uFE0F' },
  { id: 'business', name: 'Бизнес', emoji: '\u{1F4BC}' },
  { id: 'programming', name: 'Программирование', emoji: '\u{1F4BB}' },
  { id: 'social', name: 'Социальные', emoji: '\u{1F4F0}' }
];

export function open() {
  const win = createWindow({
    title: '\u041d\u0430\u0432\u044b\u043a\u0438',
    icon: '/icons/skills.svg',
    appId: 'skills',
    width: 800,
    height: 600,
    content: '<div class="app-skills"></div>'
  });

  const container = win.element.querySelector('.app-skills');
  const state = { branch: 'hacking' };
  render(container, state);

  registerCleanup(win.id, () => {});
}

function render(container, state) {
  const level = getLevel();
  const xp = getXP();
  const xpNeeded = getXPForNextLevel();
  const skillPoints = getSkillPoints();
  const xpPercent = xpNeeded > 0 ? Math.floor((xp / xpNeeded) * 100) : 100;

  container.innerHTML = `
    <div class="skills-header">
      <div class="skills-level-info">
        <span class="skills-level-badge">\u{2B50} \u0423\u0440\u043e\u0432\u0435\u043d\u044c ${level}</span>
        <div class="skills-xp-bar-container">
          <div class="skills-xp-bar">
            <div class="skills-xp-fill" style="width: ${xpPercent}%"></div>
          </div>
          <span class="skills-xp-text">${xp} / ${xpNeeded} XP</span>
        </div>
        <span class="skills-points-badge">\u{1F4A0} \u041e\u0447\u043a\u0438 \u043d\u0430\u0432\u044b\u043a\u043e\u0432: ${skillPoints}</span>
      </div>
    </div>
    <div class="skills-tabs">
      ${BRANCHES.map(b => `
        <button class="skills-tab ${state.branch === b.id ? 'active' : ''}" data-branch="${b.id}">
          ${b.emoji} ${b.name}
        </button>
      `).join('')}
    </div>
    <div class="skills-tree-container">
      ${renderBranch(state.branch)}
    </div>
  `;

  container.querySelectorAll('.skills-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.branch = btn.dataset.branch;
      render(container, state);
    });
  });

  container.querySelectorAll('.skill-unlock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const skillId = btn.dataset.skillId;
      unlockSkill(skillId);
      render(container, state);
    });
  });
}

function renderBranch(branchId) {
  const skills = getSkillsByBranch(branchId);
  const level = getLevel();

  return skills.map((skill, index) => {
    const unlocked = isSkillUnlocked(skill.id);
    const available = canUnlockSkill(skill.id);
    let statusClass = 'locked';
    if (unlocked) statusClass = 'purchased';
    else if (available) statusClass = 'available';

    const connector = index < skills.length - 1
      ? '<div class="skill-connector"></div>'
      : '';

    let statusHtml = '';
    if (unlocked) {
      statusHtml = '<span class="skill-status-purchased">\u2713 \u0418\u0437\u0443\u0447\u0435\u043d\u043e</span>';
    } else if (available) {
      statusHtml = `<button class="skill-unlock-btn" data-skill-id="${skill.id}">\u0418\u0437\u0443\u0447\u0438\u0442\u044c</button>`;
    } else {
      statusHtml = `<span class="skill-status-locked">\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0443\u0440\u043e\u0432\u0435\u043d\u044c ${skill.levelReq}</span>`;
    }

    return `
      <div class="skill-node ${statusClass}">
        <div class="skill-node-content">
          <div class="skill-node-header">
            <span class="skill-node-name">${skill.name}</span>
            <span class="skill-node-cost">${skill.cost} \u043e\u0447.</span>
          </div>
          <p class="skill-node-desc">${skill.description}</p>
          <div class="skill-node-footer">
            ${statusHtml}
          </div>
        </div>
      </div>
      ${connector}
    `;
  }).join('');
}
