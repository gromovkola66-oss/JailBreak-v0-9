using UnityEngine;

public class BotHealth : MonoBehaviour
{
    public float maxHP = 100f;
    public float currentHP = 100f;
    public bool isDead = false;

    private BotController botController;
    private Renderer botRenderer;

    public bool IsAlive { get { return !isDead; } }

    void Start()
    {
        botController = GetComponent<BotController>();
        botRenderer = GetComponentInChildren<Renderer>();
        currentHP = maxHP;
    }

    public void TakeDamage(float amount, string attackerName)
    {
        TakeDamage(amount, attackerName, "Unknown");
    }

    public void TakeDamage(float amount, string attackerName, string weaponName)
    {
        if (isDead) return;

        currentHP -= amount;
        currentHP = Mathf.Max(currentHP, 0f);

        if (currentHP <= 0f)
        {
            Die(attackerName, weaponName);
        }
    }

    private void Die(string attackerName, string weaponName)
    {
        isDead = true;

        if (botController != null)
            botController.SetDead();

        if (botRenderer != null)
        {
            botRenderer.enabled = false;
        }

        KillFeed killFeed = FindFirstObjectByType<KillFeed>();
        if (killFeed != null)
        {
            killFeed.AddKill(attackerName, gameObject.name, weaponName);
        }

        RoundManager roundManager = FindFirstObjectByType<RoundManager>();
        if (roundManager != null)
        {
            roundManager.OnEntityDied(gameObject);
        }

        Collider col = GetComponent<Collider>();
        if (col != null) col.enabled = false;

        CharacterController cc = GetComponent<CharacterController>();
        if (cc != null) cc.enabled = false;
    }

    public void ResetHealth()
    {
        isDead = false;
        currentHP = maxHP;

        if (botRenderer != null)
            botRenderer.enabled = true;

        Collider col = GetComponent<Collider>();
        if (col != null) col.enabled = true;

        CharacterController cc = GetComponent<CharacterController>();
        if (cc != null) cc.enabled = true;
    }
}
