using UnityEngine;

/// <summary>
/// Система спринта. Нажатие Shift активирует быстрый бег
/// на 10 секунд с последующей перезарядкой.
/// </summary>
[RequireComponent(typeof(PlayerController))]
public class SprintAbility : MonoBehaviour
{
    [Header("Параметры спринта")]
    [SerializeField] private float sprintDuration = 10f;
    [SerializeField] private float sprintCooldown = 5f;
    [SerializeField] private float speedMultiplier = 2f;

    [Header("Визуальные эффекты")]
    [SerializeField] private SprintEffect sprintEffect;

    private float sprintTimer;
    private float cooldownTimer;
    private bool isSprinting;
    private PlayerController playerController;

    /// <summary>
    /// Активен ли спринт в данный момент.
    /// </summary>
    public bool IsSprinting => isSprinting;

    /// <summary>
    /// Множитель скорости при спринте.
    /// </summary>
    public float SpeedMultiplier => speedMultiplier;

    /// <summary>
    /// Оставшееся время спринта.
    /// </summary>
    public float SprintTimeRemaining => sprintTimer;

    /// <summary>
    /// Максимальная длительность спринта.
    /// </summary>
    public float SprintDuration => sprintDuration;

    /// <summary>
    /// Прогресс спринта от 0 до 1 (1 = полный запас).
    /// </summary>
    public float SprintProgress => isSprinting ? sprintTimer / sprintDuration : 1f;

    /// <summary>
    /// Находится ли спринт на перезарядке.
    /// </summary>
    public bool IsOnCooldown => cooldownTimer > 0f;

    /// <summary>
    /// Прогресс перезарядки спринта от 0 до 1 (1 = готово).
    /// </summary>
    public float CooldownProgress => IsOnCooldown ? 1f - (cooldownTimer / sprintCooldown) : 1f;

    /// <summary>
    /// Время перезарядки спринта.
    /// </summary>
    public float CooldownDuration => sprintCooldown;

    /// <summary>
    /// Текущее время перезарядки.
    /// </summary>
    public float CooldownTimer => cooldownTimer;

    private void Awake()
    {
        playerController = GetComponent<PlayerController>();

        if (sprintEffect == null)
            sprintEffect = GetComponent<SprintEffect>();
    }

    private void Update()
    {
        HandleCooldown();
        HandleInput();
        HandleSprintDuration();
    }

    /// <summary>
    /// Обрабатывает таймер перезарядки.
    /// </summary>
    private void HandleCooldown()
    {
        if (cooldownTimer > 0f)
        {
            cooldownTimer -= Time.deltaTime;
            if (cooldownTimer < 0f)
                cooldownTimer = 0f;
        }
    }

    /// <summary>
    /// Обрабатывает ввод клавиши Shift для спринта.
    /// </summary>
    private void HandleInput()
    {
        // Активация спринта при нажатии Shift
        if (Input.GetKeyDown(KeyCode.LeftShift) && !isSprinting && !IsOnCooldown)
        {
            ActivateSprint();
        }

        // Деактивация спринта при отпускании Shift (опционально)
        if (Input.GetKeyUp(KeyCode.LeftShift) && isSprinting)
        {
            DeactivateSprint();
        }
    }

    /// <summary>
    /// Обрабатывает длительность спринта.
    /// </summary>
    private void HandleSprintDuration()
    {
        if (isSprinting)
        {
            sprintTimer -= Time.deltaTime;

            if (sprintTimer <= 0f)
            {
                sprintTimer = 0f;
                DeactivateSprint();
            }
        }
    }

    /// <summary>
    /// Активирует режим спринта.
    /// </summary>
    private void ActivateSprint()
    {
        isSprinting = true;
        sprintTimer = sprintDuration;

        if (sprintEffect != null)
        {
            sprintEffect.StartSprintEffect();
        }
    }

    /// <summary>
    /// Деактивирует режим спринта и запускает перезарядку.
    /// </summary>
    private void DeactivateSprint()
    {
        isSprinting = false;
        cooldownTimer = sprintCooldown;

        if (sprintEffect != null)
        {
            sprintEffect.StopSprintEffect();
        }
    }
}
