using UnityEngine;

/// <summary>
/// Способность телепортации для SCP персонажа.
/// Работает с любым контроллером: CharacterController, Rigidbody или просто Transform.
/// 
/// Управление:
/// - Зажмите ЛКМ: появится маркер куда вы целитесь
/// - Отпустите ЛКМ: телепортация к маркеру
/// 
/// Скрипт полностью автономный, не зависит от других скриптов проекта.
/// </summary>
public class SCPTeleport : MonoBehaviour
{
    [Header("Настройки телепортации")]
    [Tooltip("Максимальная дальность телепортации")]
    public float maxDistance = 15f;

    [Tooltip("Перезарядка в секундах")]
    public float cooldown = 3f;

    [Tooltip("Слой земли для рейкаста (оставьте пустым для всех слоев)")]
    public LayerMask groundLayer = ~0;

    [Tooltip("Высота над землей при телепортации (чтобы не застрять в полу)")]
    public float teleportHeightOffset = 1.1f;

    [Header("Визуальные настройки маркера")]
    [Tooltip("Размер маркера")]
    public float markerSize = 0.5f;

    [Tooltip("Цвет при прицеливании")]
    public Color aimingColor = new Color(0.2f, 0.5f, 1f, 0.7f);

    [Tooltip("Цвет когда можно телепортироваться")]
    public Color readyColor = new Color(0.2f, 1f, 0.2f, 0.7f);

    [Tooltip("Цвет когда перезарядка")]
    public Color cooldownColor = new Color(1f, 0.2f, 0.2f, 0.7f);

    // Приватные переменные
    private float lastTeleportTime = -999f;
    private bool isAiming = false;
    private Vector3 targetPosition;
    private bool hasValidTarget = false;

    private GameObject markerObject;
    private Renderer markerRenderer;
    private Material markerMaterial;

    // Компоненты для перемещения (определяются автоматически)
    private CharacterController characterController;
    private Rigidbody rb;

    void Start()
    {
        // Определяем какой контроллер движения используется
        characterController = GetComponent<CharacterController>();
        rb = GetComponent<Rigidbody>();

        // Создаем маркер телепортации
        CreateMarker();

        // Разрешаем сразу телепортироваться
        lastTeleportTime = -cooldown;
    }

    void CreateMarker()
    {
        markerObject = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        markerObject.name = "TeleportMarker";
        markerObject.transform.localScale = Vector3.one * markerSize;

        // Убираем коллайдер чтобы не мешал
        Collider col = markerObject.GetComponent<Collider>();
        if (col != null) Destroy(col);

        // Создаем полупрозрачный материал
        markerRenderer = markerObject.GetComponent<Renderer>();
        markerMaterial = new Material(Shader.Find("Sprites/Default"));
        if (markerMaterial == null)
        {
            markerMaterial = new Material(Shader.Find("Unlit/Color"));
        }
        markerRenderer.material = markerMaterial;

        // Скрываем маркер по умолчанию
        markerObject.SetActive(false);
    }

    void Update()
    {
        float timeSinceLastTeleport = Time.time - lastTeleportTime;
        bool isOnCooldown = timeSinceLastTeleport < cooldown;

        // --- НАЧАЛО ПРИЦЕЛИВАНИЯ ---
        if (Input.GetMouseButtonDown(0))
        {
            isAiming = true;
            markerObject.SetActive(true);
        }

        // --- ПРИЦЕЛИВАНИЕ (зажата ЛКМ) ---
        if (isAiming && Input.GetMouseButton(0))
        {
            UpdateAimPosition();

            // Обновляем цвет маркера
            if (isOnCooldown)
            {
                SetMarkerColor(cooldownColor);
            }
            else if (hasValidTarget)
            {
                SetMarkerColor(readyColor);
            }
            else
            {
                SetMarkerColor(aimingColor);
            }
        }

        // --- ТЕЛЕПОРТАЦИЯ (отпустили ЛКМ) ---
        if (Input.GetMouseButtonUp(0) && isAiming)
        {
            isAiming = false;
            markerObject.SetActive(false);

            if (hasValidTarget && !isOnCooldown)
            {
                Teleport(targetPosition);
                lastTeleportTime = Time.time;
            }
        }
    }

    void UpdateAimPosition()
    {
        // Рейкаст от камеры в направлении курсора
        Camera cam = Camera.main;
        if (cam == null)
        {
            hasValidTarget = false;
            return;
        }

        Ray ray = cam.ScreenPointToRay(new Vector3(Screen.width / 2f, Screen.height / 2f, 0f));
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, maxDistance * 2f, groundLayer))
        {
            // Проверяем расстояние от игрока до точки
            float distance = Vector3.Distance(transform.position, hit.point);

            if (distance <= maxDistance)
            {
                targetPosition = hit.point;
                hasValidTarget = true;
                markerObject.transform.position = hit.point + Vector3.up * 0.1f;
            }
            else
            {
                // Показываем маркер на максимальной дистанции
                Vector3 direction = (hit.point - transform.position).normalized;
                Vector3 maxPoint = transform.position + direction * maxDistance;

                // Рейкаст вниз чтобы найти землю
                RaycastHit groundHit;
                if (Physics.Raycast(maxPoint + Vector3.up * 5f, Vector3.down, out groundHit, 20f, groundLayer))
                {
                    targetPosition = groundHit.point;
                    hasValidTarget = true;
                    markerObject.transform.position = groundHit.point + Vector3.up * 0.1f;
                }
                else
                {
                    hasValidTarget = false;
                    markerObject.transform.position = maxPoint;
                }
            }
        }
        else
        {
            hasValidTarget = false;
            // Показываем маркер впереди
            markerObject.transform.position = ray.origin + ray.direction * maxDistance;
        }
    }

    void Teleport(Vector3 position)
    {
        Vector3 teleportPos = position + Vector3.up * teleportHeightOffset;

        // Телепортируем в зависимости от типа контроллера
        if (characterController != null)
        {
            // CharacterController не дает менять позицию напрямую, нужно отключить
            characterController.enabled = false;
            transform.position = teleportPos;
            characterController.enabled = true;
        }
        else if (rb != null)
        {
            // Rigidbody - сбрасываем скорость и перемещаем
            rb.linearVelocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;
            transform.position = teleportPos;
        }
        else
        {
            // Просто Transform
            transform.position = teleportPos;
        }
    }

    void SetMarkerColor(Color color)
    {
        if (markerMaterial != null)
        {
            markerMaterial.color = color;
        }
    }

    // --- HUD через OnGUI (без Canvas) ---
    void OnGUI()
    {
        float timeSinceLastTeleport = Time.time - lastTeleportTime;
        float remainingCooldown = cooldown - timeSinceLastTeleport;

        // Стиль текста
        GUIStyle style = new GUIStyle(GUI.skin.label);
        style.fontSize = 20;
        style.fontStyle = FontStyle.Bold;

        // Позиция - нижний левый угол
        float x = 20f;
        float y = Screen.height - 60f;

        if (remainingCooldown > 0f)
        {
            style.normal.textColor = Color.red;
            GUI.Label(new Rect(x, y, 400f, 40f), $"Телепорт: {remainingCooldown:F1} сек", style);
        }
        else
        {
            style.normal.textColor = Color.green;
            GUI.Label(new Rect(x, y, 400f, 40f), "Телепорт: ГОТОВ [ЛКМ]", style);
        }

        // Прицел в центре экрана при прицеливании
        if (isAiming)
        {
            GUIStyle crossStyle = new GUIStyle(GUI.skin.label);
            crossStyle.fontSize = 30;
            crossStyle.alignment = TextAnchor.MiddleCenter;
            crossStyle.normal.textColor = hasValidTarget ? Color.green : Color.red;

            float cx = Screen.width / 2f - 15f;
            float cy = Screen.height / 2f - 15f;
            GUI.Label(new Rect(cx, cy, 30f, 30f), "+", crossStyle);
        }
    }

    void OnDestroy()
    {
        // Убираем маркер при удалении скрипта
        if (markerObject != null)
        {
            Destroy(markerObject);
        }
        if (markerMaterial != null)
        {
            Destroy(markerMaterial);
        }
    }
}
