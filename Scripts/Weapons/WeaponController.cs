using UnityEngine;
using UnityEngine.InputSystem;

public class WeaponController : MonoBehaviour
{
    [Header("Weapon Settings")]
    public int currentWeaponIndex = 0;

    [Header("References")]
    public Transform cameraTransform;

    // Runtime state
    private WeaponData[] weapons;
    private int currentAmmo;
    private float nextFireTime;
    private bool isReloading;
    private float reloadEndTime;
    private float recoilRecovery;

    // Visual references
    private GameObject[] weaponModels;
    private GameObject muzzleFlash;
    private Transform weaponHolder;

    // Input
    private Mouse mouse;
    private Keyboard keyboard;

    // UI reference
    private WeaponUI weaponUI;

    // Inventory reference (to block input when open)
    private InventorySystem inventory;

    void Start()
    {
        mouse = Mouse.current;
        keyboard = Keyboard.current;

        // Setup weapons array
        weapons = new WeaponData[]
        {
            WeaponData.AK47(),
            WeaponData.Shotgun(),
            WeaponData.Pistol()
        };

        // Find inventory
        inventory = GetComponent<InventorySystem>();

        // Find weapon holder (in camera hierarchy)
        Transform cam = null;
        Camera mainCam = Camera.main;
        if (mainCam != null) cam = mainCam.transform;

        if (cam != null)
        {
            weaponHolder = cam.Find("WeaponHolder");
        }

        if (weaponHolder == null)
        {
            // Try old path
            weaponHolder = transform.Find("WeaponHolder");
        }

        if (weaponHolder == null)
        {
            Debug.LogError("WeaponController: WeaponHolder not found!");
            return;
        }

        // Find camera
        if (cameraTransform == null)
        {
            if (mainCam != null) cameraTransform = mainCam.transform;
        }

        // Find muzzle flash
        Transform muzzle = weaponHolder.Find("MuzzleFlash");
        if (muzzle != null) muzzleFlash = muzzle.gameObject;

        // Find weapon models
        weaponModels = new GameObject[3];
        Transform ak = weaponHolder.Find("AK47_Model");
        Transform sg = weaponHolder.Find("Shotgun_Model");
        Transform ps = weaponHolder.Find("Pistol_Model");
        if (ak != null) weaponModels[0] = ak.gameObject;
        if (sg != null) weaponModels[1] = sg.gameObject;
        if (ps != null) weaponModels[2] = ps.gameObject;

        // Find UI
        weaponUI = FindFirstObjectByType<WeaponUI>();

        // Init
        SwitchWeapon(0);
    }

    void Update()
    {
        if (mouse == null || keyboard == null)
        {
            mouse = Mouse.current;
            keyboard = Keyboard.current;
            if (mouse == null || keyboard == null) return;
        }

        // Block weapon input when inventory is open
        if (inventory != null && inventory.isInventoryOpen) return;

        HandleWeaponSwitch();
        HandleReload();
        HandleShooting();
        HandleRecoilRecovery();
        UpdateUI();
    }

    void HandleWeaponSwitch()
    {
        if (keyboard.digit1Key.wasPressedThisFrame) SwitchWeapon(0);
        if (keyboard.digit2Key.wasPressedThisFrame) SwitchWeapon(1);
        if (keyboard.digit3Key.wasPressedThisFrame) SwitchWeapon(2);

        // Scroll wheel
        float scroll = mouse.scroll.ReadValue().y;
        if (scroll > 0f)
        {
            int next = (currentWeaponIndex + 1) % weapons.Length;
            SwitchWeapon(next);
        }
        else if (scroll < 0f)
        {
            int prev = (currentWeaponIndex - 1 + weapons.Length) % weapons.Length;
            SwitchWeapon(prev);
        }
    }

    void SwitchWeapon(int index)
    {
        if (index == currentWeaponIndex && currentAmmo > 0) return;

        currentWeaponIndex = index;
        currentAmmo = weapons[index].magazineSize;
        isReloading = false;
        nextFireTime = 0f;

        // Show only active weapon model
        for (int i = 0; i < weaponModels.Length; i++)
        {
            if (weaponModels[i] != null)
                weaponModels[i].SetActive(i == index);
        }

        if (muzzleFlash != null) muzzleFlash.SetActive(false);
    }

    void HandleShooting()
    {
        if (isReloading) return;

        WeaponData weapon = weapons[currentWeaponIndex];
        bool shouldFire = false;

        if (weapon.isAutomatic)
        {
            shouldFire = mouse.leftButton.isPressed;
        }
        else
        {
            shouldFire = mouse.leftButton.wasPressedThisFrame;
        }

        if (shouldFire && Time.time >= nextFireTime && currentAmmo > 0)
        {
            Fire();
            nextFireTime = Time.time + (1f / weapon.fireRate);
        }

        // Auto-reload when empty
        if (currentAmmo <= 0 && !isReloading)
        {
            StartReload();
        }
    }

    void Fire()
    {
        WeaponData weapon = weapons[currentWeaponIndex];
        currentAmmo--;

        // Muzzle flash
        if (muzzleFlash != null)
        {
            muzzleFlash.SetActive(true);
            Invoke(nameof(HideMuzzleFlash), 0.05f);
        }

        // Raycast for hit detection
        if (cameraTransform != null)
        {
            if (weapon.weaponName == "Shotgun")
            {
                for (int i = 0; i < 8; i++)
                {
                    Vector3 spread = cameraTransform.forward +
                        cameraTransform.right * Random.Range(-0.05f, 0.05f) +
                        cameraTransform.up * Random.Range(-0.05f, 0.05f);
                    ShootRay(spread.normalized, weapon);
                }
            }
            else
            {
                Vector3 spread = cameraTransform.forward +
                    cameraTransform.right * Random.Range(-0.01f, 0.01f) +
                    cameraTransform.up * Random.Range(-0.01f, 0.01f);
                ShootRay(spread.normalized, weapon);
            }
        }

        // Recoil
        ApplyRecoil(weapon.recoilAmount);
    }

    void ShootRay(Vector3 direction, WeaponData weapon)
    {
        RaycastHit hit;
        if (Physics.Raycast(cameraTransform.position, direction, out hit, weapon.range))
        {
            CreateImpactEffect(hit.point, hit.normal);
        }
    }

    void CreateImpactEffect(Vector3 position, Vector3 normal)
    {
        GameObject impact = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        impact.name = "BulletHole";
        impact.transform.position = position + normal * 0.01f;
        impact.transform.localScale = new Vector3(0.1f, 0.1f, 0.1f);

        Object.Destroy(impact.GetComponent<Collider>());

        Renderer rend = impact.GetComponent<Renderer>();
        Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.color = new Color(0.1f, 0.1f, 0.1f);
        rend.material = mat;

        Object.Destroy(impact, 5f);
    }

    void ApplyRecoil(float amount)
    {
        recoilRecovery += amount * 0.3f;

        if (weaponHolder != null)
        {
            Vector3 pos = weaponHolder.localPosition;
            pos.z -= 0.02f;
            pos.y += 0.01f;
            weaponHolder.localPosition = pos;
        }
    }

    void HandleRecoilRecovery()
    {
        if (weaponHolder != null)
        {
            Vector3 targetPos = new Vector3(0.3f, -0.25f, 0.5f);
            weaponHolder.localPosition = Vector3.Lerp(weaponHolder.localPosition, targetPos, 10f * Time.deltaTime);
        }

        if (recoilRecovery > 0f)
        {
            recoilRecovery = Mathf.Lerp(recoilRecovery, 0f, 5f * Time.deltaTime);
        }
    }

    void HandleReload()
    {
        if (keyboard.rKey.wasPressedThisFrame && !isReloading && currentAmmo < weapons[currentWeaponIndex].magazineSize)
        {
            StartReload();
        }

        if (isReloading && Time.time >= reloadEndTime)
        {
            currentAmmo = weapons[currentWeaponIndex].magazineSize;
            isReloading = false;
        }
    }

    void StartReload()
    {
        isReloading = true;
        reloadEndTime = Time.time + weapons[currentWeaponIndex].reloadTime;
    }

    void HideMuzzleFlash()
    {
        if (muzzleFlash != null) muzzleFlash.SetActive(false);
    }

    void UpdateUI()
    {
        if (weaponUI != null)
        {
            weaponUI.UpdateWeaponInfo(
                weapons[currentWeaponIndex].weaponName,
                currentAmmo,
                weapons[currentWeaponIndex].magazineSize,
                isReloading
            );
        }
    }

    public string GetCurrentWeaponName() { return weapons[currentWeaponIndex].weaponName; }
    public int GetCurrentAmmo() { return currentAmmo; }
    public int GetMaxAmmo() { return weapons[currentWeaponIndex].magazineSize; }
    public bool IsReloading() { return isReloading; }
}
