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
