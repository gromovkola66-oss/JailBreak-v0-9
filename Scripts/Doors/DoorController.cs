using UnityEngine;

public enum DoorType
{
    CellDoor,
    ArmoryDoor,
    RegularDoor
}

public class DoorController : MonoBehaviour, IDoorInteractable
{
    public DoorType doorType = DoorType.RegularDoor;
    public bool isOpen = false;
    public Vector3 closedPosition;
    public Vector3 openPosition;
    public float slideSpeed = 3f;

    private Vector3 targetPosition;
    private RoundManager roundManager;

    void Start()
    {
        closedPosition = transform.localPosition;
        if (openPosition == Vector3.zero)
            openPosition = closedPosition + Vector3.up * 3f;
        targetPosition = closedPosition;
        roundManager = FindFirstObjectByType<RoundManager>();
    }

    void Update()
    {
        if (doorType == DoorType.CellDoor && roundManager != null)
        {
            if (roundManager.cellsOpen && !isOpen)
            {
                Open();
            }
        }

        transform.localPosition = Vector3.Lerp(transform.localPosition, targetPosition, slideSpeed * Time.deltaTime);
    }

    public void Open()
    {
        isOpen = true;
        targetPosition = openPosition;
    }

    public void Close()
    {
        isOpen = false;
        targetPosition = closedPosition;
    }

    public void Toggle()
    {
        if (isOpen) Close();
        else Open();
    }

    public string GetPrompt(PlayerController player)
    {
        switch (doorType)
        {
            case DoorType.CellDoor:
                return "";
            case DoorType.ArmoryDoor:
                if (player.team == Team.Guard)
                    return isOpen ? "[E] Close Armory" : "[E] Open Armory";
                else
                    return "ACCESS DENIED - Guards Only";
            case DoorType.RegularDoor:
                return isOpen ? "[E] Close Door" : "[E] Open Door";
            default:
                return "";
        }
    }

    public void Interact(PlayerController player)
    {
        switch (doorType)
        {
            case DoorType.CellDoor:
                break;
            case DoorType.ArmoryDoor:
                if (player.team == Team.Guard)
                    Toggle();
                break;
            case DoorType.RegularDoor:
                Toggle();
                break;
        }
    }
}
