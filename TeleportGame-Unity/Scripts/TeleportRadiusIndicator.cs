using UnityEngine;

/// <summary>
/// Визуальный индикатор радиуса телепортации.
/// Отображает круг на земле при прицеливании телепорта.
/// Анимированный пульсирующий край, меняет цвет в зависимости от состояния.
/// </summary>
public class TeleportRadiusIndicator : MonoBehaviour
{
    [Header("Настройки отображения")]
    [SerializeField] private Material circleMaterial;
    [SerializeField] private Color readyColor = new Color(0.2f, 0.6f, 1f, 0.5f);
    [SerializeField] private Color cooldownColor = new Color(1f, 0.2f, 0.2f, 0.5f);
    [SerializeField] private float pulseSpeed = 2f;
    [SerializeField] private float pulseAmplitude = 0.1f;
    [SerializeField] private int circleSegments = 64;
    [SerializeField] private float lineWidth = 0.05f;

    private GameObject circleObject;
    private LineRenderer lineRenderer;
    private MeshRenderer meshRenderer;
    private float currentRadius;
    private bool isVisible;
    private float pulseTimer;

    private void Awake()
    {
        CreateCircleIndicator();
        Hide();
    }

    private void Update()
    {
        if (isVisible)
        {
            AnimatePulse();
            UpdatePosition();
        }
    }

    /// <summary>
    /// Показывает индикатор радиуса с указанным максимальным радиусом.
    /// </summary>
    /// <param name="radius">Радиус телепортации.</param>
    public void Show(float radius)
    {
        currentRadius = radius;
        isVisible = true;

        if (circleObject != null)
            circleObject.SetActive(true);

        UpdateCircle(radius);
        SetColor(readyColor);
    }

    /// <summary>
    /// Скрывает индикатор радиуса.
    /// </summary>
    public void Hide()
    {
        isVisible = false;

        if (circleObject != null)
            circleObject.SetActive(false);
    }

    /// <summary>
    /// Устанавливает цвет индикатора (синий - готов, красный - перезарядка).
    /// </summary>
    /// <param name="color">Цвет индикатора.</param>
    public void SetColor(Color color)
    {
        if (lineRenderer != null)
        {
            lineRenderer.startColor = color;
            lineRenderer.endColor = color;
        }

        if (circleMaterial != null)
        {
            circleMaterial.SetColor("_Color", color);
        }
    }

    /// <summary>
    /// Создаёт объект индикатора с LineRenderer для отрисовки круга.
    /// </summary>
    private void CreateCircleIndicator()
    {
        circleObject = new GameObject("TeleportRadiusCircle");
        circleObject.transform.SetParent(transform);
        circleObject.transform.localPosition = Vector3.zero;

        lineRenderer = circleObject.AddComponent<LineRenderer>();
        lineRenderer.useWorldSpace = false;
        lineRenderer.loop = true;
        lineRenderer.positionCount = circleSegments;
        lineRenderer.startWidth = lineWidth;
        lineRenderer.endWidth = lineWidth;

        // Создаём простой материал если не назначен
        if (circleMaterial != null)
        {
            lineRenderer.material = circleMaterial;
        }
        else
        {
            lineRenderer.material = new Material(Shader.Find("Sprites/Default"));
        }

        lineRenderer.startColor = readyColor;
        lineRenderer.endColor = readyColor;
    }

    /// <summary>
    /// Обновляет геометрию круга с указанным радиусом.
    /// </summary>
    /// <param name="radius">Радиус круга.</param>
    private void UpdateCircle(float radius)
    {
        if (lineRenderer == null) return;

        float angleStep = 360f / circleSegments;

        for (int i = 0; i < circleSegments; i++)
        {
            float angle = i * angleStep * Mathf.Deg2Rad;
            float x = Mathf.Cos(angle) * radius;
            float z = Mathf.Sin(angle) * radius;
            lineRenderer.SetPosition(i, new Vector3(x, 0.05f, z));
        }
    }

    /// <summary>
    /// Анимирует пульсацию индикатора.
    /// </summary>
    private void AnimatePulse()
    {
        pulseTimer += Time.deltaTime * pulseSpeed;
        float pulse = 1f + Mathf.Sin(pulseTimer) * pulseAmplitude;
        float animatedRadius = currentRadius * pulse;
        UpdateCircle(animatedRadius);

        // Пульсация прозрачности
        float alpha = 0.3f + Mathf.Sin(pulseTimer * 1.5f) * 0.2f;
        Color currentColor = lineRenderer.startColor;
        currentColor.a = alpha;
        lineRenderer.startColor = currentColor;
        lineRenderer.endColor = currentColor;
    }

    /// <summary>
    /// Обновляет позицию индикатора (следует за игроком).
    /// </summary>
    private void UpdatePosition()
    {
        if (circleObject != null)
        {
            circleObject.transform.position = new Vector3(
                transform.position.x,
                transform.position.y + 0.05f,
                transform.position.z
            );
        }
    }
}
