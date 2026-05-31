using UnityEngine;

[System.Serializable]
public class WeaponData
{
    public string weaponName;
    public float damage;
    public float fireRate;          // shots per second
    public float range;
    public int magazineSize;
    public float reloadTime;
    public float recoilAmount;
    public bool isAutomatic;

    // Predefined weapons
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
            recoilAmount = 2f,
            isAutomatic = true
        };
    }

    public static WeaponData Shotgun()
    {
        return new WeaponData
        {
            weaponName = "Shotgun",
            damage = 15f,       // per pellet (8 pellets)
            fireRate = 1.2f,
            range = 30f,
            magazineSize = 6,
            reloadTime = 3f,
            recoilAmount = 5f,
            isAutomatic = false
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
            recoilAmount = 1.5f,
            isAutomatic = false
        };
    }
}
