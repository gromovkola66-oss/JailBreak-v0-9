using UnityEngine;

public class DoorButton : MonoBehaviour, IDoorInteractable
{
    public bool isActivated = false;

    public string GetPrompt(PlayerController player)
    {
        if (isActivated) return "Cells already open";
        if (player.team == Team.Guard)
            return "[E] Open Cell Doors";
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
