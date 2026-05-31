using UnityEngine;
using System.Collections.Generic;

public class KillFeed : MonoBehaviour
{
    private struct KillEntry
    {
        public string attacker;
        public string victim;
        public string weapon;
        public float timestamp;
    }

    private List<KillEntry> entries = new List<KillEntry>();
    private float displayDuration = 5f;
    private GUIStyle killStyle;
    private bool styleInitialized = false;

    public void AddKill(string attacker, string victim, string weapon)
    {
        KillEntry entry = new KillEntry
        {
            attacker = attacker,
            victim = victim,
            weapon = weapon,
            timestamp = Time.time
        };
        entries.Add(entry);

        if (entries.Count > 10)
            entries.RemoveAt(0);
    }

    void OnGUI()
    {
        if (!styleInitialized)
        {
            killStyle = new GUIStyle();
            killStyle.fontSize = 14;
            killStyle.alignment = TextAnchor.MiddleRight;
            killStyle.normal.textColor = Color.white;
            styleInitialized = true;
        }

        float x = Screen.width - 320f;
        float y = 50f;
        int displayed = 0;

        for (int i = entries.Count - 1; i >= 0 && displayed < 5; i--)
        {
            KillEntry entry = entries[i];
            float age = Time.time - entry.timestamp;
            if (age > displayDuration) continue;

            float alpha = 1f - (age / displayDuration);
            killStyle.normal.textColor = new Color(1f, 1f, 1f, alpha);

            string text = entry.attacker + " [" + entry.weapon + "] " + entry.victim;
            GUI.Label(new Rect(x, y + displayed * 22f, 300f, 20f), text, killStyle);
            displayed++;
        }
    }
}
