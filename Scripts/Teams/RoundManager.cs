using UnityEngine;
using System.Collections.Generic;

public enum RoundState
{
    WaitingForTeamSelect,
    PreRound,
    Active,
    PostRound
}

public class RoundManager : MonoBehaviour
{
    public static RoundManager Instance { get; private set; }

    public RoundState roundState = RoundState.WaitingForTeamSelect;
    public float roundDuration = 300f;
    public float preRoundDuration = 3f;
    public float postRoundDuration = 5f;
    public float roundTimer = 300f;
    public bool cellsOpen = false;

    public int guardWins = 0;
    public int prisonerWins = 0;
    public string winnerText = "";

    private float preRoundTimer = 0f;
    private float postRoundTimer = 0f;

    void Awake()
    {
        if (Instance == null)
            Instance = this;
        else
            Destroy(gameObject);
    }

    void Update()
    {
        switch (roundState)
        {
            case RoundState.WaitingForTeamSelect:
                break;

            case RoundState.PreRound:
                preRoundTimer -= Time.deltaTime;
                if (preRoundTimer <= 0f)
                {
                    roundState = RoundState.Active;
                    roundTimer = roundDuration;
                }
                break;

            case RoundState.Active:
                roundTimer -= Time.deltaTime;
                if (roundTimer <= 0f)
                {
                    roundTimer = 0f;
                    EndRound(Team.Guard, "Time expired - Guards win!");
                }
                CheckWinConditions();
                break;

            case RoundState.PostRound:
                postRoundTimer -= Time.deltaTime;
                if (postRoundTimer <= 0f)
                {
                    RestartRound();
                }
                break;
        }
    }

    public void StartRound()
    {
        roundState = RoundState.PreRound;
        preRoundTimer = preRoundDuration;
        cellsOpen = false;
        winnerText = "";
    }

    public void OpenCells()
    {
        cellsOpen = true;
    }

    public void OnEntityDied(GameObject entity)
    {
        if (roundState != RoundState.Active) return;
        CheckWinConditions();
    }

    private void CheckWinConditions()
    {
        if (roundState != RoundState.Active) return;
        if (TeamManager.Instance == null) return;

        List<GameObject> guards = TeamManager.Instance.GetTeamMembers(Team.Guard);
        List<GameObject> prisoners = TeamManager.Instance.GetTeamMembers(Team.Prisoner);

        int aliveGuards = CountAlive(guards);
        int alivePrisoners = CountAlive(prisoners);

        if (alivePrisoners <= 0 && prisoners.Count > 0)
        {
            EndRound(Team.Guard, "All prisoners eliminated - Guards win!");
        }
        else if (aliveGuards <= 0 && guards.Count > 0)
        {
            EndRound(Team.Prisoner, "All guards eliminated - Prisoners win!");
        }
    }

    private int CountAlive(List<GameObject> entities)
    {
        int count = 0;
        foreach (GameObject entity in entities)
        {
            if (entity == null) continue;

            HealthSystem hs = entity.GetComponent<HealthSystem>();
            if (hs != null && hs.IsAlive) { count++; continue; }

            BotHealth bh = entity.GetComponent<BotHealth>();
            if (bh != null && bh.IsAlive) { count++; continue; }
        }
        return count;
    }

    private void EndRound(Team winner, string message)
    {
        roundState = RoundState.PostRound;
        postRoundTimer = postRoundDuration;
        winnerText = message;

        if (winner == Team.Guard)
            guardWins++;
        else
            prisonerWins++;
    }

    private void RestartRound()
    {
        roundState = RoundState.WaitingForTeamSelect;
        cellsOpen = false;
        winnerText = "";
        roundTimer = roundDuration;

        TeamSelectUI teamSelectUI = FindFirstObjectByType<TeamSelectUI>();
        if (teamSelectUI != null)
            teamSelectUI.Show();

        HealthSystem playerHealth = FindFirstObjectByType<HealthSystem>();
        if (playerHealth != null)
        {
            playerHealth.ResetHealth();
            PlayerController pc = playerHealth.GetComponent<PlayerController>();
            if (pc != null)
            {
                Team team = pc.team;
                Vector3 spawn = TeamManager.Instance != null ? TeamManager.Instance.GetSpawnPoint(team) : Vector3.zero;
                pc.Respawn(spawn);
            }
        }

        SpectateCamera spec = FindFirstObjectByType<SpectateCamera>();
        if (spec != null)
        {
            spec.DisableSpectate();
        }

        BotController[] bots = FindObjectsByType<BotController>(FindObjectsSortMode.None);
        foreach (BotController bot in bots)
        {
            BotHealth bh = bot.GetComponent<BotHealth>();
            if (bh != null) bh.ResetHealth();
            bot.ResetBot();
        }
    }

    public float GetTimerSeconds()
    {
        return roundTimer;
    }
}
