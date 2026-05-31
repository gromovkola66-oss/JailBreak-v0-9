using UnityEngine;

public class HealthSystem : MonoBehaviour
{
    public float maxHP = 100f;
    public float currentHP = 100f;
    public bool isDead = false;

    public System.Action<float, float> OnDamaged;
    public System.Action<string, string> OnDied;

    private PlayerController playerController;

    void Start()
    {
        playerController = GetComponent<PlayerController>();
        currentHP = maxHP;
    }

    public bool IsAlive { get { return !isDead; } }

    public void TakeDamage(float amount, string attackerName)
    {
        if (isDead) return;

        currentHP -= amount;
        currentHP = Mathf.Max(currentHP, 0f);

        if (OnDamaged != null)
            OnDamaged.Invoke(currentHP, maxHP);

        if (currentHP <= 0f)
        {
            Die(attackerName);
        }
    }

    public void Heal(float amount)
    {
        if (isDead) return;
        currentHP = Mathf.Min(currentHP + amount, maxHP);
        if (OnDamaged != null)
            OnDamaged.Invoke(currentHP, maxHP);
    }

    private void Die(string attackerName)
    {
        isDead = true;

        string victimName = gameObject.name;
        if (OnDied != null)
            OnDied.Invoke(attackerName, victimName);

        KillFeed killFeed = FindFirstObjectByType<KillFeed>();
        if (killFeed != null)
        {
            WeaponController wc = FindFirstObjectByType<WeaponController>();
            string weaponName = wc != null && wc.GetCurrentWeapon() != null ? wc.GetCurrentWeapon().weaponName : "Unknown";
            killFeed.AddKill(attackerName, victimName, weaponName);
        }

        if (playerController != null)
        {
            playerController.SetDead();
        }

        RoundManager roundManager = FindFirstObjectByType<RoundManager>();
        if (roundManager != null)
        {
            roundManager.OnEntityDied(gameObject);
        }
    }

    public void ResetHealth()
    {
        isDead = false;
        currentHP = maxHP;
    }
}
