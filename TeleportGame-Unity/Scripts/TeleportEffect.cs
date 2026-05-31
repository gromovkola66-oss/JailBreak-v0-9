using UnityEngine;

/// <summary>
/// Визуальные эффекты телепортации: частицы при отправлении и прибытии,
/// вспышка экрана и след между точками.
/// </summary>
public class TeleportEffect : MonoBehaviour
{
    [Header("Настройки частиц")]
    [SerializeField] private Color departureColor = new Color(0.3f, 0.6f, 1f, 1f);
    [SerializeField] private Color arrivalColor = new Color(0.5f, 0.8f, 1f, 1f);
    [SerializeField] private int particleCount = 30;
    [SerializeField] private float particleLifetime = 0.8f;
    [SerializeField] private float particleSpeed = 3f;
    [SerializeField] private float particleSize = 0.15f;

    [Header("Вспышка экрана")]
    [SerializeField] private float flashDuration = 0.15f;
    [SerializeField] private Color flashColor = new Color(0.5f, 0.7f, 1f, 0.3f);

    [Header("След телепортации")]
    [SerializeField] private float trailDuration = 0.5f;
    [SerializeField] private float trailWidth = 0.3f;

    private ParticleSystem departureParticles;
    private ParticleSystem arrivalParticles;
    private LineRenderer trailRenderer;
    private float flashTimer;
    private bool isFlashing;

    // UI элемент для вспышки
    private UnityEngine.UI.Image flashImage;

    private void Awake()
    {
        CreateDepartureParticles();
        CreateArrivalParticles();
        CreateTrailRenderer();
    }

    private void Update()
    {
        UpdateFlash();
        UpdateTrail();
    }

    /// <summary>
    /// Воспроизводит полный эффект телепортации.
    /// </summary>
    /// <param name="from">Точка отправления.</param>
    /// <param name="to">Точка прибытия.</param>
    public void PlayTeleportEffect(Vector3 from, Vector3 to)
    {
        PlayDepartureEffect(from);
        PlayArrivalEffect(to);
        PlayFlash();
        PlayTrail(from, to);
    }

    /// <summary>
    /// Воспроизводит эффект частиц в точке отправления.
    /// </summary>
    /// <param name="position">Позиция эффекта.</param>
    private void PlayDepartureEffect(Vector3 position)
    {
        if (departureParticles != null)
        {
            departureParticles.transform.position = position;
            departureParticles.Play();
        }
    }

    /// <summary>
    /// Воспроизводит эффект частиц в точке прибытия.
    /// </summary>
    /// <param name="position">Позиция эффекта.</param>
    private void PlayArrivalEffect(Vector3 position)
    {
        if (arrivalParticles != null)
        {
            arrivalParticles.transform.position = position;
            arrivalParticles.Play();
        }
    }

    /// <summary>
    /// Запускает вспышку экрана.
    /// </summary>
    private void PlayFlash()
    {
        flashTimer = flashDuration;
        isFlashing = true;
    }

    /// <summary>
    /// Отображает след между точками телепортации.
    /// </summary>
    /// <param name="from">Начальная точка.</param>
    /// <param name="to">Конечная точка.</param>
    private void PlayTrail(Vector3 from, Vector3 to)
    {
        if (trailRenderer != null)
        {
            trailRenderer.enabled = true;
            trailRenderer.SetPosition(0, from + Vector3.up * 0.5f);
            trailRenderer.SetPosition(1, to + Vector3.up * 0.5f);
        }
    }

    /// <summary>
    /// Обновляет эффект вспышки экрана.
    /// </summary>
    private void UpdateFlash()
    {
        if (isFlashing)
        {
            flashTimer -= Time.deltaTime;
            if (flashTimer <= 0f)
            {
                isFlashing = false;
            }
        }
    }

    /// <summary>
    /// Обновляет эффект следа (затухание).
    /// </summary>
    private void UpdateTrail()
    {
        if (trailRenderer != null && trailRenderer.enabled)
        {
            Color startColor = trailRenderer.startColor;
            startColor.a -= Time.deltaTime / trailDuration;

            if (startColor.a <= 0f)
            {
                trailRenderer.enabled = false;
                startColor.a = 1f;
            }

            trailRenderer.startColor = startColor;
            trailRenderer.endColor = startColor;
        }
    }

    /// <summary>
    /// Рисует вспышку на экране через OnGUI (простая реализация без Canvas).
    /// </summary>
    private void OnGUI()
    {
        if (isFlashing)
        {
            float alpha = (flashTimer / flashDuration) * flashColor.a;
            Color guiColor = new Color(flashColor.r, flashColor.g, flashColor.b, alpha);
            GUI.color = guiColor;

            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();

            GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), texture);
            GUI.color = Color.white;
        }
    }

    /// <summary>
    /// Создаёт систему частиц для эффекта отправления.
    /// </summary>
    private void CreateDepartureParticles()
    {
        GameObject departureObj = new GameObject("DepartureParticles");
        departureObj.transform.SetParent(transform);

        departureParticles = departureObj.AddComponent<ParticleSystem>();

        var main = departureParticles.main;
        main.duration = 0.5f;
        main.startLifetime = particleLifetime;
        main.startSpeed = particleSpeed;
        main.startSize = particleSize;
        main.startColor = departureColor;
        main.maxParticles = particleCount;
        main.loop = false;
        main.playOnAwake = false;
        main.simulationSpace = ParticleSystemSimulationSpace.World;

        var emission = departureParticles.emission;
        emission.rateOverTime = 0;
        emission.SetBursts(new ParticleSystem.Burst[]
        {
            new ParticleSystem.Burst(0f, particleCount)
        });

        var shape = departureParticles.shape;
        shape.shapeType = ParticleSystemShapeType.Sphere;
        shape.radius = 0.5f;

        var colorOverLifetime = departureParticles.colorOverLifetime;
        colorOverLifetime.enabled = true;
        Gradient grad = new Gradient();
        grad.SetKeys(
            new GradientColorKey[] {
                new GradientColorKey(departureColor, 0f),
                new GradientColorKey(departureColor, 0.5f),
                new GradientColorKey(Color.white, 1f)
            },
            new GradientAlphaKey[] {
                new GradientAlphaKey(1f, 0f),
                new GradientAlphaKey(0.8f, 0.5f),
                new GradientAlphaKey(0f, 1f)
            }
        );
        colorOverLifetime.color = grad;

        // Материал частиц
        var renderer = departureObj.GetComponent<ParticleSystemRenderer>();
        renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
    }

    /// <summary>
    /// Создаёт систему частиц для эффекта прибытия.
    /// </summary>
    private void CreateArrivalParticles()
    {
        GameObject arrivalObj = new GameObject("ArrivalParticles");
        arrivalObj.transform.SetParent(transform);

        arrivalParticles = arrivalObj.AddComponent<ParticleSystem>();

        var main = arrivalParticles.main;
        main.duration = 0.5f;
        main.startLifetime = particleLifetime;
        main.startSpeed = particleSpeed * 0.5f;
        main.startSize = particleSize * 1.5f;
        main.startColor = arrivalColor;
        main.maxParticles = particleCount;
        main.loop = false;
        main.playOnAwake = false;
        main.simulationSpace = ParticleSystemSimulationSpace.World;

        var emission = arrivalParticles.emission;
        emission.rateOverTime = 0;
        emission.SetBursts(new ParticleSystem.Burst[]
        {
            new ParticleSystem.Burst(0f, particleCount)
        });

        var shape = arrivalParticles.shape;
        shape.shapeType = ParticleSystemShapeType.Sphere;
        shape.radius = 0.3f;

        var sizeOverLifetime = arrivalParticles.sizeOverLifetime;
        sizeOverLifetime.enabled = true;
        AnimationCurve sizeCurve = new AnimationCurve();
        sizeCurve.AddKey(0f, 0.5f);
        sizeCurve.AddKey(0.3f, 1f);
        sizeCurve.AddKey(1f, 0f);
        sizeOverLifetime.size = new ParticleSystem.MinMaxCurve(1f, sizeCurve);

        var colorOverLifetime = arrivalParticles.colorOverLifetime;
        colorOverLifetime.enabled = true;
        Gradient grad = new Gradient();
        grad.SetKeys(
            new GradientColorKey[] {
                new GradientColorKey(Color.white, 0f),
                new GradientColorKey(arrivalColor, 0.3f),
                new GradientColorKey(arrivalColor, 1f)
            },
            new GradientAlphaKey[] {
                new GradientAlphaKey(1f, 0f),
                new GradientAlphaKey(0.9f, 0.5f),
                new GradientAlphaKey(0f, 1f)
            }
        );
        colorOverLifetime.color = grad;

        // Материал частиц
        var renderer = arrivalObj.GetComponent<ParticleSystemRenderer>();
        renderer.material = new Material(Shader.Find("Particles/Standard Unlit"));
    }

    /// <summary>
    /// Создаёт LineRenderer для следа между точками телепортации.
    /// </summary>
    private void CreateTrailRenderer()
    {
        GameObject trailObj = new GameObject("TeleportTrail");
        trailObj.transform.SetParent(transform);

        trailRenderer = trailObj.AddComponent<LineRenderer>();
        trailRenderer.positionCount = 2;
        trailRenderer.startWidth = trailWidth;
        trailRenderer.endWidth = trailWidth * 0.5f;
        trailRenderer.material = new Material(Shader.Find("Sprites/Default"));
        trailRenderer.startColor = new Color(0.3f, 0.6f, 1f, 0.8f);
        trailRenderer.endColor = new Color(0.5f, 0.8f, 1f, 0.6f);
        trailRenderer.enabled = false;
        trailRenderer.useWorldSpace = true;
    }
}
