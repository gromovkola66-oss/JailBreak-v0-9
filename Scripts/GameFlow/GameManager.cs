using UnityEngine;

public enum GameState
{
    TeamSelect,
    Playing,
    RoundEnd
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public GameState gameState = GameState.TeamSelect;
    public GameObject player;

    private RoundManager roundManager;
    private TeamManager teamManager;

    void Awake()
    {
        if (Instance == null)
            Instance = this;
        else
            Destroy(gameObject);
    }

    void Start()
    {
        roundManager = FindFirstObjectByType<RoundManager>();
        teamManager = FindFirstObjectByType<TeamManager>();
        player = GameObject.FindWithTag("Player");
        if (player == null)
        {
            PlayerController pc = FindFirstObjectByType<PlayerController>();
            if (pc != null) player = pc.gameObject;
        }
    }

    void Update()
    {
        if (roundManager == null) return;

        switch (roundManager.roundState)
        {
            case RoundState.WaitingForTeamSelect:
                gameState = GameState.TeamSelect;
                break;
            case RoundState.PreRound:
            case RoundState.Active:
                gameState = GameState.Playing;
                break;
            case RoundState.PostRound:
                gameState = GameState.RoundEnd;
                break;
        }
    }
}
