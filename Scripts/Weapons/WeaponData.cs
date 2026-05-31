using UnityEngine;

public enum WeaponType
{
    Automatic,
    SemiAuto,
    Shotgun,
    Melee,
    Fists
}

public enum TeamRestriction
{
    GuardOnly,
    PrisonerOnly,
    Both
}

[System.Serializable]
public class WeaponData
{
    public string weaponName;
    public string displayName;
    public float damage;
    public float fireRate;
    public float range;
    public int magazineSize;
    public float reloadTime;
    public float recoilAmount;
    public bool isAutomatic;
    public bool isMelee;
    public float meleeRange;
    public WeaponType weaponType;
    public TeamRestriction teamRestriction;
    public int pelletCount;

    public static WeaponData AK47()
    {
        return new WeaponData
        {
            weaponName = "AK-47",
            displayName = "\u0410\u041A-47",
            damage = 25f,
            fireRate = 10f,
            range = 100f,
            magazineSize = 30,
            reloadTime = 2.5f,
            recoilAmount = 0.08f,
            isAutomatic = true,
            isMelee = false,
            meleeRange = 0f,
            weaponType = WeaponType.Automatic,
            teamRestriction = TeamRestriction.GuardOnly,
            pelletCount = 1
        };
    }

    public static WeaponData M4A1()
    {
        return new WeaponData
        {
            weaponName = "M4A1",
            displayName = "M4A1",
            damage = 22f,
            fireRate = 12f,
            range = 100f,
            magazineSize = 30,
            reloadTime = 2.3f,
            recoilAmount = 0.06f,
            isAutomatic = true,
            isMelee = false,
            meleeRange = 0f,
            weaponType = WeaponType.Automatic,
            teamRestriction = TeamRestriction.GuardOnly,
            pelletCount = 1
        };
    }

    public static WeaponData Shotgun()
    {
        return new WeaponData
        {
            weaponName = "Shotgun",
            displayName = "\u0414\u0440\u043E\u0431\u043E\u0432\u0438\u043A",
            damage = 15f,
            fireRate = 1.2f,
            range = 30f,
            magazineSize = 6,
            reloadTime = 3f,
            recoilAmount = 0.15f,
            isAutomatic = false,
            isMelee = false,
            meleeRange = 0f,
            weaponType = WeaponType.Shotgun,
            teamRestriction = TeamRestriction.GuardOnly,
            pelletCount = 8
        };
    }

    public static WeaponData Pistol()
    {
        return new WeaponData
        {
            weaponName = "Pistol",
            displayName = "\u041F\u0438\u0441\u0442\u043E\u043B\u0435\u0442",
            damage = 18f,
            fireRate = 5f,
            range = 50f,
            magazineSize = 12,
            reloadTime = 1.5f,
            recoilAmount = 0.04f,
            isAutomatic = false,
            isMelee = false,
            meleeRange = 0f,
            weaponType = WeaponType.SemiAuto,
            teamRestriction = TeamRestriction.Both,
            pelletCount = 1
        };
    }

    public static WeaponData Knife()
    {
        return new WeaponData
        {
            weaponName = "Knife",
            displayName = "\u041D\u043E\u0436",
            damage = 40f,
            fireRate = 2f,
            range = 2f,
            magazineSize = 0,
            reloadTime = 0f,
            recoilAmount = 0f,
            isAutomatic = false,
            isMelee = true,
            meleeRange = 2f,
            weaponType = WeaponType.Melee,
            teamRestriction = TeamRestriction.Both,
            pelletCount = 0
        };
    }

    public static WeaponData Fists()
    {
        return new WeaponData
        {
            weaponName = "Fists",
            displayName = "\u041A\u0443\u043B\u0430\u043A\u0438",
            damage = 15f,
            fireRate = 3f,
            range = 1.5f,
            magazineSize = 0,
            reloadTime = 0f,
            recoilAmount = 0f,
            isAutomatic = false,
            isMelee = true,
            meleeRange = 1.5f,
            weaponType = WeaponType.Fists,
            teamRestriction = TeamRestriction.Both,
            pelletCount = 0
        };
    }
}
