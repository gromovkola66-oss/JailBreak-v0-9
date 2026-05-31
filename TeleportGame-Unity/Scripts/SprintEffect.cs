using UnityEngine;

/// <summary>
/// Визуальные эффекты спринта: линии скорости, трейл-рендерер,
/// изменение FOV камеры, частицы пыли.
/// </summary>
public class SprintEffect : MonoBehaviour
{
    [Header("Линии скорости")]
    [SerializeField] private int speedLineCount = 20;
    [SerializeField] private Color speedLineColor = new Color(1f, 1f, 1f, 0.3f);
    [SerializeField] private float speedLineLength = 2f;
    [SerializeField] private float speedLineSpeed = 15f;

    [Header("Трейл")]
    [SerializeField] private Color trailColor = new Color(0.3f, 0.7f, 1f, 0.5f);
    [SerializeField] private float trailWidth = 0.3f;
    [SerializeField] private float trailTime = 0.3f;

    [Header("Камера")]
    [SerializeField] private float normalFOV = 60f;
    [SerializeField] private float sprintFOV = 75f;
    [SerializeField] private float fovTransitionSpeed = 5f;

    [Header("Пыль")]
    [SerializeField] private Color dustColor = new Color(0.7f, 0.6f, 0.5f, 0.4f);
    [SerializeField] private float dustEmissionRate = 10f;

    private ParticleSystem speedLinesParticles;
    private ParticleSystem dustParticles;
    private TrailRenderer trailRenderer;
    private Camera mainCamera;
    private bool isActive;
    private float targetFOV;

    private void Awake()
    {
        mainCamera = Camera.main;
        targetFOV = normalFOV;

        CreateSpeedLinesEffect();
        CreateDustEffect();
        CreateTrailRenderer();
    }

    private void Update()
    {
        UpdateCameraFOV();
    }

    /// <summary>
    /// Запускает все эффекты спринта.
    /// </summary>
    public void StartSprintEffect()
    {
        isActive = true;
        targetFOV = sprintFOV;

        if (speedLinesParticles != null)
            speedLinesParticles.Play();

        if (dustParticles != null)
            dustParticles.Play();

        if (trailRenderer != null)
            trailRenderer.emitting = true;
    }

    /// <summary>
    /// Останавливает все эффекты спринта.
    /// </summary>
    public void StopSprintEffect()
    {
        isActive = false;
        targetFOV = normalFOV;

        if (speedLinesParticles != null)
            speedLinesParticles.Stop();

        if (dustParticles != null)
            dustParticles.Stop();

        if (trailRenderer != null)
            trailRenderer.emitting = false;
    }

    /// <summary>
    /// Плавно изменяет FOV камеры.
    /// </summary>
    private void UpdateCameraFOV()
    {
        if (mainCamera == null)
        {
            mainCamera = Camera.main;
            if (mainCamera == null) return;
        }

        mainCamera.fieldOfView = Mathf.Lerp(
            mainCamera.fieldOfView,
            targetFOV,
            Time.deltaTime * fovTransitionSpeed
        );
    }

    /// <summary>
    /// Создаёт систему частиц для линий скорости.
    /// </summary>
    private void CreateSpeedLinesEffect()
    {
        GameObject speedLinesObj = new GameObject("SpeedLines");
        speedLinesObj.transform.SetParent(transform);
        speedLinesObj.transform.localPosition = Vector3.zero;

        speedLinesParticles = speedLinesObj.AddComponent<ParticleSystem>();

        var main = speedLinesParticles.main;
        main.loop = true;
        main.playOnAwake = false;
        main.startLifetime = 0.5f;
        main.startSpeed = speedLineSpeed;
        main.startSize = 0.02f;
        main.startColor = speedLineColor;
        main.maxParticles = speedLineCount * 2;
        main.simulationSpace = ParticleSystemSimulationSpace.Local;

        var emission = speedLinesParticles.emission;
        emission.rateOverTime = speedLineCount;

        var shape = speedLinesParticles.shape;
        shape.shapeType = ParticleSystemShapeType.Cone;
        shape.angle = 5f;
        shape.radius = 1f;
        shape.rotation = new Vector3(0f, 0f, 180f);

        // Растягивание частиц для эффекта линий
        var renderer = speedLinesObj.GetComponent<ParticleSystemRenderer>();
        renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
        renderer.renderMode = ParticleSystemRenderMode.Stretch;
        renderer.lengthScale = speedLineLength;

        var colorOverLifetime = speedLinesParticles.colorOverLifetime;
        colorOverLifetime.enabled = true;
        Gradient grad = new Gradient();
        grad.SetKeys(
            new GradientColorKey[] {
                new GradientColorKey(speedLineColor, 0f),
                new GradientColorKey(speedLineColor, 1f)
            },
            new GradientAlphaKey[] {
                new GradientAlphaKey(0f, 0f),
                new GradientAlphaKey(1f, 0.2f),
                new GradientAlphaKey(1f, 0.8f),
                new GradientAlphaKey(0f, 1f)
            }
        );
        colorOverLifetime.color = grad;
    }

    /// <summary>
    /// Создаёт систему частиц для эффекта пыли из-под ног.
    /// </summary>
    private void CreateDustEffect()
    {
        GameObject dustObj = new GameObject("DustParticles");
        dustObj.transform.SetParent(transform);
        dustObj.transform.localPosition = new Vector3(0f, 0.1f, 0f);

        dustParticles = dustObj.AddComponent<ParticleSystem>();

        var main = dustParticles.main;
        main.loop = true;
        main.playOnAwake = false;
        main.startLifetime = 1f;
        main.startSpeed = 1f;
        main.startSize = 0.3f;
        main.startColor = dustColor;
        main.maxParticles = 50;
        main.simulationSpace = ParticleSystemSimulationSpace.World;
        main.gravityModifier = -0.2f;

        var emission = dustParticles.emission;
        emission.rateOverTime = dustEmissionRate;

        var shape = dustParticles.shape;
        shape.shapeType = ParticleSystemShapeType.Hemisphere;
        shape.radius = 0.3f;

        var sizeOverLifetime = dustParticles.sizeOverLifetime;
        sizeOverLifetime.enabled = true;
        AnimationCurve sizeCurve = new AnimationCurve();
        sizeCurve.AddKey(0f, 0.5f);
        sizeCurve.AddKey(0.5f, 1f);
        sizeCurve.AddKey(1f, 0f);
        sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1f, sizeCurve);

        var colorOverLifetime = dustParticles.colorOverLifetime;
        colorOverLifetime.enabled = true;
        Gradient grad = new Gradient();
        grad.SetKeys(
            new GradientColorKey[] {
                new GradientColorKey(dustColor, 0f),
                new GradientColorKey(dustColor, 1f)
            },
            new GradientAlphaKey[] {
                new GradientAlphaKey(dustColor.a, 0f),
                new GradientAlphaKey(dustColor.a * 0.5f, 0.5f),
                new GradientAlphaKey(0f, 1f)
            }
        );
        colorOverLifetime.color = grad;

        var renderer = dustObj.GetComponent<ParticleSystemRenderer>();
        renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
    }

    /// <summary>
    /// Создаёт TrailRenderer для следа за игроком.
    /// </summary>
    private void CreateTrailRenderer()
    {
        GameObject trailObj = new GameObject("SprintTrail");
        trailObj.transform.SetParent(transform);
        trailObj.transform.localPosition = new Vector3(0f, 0.5f, 0f);

        trailRenderer = trailObj.AddComponent<TrailRenderer>();
        trailRenderer.time = trailTime;
        trailRenderer.startWidth = trailWidth;
        trailRenderer.endWidth = 0f;
        trailRenderer.material = new Material(Shader.Find("Sprites/Default"));
        trailRenderer.startColor = trailColor;
        trailRenderer.endColor = new Color(trailColor.r, trailColor.g, trailColor.b, 0f);
        trailRenderer.emitting = false;
        trailRenderer.minVertexDistance = 0.1f;
    }
}
