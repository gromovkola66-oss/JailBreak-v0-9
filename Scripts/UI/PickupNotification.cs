using UnityEngine;

public class PickupNotification : MonoBehaviour
{
    private string message = "";
    private float showUntil = 0f;
    private float fadeDuration = 2f;

    public void Show(string msg)
    {
        message = msg;
        showUntil = Time.time + fadeDuration;
    }

    void OnGUI()
    {
        if (Time.time > showUntil) return;

        float alpha = Mathf.Clamp01((showUntil - Time.time) / fadeDuration);

        GUIStyle style = new GUIStyle(GUI.skin.label);
        style.fontSize = 20;
        style.fontStyle = FontStyle.Bold;
        style.normal.textColor = new Color(0.2f, 1f, 0.3f, alpha);
        style.alignment = TextAnchor.MiddleCenter;

        float centerX = Screen.width / 2f;
        float y = Screen.height / 2f + 100f;

        // Shadow
        GUIStyle shadowStyle = new GUIStyle(style);
        shadowStyle.normal.textColor = new Color(0f, 0f, 0f, alpha);
        GUI.Label(new Rect(centerX - 149, y + 1, 300, 30), message, shadowStyle);

        // Text
        GUI.Label(new Rect(centerX - 150, y, 300, 30), message, style);
    }
}
