using UnityEngine;

public class DamageReceiver : MonoBehaviour
{
    public Team team = Team.None;

    private HealthSystem healthSystem;
    private BotHealth botHealth;

    void Start()
    {
        healthSystem = GetComponent<HealthSystem>();
        if (healthSystem == null)
            healthSystem = GetComponentInParent<HealthSystem>();

        botHealth = GetComponent<BotHealth>();
        if (botHealth == null)
            botHealth = GetComponentInParent<BotHealth>();
    }

    public void TakeDamage(float amount, string attackerName, Team attackerTeam)
    {
        TakeDamage(amount, attackerName, attackerTeam, "Unknown");
    }

    public void TakeDamage(float amount, string attackerName, Team attackerTeam, string weaponName)
    {
        if (attackerTeam == team && team != Team.None) return;

        if (healthSystem != null)
        {
            healthSystem.TakeDamage(amount, attackerName, weaponName);
        }
        else if (botHealth != null)
        {
            botHealth.TakeDamage(amount, attackerName, weaponName);
        }
    }
}
