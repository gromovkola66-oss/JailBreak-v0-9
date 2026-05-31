using UnityEngine;
using UnityEngine.InputSystem;

public class PickupItem : MonoBehaviour
{
    // Item data stored as serializable fields
    public string itemName = "Unknown";
    public ItemType itemType = ItemType.Misc;
    public int quantity = 1;
    public int maxStack = 1;
    public Color displayColor = Color.white;
    public string description = "";

    public float pickupRange = 3.5f;

    [HideInInspector]
    public bool showPrompt = false;

    private Transform playerTransform;
    private InventorySystem inventory;
    private Keyboard keyboard;

    // Visual bobbing
    private float bobOffset;
    private Vector3 startPos;

    void Start()
    {
        keyboard = Keyboard.current;
        startPos = transform.position;
        bobOffset = Random.Range(0f, Mathf.PI * 2f);
    }

    void Update()
    {
        if (keyboard == null) keyboard = Keyboard.current;

        // Find player every frame if not found yet (robust)
        if (playerTransform == null || inventory == null)
        {
            GameObject player = GameObject.Find("Player");
            if (player != null)
            {
                playerTransform = player.transform;
                inventory = player.GetComponent<InventorySystem>();
            }
            if (playerTransform == null || inventory == null) return;
        }

        // Bob up and down
        float bob = Mathf.Sin(Time.time * 2f + bobOffset) * 0.1f;
        transform.position = startPos + Vector3.up * bob;

        // Rotate slowly
        transform.Rotate(Vector3.up * 45f * Time.deltaTime);

        // Check HORIZONTAL distance only (ignore Y difference)
        Vector3 playerPos = playerTransform.position;
        Vector3 myPos = transform.position;
        float dist = Vector2.Distance(
            new Vector2(playerPos.x, playerPos.z),
            new Vector2(myPos.x, myPos.z)
        );

        showPrompt = dist <= pickupRange;

        // Pickup with E or F
        if (showPrompt && keyboard != null)
        {
            if (keyboard.eKey.wasPressedThisFrame || keyboard.fKey.wasPressedThisFrame)
            {
                TryPickup();
            }
        }
    }

    void TryPickup()
    {
        if (string.IsNullOrEmpty(itemName) || itemName == "Unknown")
        {
            Debug.LogError("[JailBreak] PickupItem has no itemName set! Object: " + gameObject.name);
            return;
        }

        // Create ItemData from serialized fields
        ItemData data = new ItemData(itemName, itemType, quantity, maxStack, displayColor, description);

        bool success = inventory.AddItem(data);
        if (success)
        {
            Debug.Log("[JailBreak] Picked up: " + itemName);
            Destroy(gameObject);
        }
        else
        {
            Debug.Log("[JailBreak] Inventory full! Cannot pick up " + itemName);
        }
    }

    void OnGUI()
    {
        if (!showPrompt) return;

        GUIStyle style = new GUIStyle(GUI.skin.label);
        style.fontSize = 16;
        style.fontStyle = FontStyle.Bold;
        style.normal.textColor = Color.white;
        style.alignment = TextAnchor.MiddleCenter;

        float centerX = Screen.width / 2f;
        float centerY = Screen.height / 2f + 50f;

        // Shadow
        GUIStyle shadowStyle = new GUIStyle(style);
        shadowStyle.normal.textColor = Color.black;
        GUI.Label(new Rect(centerX - 149, centerY + 1, 300, 30), "[E/F] Pick up " + itemName, shadowStyle);

        // Text
        GUI.Label(new Rect(centerX - 150, centerY, 300, 30), "[E/F] Pick up " + itemName, style);
    }

    // Called from editor script to set item data
    public void SetItemData(ItemData data)
    {
        itemName = data.itemName;
        itemType = data.itemType;
        quantity = data.quantity;
        maxStack = data.maxStack;
        displayColor = data.displayColor;
        description = data.description;
    }
}
