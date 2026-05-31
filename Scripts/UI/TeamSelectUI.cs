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

        GUI.Label(new Rect(0, centerY - 180f, Screen.width, 60f), "\u041F\u041E\u0411\u0415\u0413 \u0418\u0417 \u0422\u042E\u0420\u042C\u041C\u042B", titleStyle);

        float btnWidth = 250f;
        float btnHeight = 70f;
        float spacing = 40f;

        Rect guardBtn = new Rect(centerX - btnWidth - spacing / 2f, centerY - 40f, btnWidth, btnHeight);
        Rect prisonerBtn = new Rect(centerX + spacing / 2f, centerY - 40f, btnWidth, btnHeight);

        GUI.DrawTexture(guardBtn, blueButtonTex);
        if (GUI.Button(guardBtn, "\u041E\u0425\u0420\u0410\u041D\u0410", buttonStyle))
        {
            SelectTeam(Team.Guard);
        }
        GUI.Label(new Rect(guardBtn.x, guardBtn.y + btnHeight + 5f, btnWidth, 25f), "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439 \u043F\u043E\u0440\u044F\u0434\u043E\u043A. \u041A\u043E\u043D\u0442\u0440\u043E\u043B\u0438\u0440\u0443\u0439 \u0442\u044E\u0440\u044C\u043C\u0443.", descStyle);

        GUI.DrawTexture(prisonerBtn, orangeButtonTex);
        if (GUI.Button(prisonerBtn, "\u0417\u0410\u041A\u041B\u042E\u0427\u0401\u041D\u041D\u042B\u0415", buttonStyle))
        {
            SelectTeam(Team.Prisoner);
        }
        GUI.Label(new Rect(prisonerBtn.x, prisonerBtn.y + btnHeight + 5f, btnWidth, 25f), "\u0412\u044B\u0436\u0438\u0432\u0430\u0439. \u0421\u0431\u0435\u0433\u0438. \u0411\u0443\u043D\u0442\u0443\u0439.", descStyle);
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
