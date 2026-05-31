using UnityEngine;
using UnityEngine.InputSystem;

public class PickupItem : MonoBehaviour
{
    public ItemData itemData;
    public float pickupRange = 2.5f;
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

        GameObject player = GameObject.Find("Player");
        if (player != null)
        {
            playerTransform = player.transform;
            inventory = player.GetComponent<InventorySystem>();
        }

        bobOffset = Random.Range(0f, Mathf.PI * 2f);
    }

    void Update()
    {
        if (keyboard == null) keyboard = Keyboard.current;
        if (playerTransform == null || inventory == null) return;

        // Bob up and down
        float bob = Mathf.Sin(Time.time * 2f + bobOffset) * 0.1f;
        transform.position = startPos + Vector3.up * bob;

        // Rotate slowly
        transform.Rotate(Vector3.up * 45f * Time.deltaTime);

        // Check distance
        float dist = Vector3.Distance(transform.position, playerTransform.position);
        showPrompt = dist <= pickupRange;

        // Pickup with E
        if (showPrompt && keyboard != null && keyboard.eKey.wasPressedThisFrame)
        {
            if (inventory.AddItem(itemData))
            {
                Destroy(gameObject);
            }
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
        GUI.color = Color.black;
        GUI.Label(new Rect(centerX - 149, centerY + 1, 300, 30), "[E] Pick up " + itemData.itemName, style);

        // Text
        GUI.color = Color.white;
        GUI.Label(new Rect(centerX - 150, centerY, 300, 30), "[E] Pick up " + itemData.itemName, style);
    }
}
