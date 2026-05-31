using UnityEngine;

public class GameUI : MonoBehaviour
{
    private HealthSystem playerHealth;
    private WeaponController weaponController;
    private PlayerController playerController;
    private RoundManager roundManager;

    private GUIStyle hpTextStyle;
    private GUIStyle ammoTextStyle;
    private GUIStyle timerStyle;
    private GUIStyle teamStyle;
    private GUIStyle deathStyle;
    private GUIStyle promptStyle;
    private GUIStyle winnerStyle;
    private Texture2D whiteTex;
    private bool stylesInitialized = false;

    void Start()
    {
        playerHealth = FindFirstObjectByType<HealthSystem>();
        weaponController = FindFirstObjectByType<WeaponController>();
        playerController = FindFirstObjectByType<PlayerController>();
        roundManager = FindFirstObjectByType<RoundManager>();

        whiteTex = new Texture2D(1, 1);
        whiteTex.SetPixel(0, 0, Color.white);
        whiteTex.Apply();
    }

    void Update()
    {
        if (playerHealth == null) playerHealth = FindFirstObjectByType<HealthSystem>();
        if (weaponController == null) weaponController = FindFirstObjectByType<WeaponController>();
        if (playerController == null) playerController = FindFirstObjectByType<PlayerController>();
        if (roundManager == null) roundManager = FindFirstObjectByType<RoundManager>();
    }

    private void InitStyles()
    {
        if (stylesInitialized) return;
        stylesInitialized = true;

        hpTextStyle = new GUIStyle();
        hpTextStyle.fontSize = 18;
        hpTextStyle.fontStyle = FontStyle.Bold;
        hpTextStyle.normal.textColor = Color.white;

        ammoTextStyle = new GUIStyle();
        ammoTextStyle.fontSize = 20;
        ammoTextStyle.fontStyle = FontStyle.Bold;
        ammoTextStyle.normal.textColor = Color.white;
        ammoTextStyle.alignment = TextAnchor.MiddleRight;

        timerStyle = new GUIStyle();
        timerStyle.fontSize = 24;
        timerStyle.fontStyle = FontStyle.Bold;
        timerStyle.alignment = TextAnchor.MiddleCenter;
        timerStyle.normal.textColor = Color.white;

        teamStyle = new GUIStyle();
        teamStyle.fontSize = 20;
        teamStyle.fontStyle = FontStyle.Bold;
        teamStyle.alignment = TextAnchor.MiddleRight;

        deathStyle = new GUIStyle();
        deathStyle.fontSize = 48;
        deathStyle.fontStyle = FontStyle.Bold;
        deathStyle.alignment = TextAnchor.MiddleCenter;
        deathStyle.normal.textColor = Color.red;

        promptStyle = new GUIStyle();
        promptStyle.fontSize = 16;
        promptStyle.alignment = TextAnchor.MiddleCenter;
        promptStyle.normal.textColor = Color.white;

        winnerStyle = new GUIStyle();
        winnerStyle.fontSize = 36;
        winnerStyle.fontStyle = FontStyle.Bold;
        winnerStyle.alignment = TextAnchor.MiddleCenter;
        winnerStyle.normal.textColor = Color.yellow;
    }

    void OnGUI()
    {
        InitStyles();

        if (playerHealth != null && playerHealth.isDead)
        {
            DrawDeathOverlay();
            return;
        }

        if (roundManager != null && roundManager.roundState == RoundState.PostRound)
        {
            DrawWinnerOverlay();
        }

        DrawHPBar();
        DrawAmmo();
        DrawTimer();
        DrawTeamIndicator();
        DrawCrosshair();
        DrawInteractionPrompt();
        DrawRoundInfo();
    }

    private void DrawHPBar()
    {
        if (playerHealth == null) return;

        float barWidth = 200f;
        float barHeight = 20f;
        float x = 20f;
        float y = 20f;

        GUI.DrawTexture(new Rect(x, y, barWidth, barHeight), whiteTex);
        GUI.color = new Color(0.2f, 0.2f, 0.2f, 0.8f);
        GUI.DrawTexture(new Rect(x, y, barWidth, barHeight), whiteTex);

        float hpPercent = playerHealth.currentHP / playerHealth.maxHP;
        GUI.color = Color.Lerp(Color.red, Color.green, hpPercent);
        GUI.DrawTexture(new Rect(x, y, barWidth * hpPercent, barHeight), whiteTex);

        GUI.color = Color.white;
        GUI.Label(new Rect(x + 5f, y, barWidth, barHeight), "HP: " + (int)playerHealth.currentHP + "/" + (int)playerHealth.maxHP, hpTextStyle);
    }

    private void DrawAmmo()
    {
        if (weaponController == null) return;

        WeaponData wd = weaponController.GetCurrentWeapon();
        if (wd == null) return;

        float x = Screen.width - 220f;
        float y = Screen.height - 60f;

        GUI.color = Color.white;
        if (wd.isMelee)
        {
            GUI.Label(new Rect(x, y, 200f, 25f), wd.weaponName, ammoTextStyle);
        }
        else if (weaponController.IsReloading())
        {
            GUI.Label(new Rect(x, y, 200f, 25f), "RELOADING...", ammoTextStyle);
            GUI.Label(new Rect(x, y + 25f, 200f, 20f), wd.weaponName, ammoTextStyle);
        }
        else
        {
            string ammoText = weaponController.GetCurrentAmmo() + " / " + wd.magazineSize;
            GUI.Label(new Rect(x, y, 200f, 25f), ammoText, ammoTextStyle);
            GUI.Label(new Rect(x, y + 25f, 200f, 20f), wd.weaponName, ammoTextStyle);
        }
    }

    private void DrawTimer()
    {
        if (roundManager == null) return;
        if (roundManager.roundState != RoundState.Active) return;

        float seconds = roundManager.GetTimerSeconds();
        int mins = (int)(seconds / 60f);
        int secs = (int)(seconds % 60f);
        string timeText = mins.ToString() + ":" + secs.ToString("D2");

        if (seconds < 30f)
            timerStyle.normal.textColor = Color.red;
        else
            timerStyle.normal.textColor = Color.white;

        GUI.Label(new Rect(Screen.width / 2f - 50f, 15f, 100f, 40f), timeText, timerStyle);
    }

    private void DrawTeamIndicator()
    {
        if (playerController == null) return;

        string teamText = playerController.team == Team.Guard ? "GUARD" : "PRISONER";
        teamStyle.normal.textColor = playerController.team == Team.Guard ? new Color(0.3f, 0.5f, 1f) : new Color(1f, 0.6f, 0.2f);

        GUI.Label(new Rect(Screen.width - 170f, 15f, 150f, 30f), teamText, teamStyle);
    }

    private void DrawCrosshair()
    {
        float centerX = Screen.width / 2f;
        float centerY = Screen.height / 2f;

        float gap = 4f;
        float length = 12f;
        float thickness = 2f;

        if (playerController != null && playerController.isMoving)
        {
            gap = playerController.isSprinting ? 10f : 7f;
        }

        GUI.color = Color.white;
        GUI.DrawTexture(new Rect(centerX - thickness / 2f, centerY - gap - length, thickness, length), whiteTex);
        GUI.DrawTexture(new Rect(centerX - thickness / 2f, centerY + gap, thickness, length), whiteTex);
        GUI.DrawTexture(new Rect(centerX - gap - length, centerY - thickness / 2f, length, thickness), whiteTex);
        GUI.DrawTexture(new Rect(centerX + gap, centerY - thickness / 2f, length, thickness), whiteTex);
    }

    private void DrawInteractionPrompt()
    {
        if (playerController == null) return;
        if (string.IsNullOrEmpty(playerController.interactionPrompt)) return;

        GUI.Label(new Rect(Screen.width / 2f - 150f, Screen.height * 0.7f, 300f, 30f),
            playerController.interactionPrompt, promptStyle);
    }

    private void DrawDeathOverlay()
    {
        GUI.color = new Color(0f, 0f, 0f, 0.7f);
        GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), whiteTex);
        GUI.color = Color.white;

        GUI.Label(new Rect(0, Screen.height / 2f - 50f, Screen.width, 60f), "YOU DIED", deathStyle);

        promptStyle.normal.textColor = Color.gray;
        GUI.Label(new Rect(0, Screen.height / 2f + 20f, Screen.width, 30f), "Spectating...", promptStyle);
        promptStyle.normal.textColor = Color.white;
    }

    private void DrawWinnerOverlay()
    {
        if (roundManager == null) return;
        GUI.Label(new Rect(0, Screen.height / 2f - 80f, Screen.width, 50f), roundManager.winnerText, winnerStyle);
    }

    private void DrawRoundInfo()
    {
        if (roundManager == null) return;
        if (roundManager.roundState == RoundState.PreRound)
        {
            GUI.Label(new Rect(Screen.width / 2f - 100f, Screen.height / 2f - 20f, 200f, 40f), "Round starting...", promptStyle);
        }
    }
}
