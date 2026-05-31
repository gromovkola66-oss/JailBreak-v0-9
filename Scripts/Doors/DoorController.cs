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
        if (closedPosition == Vector3.zero)
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
                    return isOpen ? "[E] \u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0430\u0440\u0441\u0435\u043D\u0430\u043B" : "[E] \u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0430\u0440\u0441\u0435\u043D\u0430\u043B";
                else
                    return "\u0414\u041E\u0421\u0422\u0423\u041F \u0417\u0410\u041F\u0420\u0415\u0429\u0401\u041D - \u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u043E\u0445\u0440\u0430\u043D\u044B";
            case DoorType.RegularDoor:
                return isOpen ? "[E] \u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0434\u0432\u0435\u0440\u044C" : "[E] \u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u0432\u0435\u0440\u044C";
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
