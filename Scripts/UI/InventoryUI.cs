using UnityEngine;
using UnityEngine.InputSystem;

public class InventoryUI : MonoBehaviour
{
    private InventorySystem inventory;
    private int dragFromSlot = -1;
    private Texture2D slotBgTex;
    private Texture2D slotActiveTex;
    private Texture2D slotHoverTex;
    private Texture2D itemBgTex;
    private Mouse mouse;

    void Start()
    {
        GameObject player = GameObject.Find("Player");
        if (player != null)
        {
            inventory = player.GetComponent<InventorySystem>();
        }

        mouse = Mouse.current;

        // Create textures
        slotBgTex = MakeTex(new Color(0.1f, 0.1f, 0.1f, 0.7f));
        slotActiveTex = MakeTex(new Color(0.3f, 0.3f, 0.5f, 0.8f));
        slotHoverTex = MakeTex(new Color(0.2f, 0.2f, 0.3f, 0.8f));
        itemBgTex = MakeTex(new Color(1f, 1f, 1f, 1f));
    }

    void OnGUI()
    {
        if (inventory == null) return;

        DrawHotbar();

        if (inventory.isInventoryOpen)
        {
            DrawInventoryPanel();
        }
    }

    void DrawHotbar()
    {
        float slotSize = 60f;
        float spacing = 6f;
        float totalWidth = InventorySystem.HOTBAR_SLOTS * slotSize + (InventorySystem.HOTBAR_SLOTS - 1) * spacing;
        float startX = (Screen.width - totalWidth) / 2f;
        float startY = Screen.height - slotSize - 20f;

        for (int i = 0; i < InventorySystem.HOTBAR_SLOTS; i++)
        {
            Rect slotRect = new Rect(startX + i * (slotSize + spacing), startY, slotSize, slotSize);

            // Background
            bool isActive = (i == inventory.selectedHotbarSlot);
            GUI.DrawTexture(slotRect, isActive ? slotActiveTex : slotBgTex);

            // Border
            DrawBorder(slotRect, isActive ? Color.white : new Color(0.4f, 0.4f, 0.4f));

            // Slot number
            GUIStyle numStyle = new GUIStyle(GUI.skin.label);
            numStyle.fontSize = 10;
            numStyle.normal.textColor = new Color(0.6f, 0.6f, 0.6f);
            GUI.Label(new Rect(slotRect.x + 3, slotRect.y + 2, 20, 15), (i + 1).ToString(), numStyle);

            // Item
            DrawSlotItem(slotRect, i);
        }
    }

    void DrawInventoryPanel()
    {
        float slotSize = 60f;
        float spacing = 6f;
        int cols = 4;
        int rows = 2;

        float panelWidth = cols * slotSize + (cols - 1) * spacing + 40f;
        float panelHeight = rows * slotSize + (rows - 1) * spacing + 80f;
        float panelX = (Screen.width - panelWidth) / 2f;
        float panelY = (Screen.height - panelHeight) / 2f - 50f;

        // Panel background
        Texture2D panelBg = MakeTex(new Color(0.05f, 0.05f, 0.08f, 0.9f));
        GUI.DrawTexture(new Rect(panelX, panelY, panelWidth, panelHeight), panelBg);
        DrawBorder(new Rect(panelX, panelY, panelWidth, panelHeight), new Color(0.4f, 0.4f, 0.5f));

        // Title
        GUIStyle titleStyle = new GUIStyle(GUI.skin.label);
        titleStyle.fontSize = 18;
        titleStyle.fontStyle = FontStyle.Bold;
        titleStyle.normal.textColor = Color.white;
        titleStyle.alignment = TextAnchor.MiddleCenter;
        GUI.Label(new Rect(panelX, panelY + 10, panelWidth, 30), "INVENTORY", titleStyle);

        // Inventory slots (index 4-11)
        float gridStartX = panelX + 20f;
        float gridStartY = panelY + 50f;

        for (int i = 0; i < InventorySystem.INVENTORY_SLOTS; i++)
        {
            int col = i % cols;
            int row = i / cols;
            Rect slotRect = new Rect(
                gridStartX + col * (slotSize + spacing),
                gridStartY + row * (slotSize + spacing),
                slotSize, slotSize
            );

            int slotIndex = InventorySystem.HOTBAR_SLOTS + i;

            // Hover detection
            bool isHover = slotRect.Contains(Event.current.mousePosition);
            GUI.DrawTexture(slotRect, isHover ? slotHoverTex : slotBgTex);
            DrawBorder(slotRect, isHover ? Color.white : new Color(0.3f, 0.3f, 0.3f));

            // Item
            DrawSlotItem(slotRect, slotIndex);

            // Click handling
            if (isHover && Event.current.type == EventType.MouseDown && Event.current.button == 0)
            {
                HandleSlotClick(slotIndex);
                Event.current.Use();
            }
        }

        // Also make hotbar slots clickable when inventory is open
        float hotbarSlotSize = 60f;
        float hotbarSpacing = 6f;
        float hotbarTotalWidth = InventorySystem.HOTBAR_SLOTS * hotbarSlotSize + (InventorySystem.HOTBAR_SLOTS - 1) * hotbarSpacing;
        float hotbarStartX = (Screen.width - hotbarTotalWidth) / 2f;
        float hotbarStartY = Screen.height - hotbarSlotSize - 20f;

        for (int i = 0; i < InventorySystem.HOTBAR_SLOTS; i++)
        {
            Rect slotRect = new Rect(hotbarStartX + i * (hotbarSlotSize + hotbarSpacing), hotbarStartY, hotbarSlotSize, hotbarSlotSize);
            bool isHover = slotRect.Contains(Event.current.mousePosition);

            if (isHover && Event.current.type == EventType.MouseDown && Event.current.button == 0)
            {
                HandleSlotClick(i);
                Event.current.Use();
            }
        }

        // Drag indicator
        if (dragFromSlot >= 0 && inventory.HasItem(dragFromSlot))
        {
            GUIStyle dragStyle = new GUIStyle(GUI.skin.label);
            dragStyle.fontSize = 12;
            dragStyle.normal.textColor = Color.yellow;
            dragStyle.alignment = TextAnchor.MiddleCenter;

            Vector2 mousePos = Event.current.mousePosition;
            GUI.Label(new Rect(mousePos.x - 50, mousePos.y - 30, 100, 20), "Moving: " + inventory.GetItem(dragFromSlot).itemName, dragStyle);
        }

        // Instructions
        GUIStyle hintStyle = new GUIStyle(GUI.skin.label);
        hintStyle.fontSize = 11;
        hintStyle.normal.textColor = new Color(0.6f, 0.6f, 0.6f);
        hintStyle.alignment = TextAnchor.MiddleCenter;
        GUI.Label(new Rect(panelX, panelY + panelHeight - 25, panelWidth, 20), "Click to select, click another slot to move. Tab to close.", hintStyle);
    }

    void DrawSlotItem(Rect slotRect, int slotIndex)
    {
        ItemData item = inventory.GetItem(slotIndex);
        if (item == null) return;

        // Item color block
        float padding = 8f;
        Rect itemRect = new Rect(slotRect.x + padding, slotRect.y + padding, slotRect.width - padding * 2, slotRect.height - padding * 2);

        Texture2D colorTex = MakeTex(item.displayColor);
        GUI.DrawTexture(itemRect, colorTex);

        // Item name
        GUIStyle nameStyle = new GUIStyle(GUI.skin.label);
        nameStyle.fontSize = 9;
        nameStyle.normal.textColor = Color.white;
        nameStyle.alignment = TextAnchor.LowerCenter;
        nameStyle.wordWrap = true;
        GUI.Label(new Rect(slotRect.x, slotRect.y + slotRect.height - 18, slotRect.width, 16), item.itemName, nameStyle);

        // Quantity (if stackable)
        if (item.maxStack > 1 && item.quantity > 1)
        {
            GUIStyle qtyStyle = new GUIStyle(GUI.skin.label);
            qtyStyle.fontSize = 11;
            qtyStyle.fontStyle = FontStyle.Bold;
            qtyStyle.normal.textColor = Color.white;
            qtyStyle.alignment = TextAnchor.UpperRight;
            GUI.Label(new Rect(slotRect.x, slotRect.y + 2, slotRect.width - 4, 15), item.quantity.ToString(), qtyStyle);
        }

        // Highlight if being dragged
        if (dragFromSlot == slotIndex)
        {
            Texture2D highlightTex = MakeTex(new Color(1f, 1f, 0f, 0.3f));
            GUI.DrawTexture(slotRect, highlightTex);
        }
    }

    void HandleSlotClick(int slotIndex)
    {
        if (dragFromSlot < 0)
        {
            // First click - select source
            if (inventory.HasItem(slotIndex))
            {
                dragFromSlot = slotIndex;
            }
        }
        else
        {
            // Second click - swap/move
            if (slotIndex != dragFromSlot)
            {
                inventory.SwapSlots(dragFromSlot, slotIndex);
            }
            dragFromSlot = -1;
        }
    }

    void DrawBorder(Rect rect, Color color)
    {
        Texture2D borderTex = MakeTex(color);
        GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width, 1), borderTex);
        GUI.DrawTexture(new Rect(rect.x, rect.y + rect.height - 1, rect.width, 1), borderTex);
        GUI.DrawTexture(new Rect(rect.x, rect.y, 1, rect.height), borderTex);
        GUI.DrawTexture(new Rect(rect.x + rect.width - 1, rect.y, 1, rect.height), borderTex);
    }

    Texture2D MakeTex(Color color)
    {
        Texture2D tex = new Texture2D(1, 1);
        tex.SetPixel(0, 0, color);
        tex.Apply();
        return tex;
    }
}
