using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// UI для отображения перезарядки способностей.
/// Показывает круговой индикатор телепорта и полосу длительности спринта.
/// </summary>
public class CooldownUI : MonoBehaviour
{
    [Header("Телепорт UI")]
    [SerializeField] private Image teleportCooldownFill;
    [SerializeField] private Image teleportIcon;
    [SerializeField] private TextMeshProUGUI teleportStatusText;
    [SerializeField] private Color teleportReadyColor = new Color(0.2f, 0.6f, 1f);
    [SerializeField] private Color teleportCooldownColor = new Color(0.5f, 0.5f, 0.5f);

    [Header("Спринт UI")]
    [SerializeField] private Image sprintDurationFill;
    [SerializeField] private Image sprintCooldownFill;
    [SerializeField] private TextMeshProUGUI sprintStatusText;
    [SerializeField] private Color sprintActiveColor = new Color(1f, 0.8f, 0.2f);
    [SerializeField] private Color sprintReadyColor = new Color(0.3f, 1f, 0.3f);
    [SerializeField] private Color sprintCooldownColor = new Color(0.5f, 0.5f, 0.5f);

    [Header("Ссылки на компоненты")]
    [SerializeField] private TeleportAbility teleportAbility;
    [SerializeField] private SprintAbility sprintAbility;

    private void Start()
    {
        if (teleportAbility == null || sprintAbility == null)
        {
            PlayerController player = FindObjectOfType<PlayerController>();
            if (player != null)
            {
                if (teleportAbility == null)
                    teleportAbility = player.GetComponent<TeleportAbility>();
                if (sprintAbility == null)
                    sprintAbility = player.GetComponent<SprintAbility>();
            }
        }
    }

    private void Update()
    {
        UpdateTeleportUI();
        UpdateSprintUI();
    }

    /// <summary>
    /// Обновляет UI индикатор перезарядки телепорта.
    /// </summary>
    private void UpdateTeleportUI()
    {
        if (teleportAbility == null) return;

        if (teleportCooldownFill != null)
        {
            teleportCooldownFill.fillAmount = teleportAbility.CooldownProgress;
            teleportCooldownFill.color = teleportAbility.IsOnCooldown
                ? teleportCooldownColor
                : teleportReadyColor;
        }

        if (teleportIcon != null)
        {
            teleportIcon.color = teleportAbility.IsOnCooldown
                ? teleportCooldownColor
                : teleportReadyColor;
        }

        if (teleportStatusText != null)
        {
            if (teleportAbility.IsOnCooldown)
            {
                teleportStatusText.text = $"{teleportAbility.CooldownTimer:F1}s";
                teleportStatusText.color = teleportCooldownColor;
            }
            else if (teleportAbility.IsAiming)
            {
                teleportStatusText.text = "ПРИЦЕЛ";
                teleportStatusText.color = teleportReadyColor;
            }
            else
            {
                teleportStatusText.text = "ГОТОВО";
                teleportStatusText.color = teleportReadyColor;
            }
        }
    }

    /// <summary>
    /// Обновляет UI индикатор спринта.
    /// </summary>
    private void UpdateSprintUI()
    {
        if (sprintAbility == null) return;

        // Полоса длительности спринта
        if (sprintDurationFill != null)
        {
            if (sprintAbility.IsSprinting)
            {
                sprintDurationFill.fillAmount = sprintAbility.SprintProgress;
                sprintDurationFill.color = sprintActiveColor;
            }
            else
            {
                sprintDurationFill.fillAmount = sprintAbility.IsOnCooldown ? 0f : 1f;
                sprintDurationFill.color = sprintReadyColor;
            }
        }

        // Полоса перезарядки спринта
        if (sprintCooldownFill != null)
        {
            if (sprintAbility.IsOnCooldown)
            {
                sprintCooldownFill.fillAmount = sprintAbility.CooldownProgress;
                sprintCooldownFill.color = sprintCooldownColor;
            }
            else
            {
                sprintCooldownFill.fillAmount = 1f;
            }
        }

        if (sprintStatusText != null)
        {
            if (sprintAbility.IsSprinting)
            {
                sprintStatusText.text = $"СПРИНТ {sprintAbility.SprintTimeRemaining:F1}s";
                sprintStatusText.color = sprintActiveColor;
            }
            else if (sprintAbility.IsOnCooldown)
            {
                sprintStatusText.text = $"КД {sprintAbility.CooldownTimer:F1}s";
                sprintStatusText.color = sprintCooldownColor;
            }
            else
            {
                sprintStatusText.text = "SHIFT - СПРИНТ";
                sprintStatusText.color = sprintReadyColor;
            }
        }
    }
}
