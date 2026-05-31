using UnityEngine;
using UnityEngine.InputSystem;

public class InventorySystem : MonoBehaviour
{
    public const int HOTBAR_SLOTS = 4;
    public const int INVENTORY_SLOTS = 8;

    // Slots: 0-3 = hotbar, 4-11 = inventory
    public ItemData[] slots = new ItemData[HOTBAR_SLOTS + INVENTORY_SLOTS];

    public int selectedHotbarSlot = 0;
    public bool isInventoryOpen = false;

    private Keyboard keyboard;
    private Mouse mouse;

    // UI reference
    private InventoryUI inventoryUI;

    void Start()
    {
        keyboard = Keyboard.current;
        mouse = Mouse.current;

        inventoryUI = FindFirstObjectByType<InventoryUI>();
    }

    void Update()
    {
        if (keyboard == null)
        {
            keyboard = Keyboard.current;
            if (keyboard == null) return;
        }
        if (mouse == null)
        {
            mouse = Mouse.current;
        }

        // Toggle inventory with Tab
        if (keyboard.tabKey.wasPressedThisFrame)
        {
            isInventoryOpen = !isInventoryOpen;

            if (isInventoryOpen)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
            else
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        // Close with Escape too
        if (keyboard.escapeKey.wasPressedThisFrame && isInventoryOpen)
        {
            isInventoryOpen = false;
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        // Hotbar selection (already used 1-3 for weapons, use F1-F4 or just visual)
        // We'll use the weapon switch as hotbar context
    }

    // Add item to inventory. Returns true if successful.
    public bool AddItem(ItemData item)
    {
        // First try to stack with existing item
        for (int i = 0; i < slots.Length; i++)
        {
            if (slots[i] != null && slots[i].itemName == item.itemName && slots[i].quantity < slots[i].maxStack)
            {
                int canAdd = slots[i].maxStack - slots[i].quantity;
                int toAdd = Mathf.Min(canAdd, item.quantity);
                slots[i].quantity += toAdd;
                item.quantity -= toAdd;
                if (item.quantity <= 0) return true;
            }
        }

        // Find first empty slot (prefer hotbar for weapons)
        if (item.itemType == ItemType.Weapon)
        {
            for (int i = 0; i < HOTBAR_SLOTS; i++)
            {
                if (slots[i] == null)
                {
                    slots[i] = item.Clone();
                    return true;
                }
            }
        }

        // Find any empty slot
        for (int i = 0; i < slots.Length; i++)
        {
            if (slots[i] == null)
            {
                slots[i] = item.Clone();
                return true;
            }
        }

        return false; // Inventory full
    }

    // Remove item from specific slot
    public ItemData RemoveItem(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= slots.Length) return null;
        ItemData item = slots[slotIndex];
        slots[slotIndex] = null;
        return item;
    }

    // Swap two slots
    public void SwapSlots(int from, int to)
    {
        if (from < 0 || from >= slots.Length || to < 0 || to >= slots.Length) return;
        ItemData temp = slots[from];
        slots[from] = slots[to];
        slots[to] = temp;
    }

    // Check if slot has item
    public bool HasItem(int slot)
    {
        return slot >= 0 && slot < slots.Length && slots[slot] != null;
    }

    // Get item in slot
    public ItemData GetItem(int slot)
    {
        if (slot < 0 || slot >= slots.Length) return null;
        return slots[slot];
    }
}
