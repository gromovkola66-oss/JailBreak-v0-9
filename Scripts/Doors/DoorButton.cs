using UnityEngine;

public class DoorButton : MonoBehaviour, IDoorInteractable
{
    public bool isActivated = false;

    public string GetPrompt(PlayerController player)
    {
        if (isActivated) return "\u041A\u0430\u043C\u0435\u0440\u044B \u0443\u0436\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u044B";
        if (player.team == Team.Guard)
            return "[E] \u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u0430\u043C\u0435\u0440\u044B";
        else
            return "";
    }

    public void Interact(PlayerController player)
    {
        if (isActivated) return;
        if (player.team != Team.Guard) return;

        isActivated = true;
        RoundManager rm = FindFirstObjectByType<RoundManager>();
        if (rm != null)
        {
            rm.OpenCells();
        }
    }

    public void ResetButton()
    {
        isActivated = false;
    }
}
