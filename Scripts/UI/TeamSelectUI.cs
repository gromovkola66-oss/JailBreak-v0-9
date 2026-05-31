using UnityEngine;

public class TeamSelectUI : MonoBehaviour
{
    private bool isVisible = true;
    private GUIStyle titleStyle;
    private GUIStyle buttonStyle;
    private GUIStyle descStyle;
    private Texture2D whiteTex;
    private Texture2D blueButtonTex;
    private Texture2D orangeButtonTex;
    private bool stylesInitialized = false;

    void Start()
    {
        whiteTex = new Texture2D(1, 1);
        whiteTex.SetPixel(0, 0, Color.white);
        whiteTex.Apply();

        blueButtonTex = new Texture2D(1, 1);
        blueButtonTex.SetPixel(0, 0, new Color(0.2f, 0.4f, 0.8f, 1f));
        blueButtonTex.Apply();

        orangeButtonTex = new Texture2D(1, 1);
        orangeButtonTex.SetPixel(0, 0, new Color(0.9f, 0.5f, 0.1f, 1f));
        orangeButtonTex.Apply();

        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    private void InitStyles()
    {
        if (stylesInitialized) return;
        stylesInitialized = true;

        titleStyle = new GUIStyle();
        titleStyle.fontSize = 48;
        titleStyle.fontStyle = FontStyle.Bold;
        titleStyle.alignment = TextAnchor.MiddleCenter;
        titleStyle.normal.textColor = Color.white;

        buttonStyle = new GUIStyle(GUI.skin.button);
        buttonStyle.fontSize = 28;
        buttonStyle.fontStyle = FontStyle.Bold;
        buttonStyle.alignment = TextAnchor.MiddleCenter;
        buttonStyle.normal.textColor = Color.white;
        buttonStyle.hover.textColor = Color.white;
        buttonStyle.active.textColor = Color.white;

        descStyle = new GUIStyle();
        descStyle.fontSize = 14;
        descStyle.alignment = TextAnchor.MiddleCenter;
        descStyle.normal.textColor = new Color(0.8f, 0.8f, 0.8f);
    }

    void OnGUI()
    {
        if (!isVisible) return;

        InitStyles();

        GUI.color = new Color(0f, 0f, 0f, 0.85f);
        GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), whiteTex);
        GUI.color = Color.white;

        float centerX = Screen.width / 2f;
        float centerY = Screen.height / 2f;

        GUI.Label(new Rect(0, centerY - 180f, Screen.width, 60f), "JAILBREAK", titleStyle);

        float btnWidth = 250f;
        float btnHeight = 70f;
        float spacing = 40f;

        Rect guardBtn = new Rect(centerX - btnWidth - spacing / 2f, centerY - 40f, btnWidth, btnHeight);
        Rect prisonerBtn = new Rect(centerX + spacing / 2f, centerY - 40f, btnWidth, btnHeight);

        GUI.DrawTexture(guardBtn, blueButtonTex);
        if (GUI.Button(guardBtn, "JOIN GUARDS", buttonStyle))
        {
            SelectTeam(Team.Guard);
        }
        GUI.Label(new Rect(guardBtn.x, guardBtn.y + btnHeight + 5f, btnWidth, 25f), "Maintain order. Control the prison.", descStyle);

        GUI.DrawTexture(prisonerBtn, orangeButtonTex);
        if (GUI.Button(prisonerBtn, "JOIN PRISONERS", buttonStyle))
        {
            SelectTeam(Team.Prisoner);
        }
        GUI.Label(new Rect(prisonerBtn.x, prisonerBtn.y + btnHeight + 5f, btnWidth, 25f), "Survive. Escape. Rebel.", descStyle);
    }

    private void SelectTeam(Team team)
    {
        isVisible = false;
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        PlayerController player = FindFirstObjectByType<PlayerController>();
        if (player != null)
        {
            player.team = team;

            DamageReceiver dr = player.GetComponent<DamageReceiver>();
            if (dr != null) dr.team = team;

            if (TeamManager.Instance != null)
            {
                TeamManager.Instance.AssignTeam(player.gameObject, team);
                Vector3 spawn = TeamManager.Instance.GetSpawnPoint(team);
                player.Respawn(spawn);
            }

            player.EnableInput();
        }

        RoundManager rm = FindFirstObjectByType<RoundManager>();
        if (rm != null)
        {
            rm.StartRound();
        }
    }

    public void Show()
    {
        isVisible = true;
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;

        PlayerController player = FindFirstObjectByType<PlayerController>();
        if (player != null)
        {
            player.DisableInput();
        }
    }
}
