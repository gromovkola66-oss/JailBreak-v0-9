using UnityEngine;

/// <summary>
/// Система телепортации игрока. Позволяет зажать ЛКМ для отображения
/// радиуса телепортации и превью позиции, отпустить для телепортации.
/// Перезарядка: 2 секунды.
/// </summary>
[RequireComponent(typeof(PlayerController))]
public class TeleportAbility : MonoBehaviour
{
    [Header("Параметры телепортации")]
    [SerializeField] private float maxTeleportRadius = 10f;
    [SerializeField] private float cooldownDuration = 2f;
    [SerializeField] private LayerMask groundLayerMask;

    [Header("Визуальные компоненты")]
    [SerializeField] private TeleportRadiusIndicator radiusIndicator;
    [SerializeField] private TeleportEffect teleportEffect;
    [SerializeField] private GameObject ghostPreviewPrefab;

    private PlayerController playerController;
    private GameObject ghostPreviewInstance;
    private float cooldownTimer;
    private bool isAiming;
    private Vector3 targetPosition;
    private Camera mainCamera;

    /// <summary>
    /// Находится ли способность на перезарядке.
    /// </summary>
    public bool IsOnCooldown => cooldownTimer > 0f;

    /// <summary>
    /// Текущее время перезарядки (0 = готово).
    /// </summary>
    public float CooldownTimer => cooldownTimer;

    /// <summary>
    /// Общее время перезарядки.
    /// </summary>
    public float CooldownDuration => cooldownDuration;

    /// <summary>
    /// Прогресс перезарядки от 0 до 1 (1 = готово).
    /// </summary>
    public float CooldownProgress => IsOnCooldown ? 1f - (cooldownTimer / cooldownDuration) : 1f;

    /// <summary>
    /// Находится ли игрок в режиме прицеливания телепорта.
    /// </summary>
    public bool IsAiming => isAiming;

    /// <summary>
    /// Максимальный радиус телепортации.
    /// </summary>
    public float MaxRadius => maxTeleportRadius;

    private void Awake()
    {
        playerController = GetComponent<PlayerController>();
        mainCamera = Camera.main;
    }

    private void Start()
    {
        // Создаём превью-призрак если есть префаб
        if (ghostPreviewPrefab != null)
        {
            ghostPreviewInstance = Instantiate(ghostPreviewPrefab);
            ghostPreviewInstance.SetActive(false);
        }
        else
        {
            CreateDefaultGhostPreview();
        }
    }

    private void Update()
    {
        UpdateCooldown();
        HandleInput();
    }

    /// <summary>
    /// Обновляет таймер перезарядки.
    /// </summary>
    private void UpdateCooldown()
    {
        if (cooldownTimer > 0f)
        {
            cooldownTimer -= Time.deltaTime;
            if (cooldownTimer < 0f)
                cooldownTimer = 0f;
        }
    }

    /// <summary>
    /// Обрабатывает ввод для телепортации (ЛКМ).
    /// </summary>
    private void HandleInput()
    {
        // Начало прицеливания - зажатие ЛКМ
        if (Input.GetMouseButtonDown(0) && !IsOnCooldown)
        {
            StartAiming();
        }

        // Обновление прицеливания
        if (isAiming)
        {
            UpdateAiming();
        }

        // Выполнение телепортации - отпускание ЛКМ
        if (Input.GetMouseButtonUp(0) && isAiming)
        {
            ExecuteTeleport();
        }

        // Отмена прицеливания при перезарядке
        if (isAiming && IsOnCooldown)
        {
            CancelAiming();
        }
    }

    /// <summary>
    /// Начинает режим прицеливания телепорта.
    /// </summary>
    private void StartAiming()
    {
        isAiming = true;

        if (radiusIndicator != null)
        {
            radiusIndicator.Show(maxTeleportRadius);
        }

        if (ghostPreviewInstance != null)
        {
            ghostPreviewInstance.SetActive(true);
        }
    }

    /// <summary>
    /// Обновляет позицию прицела и превью во время прицеливания.
    /// </summary>
    private void UpdateAiming()
    {
        if (mainCamera == null)
            mainCamera = Camera.main;

        if (mainCamera == null) return;

        Ray ray = mainCamera.ScreenPointToRay(Input.mousePosition);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, 100f, groundLayerMask))
        {
            Vector3 playerPos = transform.position;
            Vector3 hitPoint = hit.point;

            // Вычисляем направление и ограничиваем радиусом
            Vector3 direction = hitPoint - playerPos;
            direction.y = 0f;

            if (direction.magnitude > maxTeleportRadius)
            {
                direction = direction.normalized * maxTeleportRadius;
            }

            targetPosition = playerPos + direction;
            targetPosition.y = hit.point.y;

            // Обновляем позицию призрака
            if (ghostPreviewInstance != null)
            {
                ghostPreviewInstance.transform.position = targetPosition;
                ghostPreviewInstance.transform.rotation = transform.rotation;
            }
        }
        else
        {
            // Если луч не попал в землю, используем плоскость на уровне игрока
            Plane groundPlane = new Plane(Vector3.up, transform.position);
            float distance;

            if (groundPlane.Raycast(ray, out distance))
            {
                Vector3 point = ray.GetPoint(distance);
                Vector3 direction = point - transform.position;
                direction.y = 0f;

                if (direction.magnitude > maxTeleportRadius)
                {
                    direction = direction.normalized * maxTeleportRadius;
                }

                targetPosition = transform.position + direction;

                if (ghostPreviewInstance != null)
                {
                    ghostPreviewInstance.transform.position = targetPosition;
                    ghostPreviewInstance.transform.rotation = transform.rotation;
                }
            }
        }
    }

    /// <summary>
    /// Выполняет телепортацию к целевой позиции.
    /// </summary>
    private void ExecuteTeleport()
    {
        Vector3 departurePos = transform.position;

        // Запускаем эффект телепортации
        if (teleportEffect != null)
        {
            teleportEffect.PlayTeleportEffect(departurePos, targetPosition);
        }

        // Телепортируем игрока
        playerController.TeleportTo(targetPosition);

        // Запускаем перезарядку
        cooldownTimer = cooldownDuration;

        // Завершаем прицеливание
        CancelAiming();
    }

    /// <summary>
    /// Отменяет режим прицеливания.
    /// </summary>
    private void CancelAiming()
    {
        isAiming = false;

        if (radiusIndicator != null)
        {
            radiusIndicator.Hide();
        }

        if (ghostPreviewInstance != null)
        {
            ghostPreviewInstance.SetActive(false);
        }
    }

    /// <summary>
    /// Создаёт стандартное превью-призрак (полупрозрачная капсула).
    /// </summary>
    private void CreateDefaultGhostPreview()
    {
        ghostPreviewInstance = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        ghostPreviewInstance.name = "TeleportGhostPreview";

        // Удаляем коллайдер с превью
        Collider col = ghostPreviewInstance.GetComponent<Collider>();
        if (col != null)
            Destroy(col);

        // Применяем полупрозрачный материал
        Renderer renderer = ghostPreviewInstance.GetComponent<Renderer>();
        if (renderer != null)
        {
            Material ghostMat = new Material(Shader.Find("Standard"));
            ghostMat.SetFloat("_Mode", 3); // Transparent mode
            ghostMat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            ghostMat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            ghostMat.SetInt("_ZWrite", 0);
            ghostMat.DisableKeyword("_ALPHATEST_ON");
            ghostMat.EnableKeyword("_ALPHABLEND_ON");
            ghostMat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
            ghostMat.renderQueue = 3000;
            ghostMat.color = new Color(0.2f, 0.5f, 1f, 0.4f);
            renderer.material = ghostMat;
        }

        ghostPreviewInstance.SetActive(false);
    }
}
