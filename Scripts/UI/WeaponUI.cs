using UnityEngine;
using UnityEngine.InputSystem;

public class WeaponUI : MonoBehaviour
{
    private string weaponName = "AK-47";
    private int currentAmmo = 30;
    private int maxAmmo = 30;
    private bool isReloading = false;

    // Crosshair texture
    private Texture2D crosshairTex;

    void Start()
    {
        // Create crosshair texture (simple dot)
        crosshairTex = new Texture2D(2, 2);
        crosshairTex.SetPixel(0, 0, Color.white);
        crosshairTex.SetPixel(1, 0, Color.white);
        crosshairTex.SetPixel(0, 1, Color.white);
        crosshairTex.SetPixel(1, 1, Color.white);
        crosshairTex.Apply();
    }

    public void UpdateWeaponInfo(string name, int ammo, int max, bool reloading)
    {
        weaponName = name;
        currentAmmo = ammo;
        maxAmmo = max;
        isReloading = reloading;
    }

    void OnGUI()
    {
        // === CROSSHAIR ===
        float centerX = Screen.width / 2f;
        float centerY = Screen.height / 2f;

        // Draw crosshair lines
        GUI.color = Color.white;

        // Horizontal lines
        GUI.DrawTexture(new Rect(centerX - 12, centerY - 1, 8, 2), crosshairTex);
        GUI.DrawTexture(new Rect(centerX + 4, centerY - 1, 8, 2), crosshairTex);

        // Vertical lines
        GUI.DrawTexture(new Rect(centerX - 1, centerY - 12, 2, 8), crosshairTex);
        GUI.DrawTexture(new Rect(centerX - 1, centerY + 4, 2, 8), crosshairTex);

        // Center dot
        GUI.DrawTexture(new Rect(centerX - 1, centerY - 1, 2, 2), crosshairTex);

        // === AMMO DISPLAY ===
        GUIStyle ammoStyle = new GUIStyle(GUI.skin.label);
        ammoStyle.fontSize = 24;
        ammoStyle.fontStyle = FontStyle.Bold;
        ammoStyle.normal.textColor = Color.white;
        ammoStyle.alignment = TextAnchor.LowerRight;

        GUIStyle weaponStyle = new GUIStyle(GUI.skin.label);
        weaponStyle.fontSize = 16;
        weaponStyle.normal.textColor = new Color(0.8f, 0.8f, 0.8f);
        weaponStyle.alignment = TextAnchor.LowerRight;

        // Shadow for readability
        GUIStyle shadowStyle = new GUIStyle(ammoStyle);
        shadowStyle.normal.textColor = Color.black;

        float padding = 20f;
        Rect ammoRect = new Rect(Screen.width - 200 - padding, Screen.height - 60 - padding, 200, 40);
        Rect weaponRect = new Rect(Screen.width - 200 - padding, Screen.height - 90 - padding, 200, 30);

        // Weapon name
        GUI.Label(weaponRect, weaponName, weaponStyle);

        // Ammo count
        string ammoText;
        if (isReloading)
        {
            ammoText = "RELOADING...";
            ammoStyle.normal.textColor = Color.yellow;
        }
        else
        {
            ammoText = currentAmmo + " / " + maxAmmo;
            if (currentAmmo <= 5)
                ammoStyle.normal.textColor = Color.red;
            else
                ammoStyle.normal.textColor = Color.white;
        }

        // Shadow
        Rect shadowRect = new Rect(ammoRect.x + 2, ammoRect.y + 2, ammoRect.width, ammoRect.height);
        GUI.Label(shadowRect, ammoText, shadowStyle);
        GUI.Label(ammoRect, ammoText, ammoStyle);

        // === WEAPON SLOTS (bottom center) ===
        float slotSize = 50f;
        float slotSpacing = 5f;
        float totalWidth = 3 * slotSize + 2 * slotSpacing;
        float startX = (Screen.width - totalWidth) / 2f;
        float slotY = Screen.height - slotSize - padding;

        string[] slotNames = { "1:AK", "2:SG", "3:PT" };

        WeaponController wc = FindFirstObjectByType<WeaponController>();
        int activeSlot = wc != null ? wc.currentWeaponIndex : 0;

        for (int i = 0; i < 3; i++)
        {
            Rect slotRect = new Rect(startX + i * (slotSize + slotSpacing), slotY, slotSize, slotSize);

            // Background
            Color bgColor = (i == activeSlot) ? new Color(1f, 1f, 1f, 0.3f) : new Color(0f, 0f, 0f, 0.4f);
            Texture2D bgTex = new Texture2D(1, 1);
            bgTex.SetPixel(0, 0, bgColor);
            bgTex.Apply();
            GUI.DrawTexture(slotRect, bgTex);

            // Border for active
            if (i == activeSlot)
            {
                Texture2D borderTex = new Texture2D(1, 1);
                borderTex.SetPixel(0, 0, Color.white);
                borderTex.Apply();
                GUI.DrawTexture(new Rect(slotRect.x, slotRect.y, slotRect.width, 2), borderTex);
                GUI.DrawTexture(new Rect(slotRect.x, slotRect.y + slotRect.height - 2, slotRect.width, 2), borderTex);
                GUI.DrawTexture(new Rect(slotRect.x, slotRect.y, 2, slotRect.height), borderTex);
                GUI.DrawTexture(new Rect(slotRect.x + slotRect.width - 2, slotRect.y, 2, slotRect.height), borderTex);
            }

            // Label
            GUIStyle slotStyle = new GUIStyle(GUI.skin.label);
            slotStyle.alignment = TextAnchor.MiddleCenter;
            slotStyle.fontSize = 12;
            slotStyle.normal.textColor = (i == activeSlot) ? Color.white : Color.gray;
            GUI.Label(slotRect, slotNames[i], slotStyle);
        }

        // === CONTROLS HINT (top left) ===
        GUIStyle hintStyle = new GUIStyle(GUI.skin.label);
        hintStyle.fontSize = 12;
        hintStyle.normal.textColor = new Color(1f, 1f, 1f, 0.5f);
        GUI.Label(new Rect(10, 10, 300, 20), "LMB - Shoot | R - Reload | 1/2/3 - Switch weapon", hintStyle);
    }
}
