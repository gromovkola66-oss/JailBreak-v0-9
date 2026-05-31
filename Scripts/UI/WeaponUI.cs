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

    // Reference to check inventory state
    private InventorySystem inventory;

    void Start()
    {
        // Create crosshair texture
        crosshairTex = new Texture2D(2, 2);
        crosshairTex.SetPixel(0, 0, Color.white);
        crosshairTex.SetPixel(1, 0, Color.white);
        crosshairTex.SetPixel(0, 1, Color.white);
        crosshairTex.SetPixel(1, 1, Color.white);
        crosshairTex.Apply();

        GameObject player = GameObject.Find("Player");
        if (player != null)
        {
            inventory = player.GetComponent<InventorySystem>();
        }
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
        // Hide crosshair when inventory is open
        bool inventoryOpen = inventory != null && inventory.isInventoryOpen;

        if (!inventoryOpen)
        {
            DrawCrosshair();
        }

        DrawAmmoDisplay();
        DrawControlsHint();
    }

    void DrawCrosshair()
    {
        float centerX = Screen.width / 2f;
        float centerY = Screen.height / 2f;

        GUI.color = Color.white;

        // Horizontal lines
        GUI.DrawTexture(new Rect(centerX - 12, centerY - 1, 8, 2), crosshairTex);
        GUI.DrawTexture(new Rect(centerX + 4, centerY - 1, 8, 2), crosshairTex);

        // Vertical lines
        GUI.DrawTexture(new Rect(centerX - 1, centerY - 12, 2, 8), crosshairTex);
        GUI.DrawTexture(new Rect(centerX - 1, centerY + 4, 2, 8), crosshairTex);

        // Center dot
        GUI.DrawTexture(new Rect(centerX - 1, centerY - 1, 2, 2), crosshairTex);
    }

    void DrawAmmoDisplay()
    {
        float padding = 20f;

        // Weapon name (top right of ammo area)
        GUIStyle weaponStyle = new GUIStyle(GUI.skin.label);
        weaponStyle.fontSize = 16;
        weaponStyle.normal.textColor = new Color(0.8f, 0.8f, 0.8f);
        weaponStyle.alignment = TextAnchor.LowerRight;

        Rect weaponRect = new Rect(Screen.width - 200 - padding, Screen.height - 105 - padding, 200, 30);
        GUI.Label(weaponRect, weaponName, weaponStyle);

        // Ammo count
        GUIStyle ammoStyle = new GUIStyle(GUI.skin.label);
        ammoStyle.fontSize = 24;
        ammoStyle.fontStyle = FontStyle.Bold;
        ammoStyle.alignment = TextAnchor.LowerRight;

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
        GUIStyle shadowStyle = new GUIStyle(ammoStyle);
        shadowStyle.normal.textColor = Color.black;

        Rect ammoRect = new Rect(Screen.width - 200 - padding, Screen.height - 75 - padding, 200, 40);
        Rect shadowRect = new Rect(ammoRect.x + 2, ammoRect.y + 2, ammoRect.width, ammoRect.height);
        GUI.Label(shadowRect, ammoText, shadowStyle);
        GUI.Label(ammoRect, ammoText, ammoStyle);
    }

    void DrawControlsHint()
    {
        GUIStyle hintStyle = new GUIStyle(GUI.skin.label);
        hintStyle.fontSize = 12;
        hintStyle.normal.textColor = new Color(1f, 1f, 1f, 0.5f);
        GUI.Label(new Rect(10, 10, 400, 20), "LMB - Shoot | R - Reload | 1/2/3 - Switch | Tab - Inventory | E - Pickup", hintStyle);
    }
}
