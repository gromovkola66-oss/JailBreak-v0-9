import * as THREE from 'three';

export type Team = 'none' | 'guard' | 'prisoner';
export type GuardRole = 'guard' | 'warden'; // warden = начальник охраны

export interface PlayerInfo {
  team: Team;
  guardRole?: GuardRole;
  spawnPoint: THREE.Vector3;
}

export class TeamSystem {
  private currentTeam: Team = 'none';
  private guardRole: GuardRole = 'guard';
  
  // Точки спавна
  private readonly guardSpawnPoints: THREE.Vector3[] = [
    new THREE.Vector3(8, 1.7, 2),    // В оружейной
    new THREE.Vector3(8, 1.7, 0),
    new THREE.Vector3(8, 1.7, 4),
    new THREE.Vector3(6, 1.7, 2),
  ];
  
  private readonly prisonerSpawnPoints: THREE.Vector3[] = [
    new THREE.Vector3(-15, 1.7, -10),  // Камера 1
    new THREE.Vector3(-15, 1.7, -4),   // Камера 2
    new THREE.Vector3(-15, 1.7, 2),    // Камера 3
    new THREE.Vector3(-15, 1.7, 8),    // Камера 4
  ];

  // Callbacks
  public onTeamSelected?: (info: PlayerInfo) => void;

  constructor() {}

  getTeam(): Team {
    return this.currentTeam;
  }

  getGuardRole(): GuardRole {
    return this.guardRole;
  }

  isTeamSelected(): boolean {
    return this.currentTeam !== 'none';
  }

  selectTeam(team: 'guard' | 'prisoner', role?: GuardRole) {
    this.currentTeam = team;
    if (team === 'guard' && role) {
      this.guardRole = role;
    }

    const spawnPoint = this.getSpawnPoint();
    
    if (this.onTeamSelected) {
      this.onTeamSelected({
        team: this.currentTeam,
        guardRole: team === 'guard' ? this.guardRole : undefined,
        spawnPoint
      });
    }
  }

  private getSpawnPoint(): THREE.Vector3 {
    if (this.currentTeam === 'guard') {
      const index = Math.floor(Math.random() * this.guardSpawnPoints.length);
      return this.guardSpawnPoints[index].clone();
    } else {
      const index = Math.floor(Math.random() * this.prisonerSpawnPoints.length);
      return this.prisonerSpawnPoints[index].clone();
    }
  }

  getTeamColor(): number {
    switch (this.currentTeam) {
      case 'guard': return 0x3b82f6; // синий
      case 'prisoner': return 0xf97316; // оранжевый
      default: return 0xffffff;
    }
  }

  getTeamName(): string {
    if (this.currentTeam === 'guard') {
      return this.guardRole === 'warden' ? 'Начальник охраны' : 'Охранник';
    }
    return 'Заключённый';
  }

  // Статистика команд (для баланса 4:1)
  getTeamBalance(guardCount: number, prisonerCount: number): {
    canJoinGuard: boolean;
    canJoinPrisoner: boolean;
    message: string;
  } {
    const idealRatio = 4; // 4 зека на 1 охранника
    const totalPlayers = guardCount + prisonerCount;
    
    if (totalPlayers === 0) {
      return { canJoinGuard: true, canJoinPrisoner: true, message: '' };
    }

    const idealGuards = Math.ceil(totalPlayers / (idealRatio + 1));
    // idealPrisoners = totalPlayers - idealGuards (для будущего использования)

    const canJoinGuard = guardCount < idealGuards || prisonerCount >= idealRatio * (guardCount + 1);
    const canJoinPrisoner = true; // Всегда можно стать зеком

    let message = '';
    if (!canJoinGuard) {
      message = 'Слишком много охранников! Нужно больше заключённых.';
    }

    return { canJoinGuard, canJoinPrisoner, message };
  }

  reset() {
    this.currentTeam = 'none';
    this.guardRole = 'guard';
  }
}
