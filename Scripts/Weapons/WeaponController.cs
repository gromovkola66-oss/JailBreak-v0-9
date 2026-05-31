using UnityEngine;
using UnityEngine.InputSystem;

public class WeaponController : MonoBehaviour
{
    [Header("Weapons")]
    public WeaponData[] weapons = new WeaponData[6];
    public int currentWeaponIndex = 0;

    [Header("References")]
    public Transform weaponHolder;
    public Transform cameraTransform;
    public GameObject[] weaponModels;
    public GameObject muzzleFlash;

    [Header("Bob")]
    public float weaponBobSpeed = 10f;
    public float weaponBobAmount = 0.02f;

    [Header("Recoil")]
    public float recoilRecoverSpeed = 10f;

    private int currentAmmo;
    private int reserveAmmo = 999;
    private float nextFireTime = 0f;
    private bool isReloading = false;
    private float reloadTimer = 0f;
    private float muzzleFlashTimer = 0f;
    private float bobTimer = 0f;
    private Vector3 recoilOffset = Vector3.zero;
    private Vector3 weaponHolderOriginalPos;
    private PlayerController playerController;
    private Team playerTeam = Team.None;

    void Start()
    {
        weapons[0] = WeaponData.Fists();
        weapons[1] = WeaponData.Knife();
        weapons[2] = WeaponData.Pistol();
        weapons[3] = WeaponData.AK47();
        weapons[4] = WeaponData.M4A1();
        weapons[5] = WeaponData.Shotgun();

        playerController = GetComponent<PlayerController>();
        if (playerController != null)
        {
            playerTeam = playerController.team;
        }

        if (weaponHolder != null)
            weaponHolderOriginalPos = weaponHolder.localPosition;

        if (cameraTransform == null)
        {
            Camera cam = GetComponentInChildren<Camera>();
            if (cam != null) cameraTransform = cam.transform;
        }

        currentAmmo = weapons[currentWeaponIndex].magazineSize;
        SelectWeapon(0);
    }

    void Update()
    {
        if (playerController != null && playerController.isDead) return;

        Keyboard keyboard = Keyboard.current;
        Mouse mouse = Mouse.current;
        if (keyboard == null || mouse == null) return;

        playerTeam = playerController != null ? playerController.team : Team.None;

        HandleWeaponSwitch(keyboard, mouse);
        HandleFiring(mouse, keyboard);
        HandleReload(keyboard);
        HandleMuzzleFlash();
        HandleWeaponBob();
        HandleRecoilRecover();
    }

    private void HandleWeaponSwitch(Keyboard keyboard, Mouse mouse)
    {
        if (keyboard.digit1Key.wasPressedThisFrame) SelectWeapon(0);
        if (keyboard.digit2Key.wasPressedThisFrame) SelectWeapon(1);
        if (keyboard.digit3Key.wasPressedThisFrame) SelectWeapon(2);
        if (keyboard.digit4Key.wasPressedThisFrame) SelectWeapon(3);
        if (keyboard.digit5Key.wasPressedThisFrame) SelectWeapon(4);
        if (keyboard.digit6Key.wasPressedThisFrame) SelectWeapon(5);

        float scroll = mouse.scroll.ReadValue().y;
        if (scroll > 0f)
        {
            int next = (currentWeaponIndex + 1) % 6;
            SelectWeapon(next);
        }
        else if (scroll < 0f)
        {
            int prev = (currentWeaponIndex - 1 + 6) % 6;
            SelectWeapon(prev);
        }
    }

    private void SelectWeapon(int index)
    {
        currentWeaponIndex = index;
        WeaponData wd = weapons[currentWeaponIndex];
        currentAmmo = wd.magazineSize;
        isReloading = false;

        if (weaponModels != null)
        {
            for (int i = 0; i < weaponModels.Length; i++)
            {
                if (weaponModels[i] != null)
                    weaponModels[i].SetActive(i == currentWeaponIndex);
            }
        }
    }

    private void HandleFiring(Mouse mouse, Keyboard keyboard)
    {
        if (isReloading) return;
        WeaponData wd = weapons[currentWeaponIndex];

        if (!CanUseWeapon(wd)) return;

        bool wantsToFire = wd.isAutomatic ? mouse.leftButton.isPressed : mouse.leftButton.wasPressedThisFrame;

        if (wantsToFire && Time.time >= nextFireTime)
        {
            if (wd.isMelee)
            {
                MeleeAttack(wd);
            }
            else if (currentAmmo > 0)
            {
                Fire(wd);
            }
            else
            {
                StartReload(wd);
            }
            nextFireTime = Time.time + 1f / wd.fireRate;
        }
    }

    private bool CanUseWeapon(WeaponData wd)
    {
        if (wd.teamRestriction == TeamRestriction.GuardOnly && playerTeam != Team.Guard)
            return false;
        if (wd.teamRestriction == TeamRestriction.PrisonerOnly && playerTeam != Team.Prisoner)
            return false;
        return true;
    }

    private void Fire(WeaponData wd)
    {
        currentAmmo--;

        if (wd.weaponType == WeaponType.Shotgun)
        {
            for (int i = 0; i < wd.pelletCount; i++)
            {
                Vector3 spread = Random.insideUnitSphere * 0.05f;
                Vector3 dir = cameraTransform.forward + spread;
                ShootRaycast(dir.normalized, wd);
            }
        }
        else
        {
            ShootRaycast(cameraTransform.forward, wd);
        }

        ApplyRecoil(wd);
        ShowMuzzleFlash();
    }

    private void ShootRaycast(Vector3 direction, WeaponData wd)
    {
        Ray ray = new Ray(cameraTransform.position, direction);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, wd.range))
        {
            DamageReceiver dr = hit.collider.GetComponent<DamageReceiver>();
            if (dr == null)
                dr = hit.collider.GetComponentInParent<DamageReceiver>();

            if (dr != null)
            {
                string attackerName = gameObject.name;
                dr.TakeDamage(wd.damage, attackerName, playerTeam);
            }
        }
    }

    private void MeleeAttack(WeaponData wd)
    {
        Collider[] hits = Physics.OverlapSphere(cameraTransform.position + cameraTransform.forward * wd.meleeRange * 0.5f, wd.meleeRange * 0.5f);
        foreach (Collider col in hits)
        {
            if (col.gameObject == gameObject) continue;
            DamageReceiver dr = col.GetComponent<DamageReceiver>();
            if (dr == null)
                dr = col.GetComponentInParent<DamageReceiver>();
            if (dr != null)
            {
                dr.TakeDamage(wd.damage, gameObject.name, playerTeam);
            }
        }
        ApplyRecoil(wd);
    }

    private void ApplyRecoil(WeaponData wd)
    {
        recoilOffset = new Vector3(0f, 0f, -wd.recoilAmount);
    }

    private void HandleRecoilRecover()
    {
        if (weaponHolder == null) return;
        recoilOffset = Vector3.Lerp(recoilOffset, Vector3.zero, recoilRecoverSpeed * Time.deltaTime);
        weaponHolder.localPosition = weaponHolderOriginalPos + recoilOffset;
    }

    private void ShowMuzzleFlash()
    {
        if (muzzleFlash != null)
        {
            muzzleFlash.SetActive(true);
            muzzleFlashTimer = 0.05f;
        }
    }

    private void HandleMuzzleFlash()
    {
        if (muzzleFlashTimer > 0f)
        {
            muzzleFlashTimer -= Time.deltaTime;
            if (muzzleFlashTimer <= 0f && muzzleFlash != null)
            {
                muzzleFlash.SetActive(false);
            }
        }
    }

    private void HandleWeaponBob()
    {
        if (weaponHolder == null) return;
        if (playerController != null && playerController.isMoving)
        {
            float speedMul = playerController.isSprinting ? 1.5f : 1f;
            bobTimer += Time.deltaTime * weaponBobSpeed * speedMul;
            float bobY = Mathf.Sin(bobTimer) * weaponBobAmount;
            float bobX = Mathf.Cos(bobTimer * 0.5f) * weaponBobAmount * 0.5f;
            Vector3 bobOffset = new Vector3(bobX, bobY, 0f);
            weaponHolder.localPosition = weaponHolderOriginalPos + recoilOffset + bobOffset;
        }
        else
        {
            bobTimer = 0f;
        }
    }

    private void HandleReload(Keyboard keyboard)
    {
        WeaponData wd = weapons[currentWeaponIndex];
        if (wd.isMelee) return;

        if (isReloading)
        {
            reloadTimer -= Time.deltaTime;
            if (reloadTimer <= 0f)
            {
                currentAmmo = wd.magazineSize;
                isReloading = false;
            }
            return;
        }

        if (keyboard.rKey.wasPressedThisFrame && currentAmmo < wd.magazineSize)
        {
            StartReload(wd);
        }
    }

    private void StartReload(WeaponData wd)
    {
        if (wd.isMelee) return;
        isReloading = true;
        reloadTimer = wd.reloadTime;
    }

    public WeaponData GetCurrentWeapon()
    {
        return weapons[currentWeaponIndex];
    }

    public int GetCurrentAmmo() { return currentAmmo; }
    public bool IsReloading() { return isReloading; }
}
