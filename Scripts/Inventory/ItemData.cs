using UnityEngine;

[System.Serializable]
public enum ItemType
{
    Weapon,
    Key,
    Money,
    Medkit,
    Ammo,
    Tool,
    Misc
}

[System.Serializable]
public class ItemData
{
    public string itemName;
    public ItemType itemType;
    public int quantity;
    public int maxStack;
    public Color displayColor;
    public string description;

    public ItemData(string name, ItemType type, int qty, int maxStack, Color color, string desc)
    {
        this.itemName = name;
        this.itemType = type;
        this.quantity = qty;
        this.maxStack = maxStack;
        this.displayColor = color;
        this.description = desc;
    }

    public ItemData Clone()
    {
        return new ItemData(itemName, itemType, quantity, maxStack, displayColor, description);
    }

    // Predefined items
    public static ItemData AK47() => new ItemData("AK-47", ItemType.Weapon, 1, 1, new Color(0.3f, 0.3f, 0.3f), "Assault rifle. 30 rounds.");
    public static ItemData Shotgun() => new ItemData("Shotgun", ItemType.Weapon, 1, 1, new Color(0.4f, 0.3f, 0.2f), "Pump shotgun. 6 shells.");
    public static ItemData Pistol() => new ItemData("Pistol", ItemType.Weapon, 1, 1, new Color(0.25f, 0.25f, 0.3f), "Semi-auto pistol. 12 rounds.");
    public static ItemData Taser() => new ItemData("Taser", ItemType.Weapon, 1, 1, new Color(0.9f, 0.9f, 0.2f), "Stuns target for 3 sec.");
    public static ItemData Baton() => new ItemData("Baton", ItemType.Weapon, 1, 1, new Color(0.15f, 0.15f, 0.15f), "Melee weapon. Guards only.");
    public static ItemData Shiv() => new ItemData("Shiv", ItemType.Weapon, 1, 1, new Color(0.6f, 0.6f, 0.6f), "Improvised blade. Prisoners only.");
    public static ItemData CellKey() => new ItemData("Cell Key", ItemType.Key, 1, 1, new Color(0.8f, 0.7f, 0.2f), "Opens cell doors.");
    public static ItemData MasterKey() => new ItemData("Master Key", ItemType.Key, 1, 1, new Color(0.9f, 0.4f, 0.1f), "Opens all doors.");
    public static ItemData Money(int amount) => new ItemData("Money", ItemType.Money, amount, 9999, new Color(0.2f, 0.7f, 0.3f), "$" + amount);
    public static ItemData Medkit() => new ItemData("Medkit", ItemType.Medkit, 1, 3, new Color(0.9f, 0.2f, 0.2f), "Restores 50 HP.");
    public static ItemData AmmoBox() => new ItemData("Ammo Box", ItemType.Ammo, 30, 90, new Color(0.5f, 0.5f, 0.2f), "Refills magazine.");
}
