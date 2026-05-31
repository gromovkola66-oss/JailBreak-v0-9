using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// Скрипт автоматической настройки сцены.
/// Создаёт все необходимые объекты: игрока, землю, свет, камеру и UI.
/// Добавьте этот скрипт к пустому GameObject для быстрой настройки.
/// </summary>
public class GameSetup : MonoBehaviour
{
    [Header("Настройки сцены")]
    [SerializeField] private float groundSize = 50f;
    [SerializeField] private Color groundColor = new Color(0.3f, 0.4f, 0.3f);
    [SerializeField] private Color playerColor = new Color(0.2f, 0.5f, 0.8f);
    [SerializeField] private Color ambientColor = new Color(0.4f, 0.4f, 0.5f);

    [Header("Автоматическая настройка")]
    [SerializeField] private bool setupOnAwake = true;

    private void Awake()
    {
        if (setupOnAwake)
        {
            SetupScene();
        }
    }

    /// <summary>
    /// Выполняет полную настройку сцены.
    /// </summary>
    [ContextMenu("Настроить сцену")]
    public void SetupScene()
    {
        CreateGround();
        GameObject player = CreatePlayer();
        CreateCamera(player.transform);
        CreateLighting();
        CreateUI(player);
    }

    /// <summary>
    /// Создаёт плоскость земли.
    /// </summary>
    /// <returns>Объект земли.</returns>
    private GameObject CreateGround()
    {
        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.position = Vector3.zero;
        ground.transform.localScale = new Vector3(groundSize / 10f, 1f, groundSize / 10f);
        ground.layer = LayerMask.NameToLayer("Default");

        // Материал земли
        Renderer renderer = ground.GetComponent<Renderer>();
        if (renderer != null)
        {
            Material groundMat = new Material(Shader.Find("Standard"));
            groundMat.color = groundColor;
            groundMat.SetFloat("_Metallic", 0f);
            groundMat.SetFloat("_Glossiness", 0.2f);
            renderer.material = groundMat;
        }

        return ground;
    }

    /// <summary>
    /// Создаёт персонажа со всеми необходимыми компонентами.
    /// </summary>
    /// <returns>Объект игрока.</returns>
    private GameObject CreatePlayer()
    {
        // Основной объект игрока
        GameObject player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        player.name = "Player";
        player.transform.position = new Vector3(0f, 1f, 0f);

        // Удаляем стандартный CapsuleCollider (CharacterController его заменит)
        CapsuleCollider defaultCollider = player.GetComponent<CapsuleCollider>();
        if (defaultCollider != null)
            DestroyImmediate(defaultCollider);

        // Материал игрока
        Renderer renderer = player.GetComponent<Renderer>();
        if (renderer != null)
        {
            Material playerMat = new Material(Shader.Find("Standard"));
            playerMat.color = playerColor;
            playerMat.SetFloat("_Metallic", 0.3f);
            playerMat.SetFloat("_Glossiness", 0.6f);
            renderer.material = playerMat;
        }

        // Добавляем компоненты
        CharacterController cc = player.AddComponent<CharacterController>();
        cc.height = 2f;
        cc.radius = 0.5f;
        cc.center = new Vector3(0f, 0f, 0f);

        PlayerController playerCtrl = player.AddComponent<PlayerController>();
        TeleportAbility teleport = player.AddComponent<TeleportAbility>();
        SprintAbility sprint = player.AddComponent<SprintAbility>();
        TeleportEffect teleportEffect = player.AddComponent<TeleportEffect>();
        SprintEffect sprintEffect = player.AddComponent<SprintEffect>();
        TeleportRadiusIndicator radiusIndicator = player.AddComponent<TeleportRadiusIndicator>();

        return player;
    }

    /// <summary>
    /// Создаёт камеру третьего лица.
    /// </summary>
    /// <param name="target">Цель камеры (игрок).</param>
    /// <returns>Объект камеры.</returns>
    private GameObject CreateCamera(Transform target)
    {
        // Ищем существующую камеру или создаём новую
        Camera existingCam = Camera.main;
        GameObject camObj;

        if (existingCam != null)
        {
            camObj = existingCam.gameObject;
        }
        else
        {
            camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();
        }

        camObj.transform.position = target.position + new Vector3(0f, 8f, -6f);
        camObj.transform.LookAt(target.position);

        CameraFollow cameraFollow = camObj.GetComponent<CameraFollow>();
        if (cameraFollow == null)
            cameraFollow = camObj.AddComponent<CameraFollow>();

        cameraFollow.SetTarget(target);

        return camObj;
    }

    /// <summary>
    /// Создаёт освещение сцены.
    /// </summary>
    private void CreateLighting()
    {
        // Направленный свет
        GameObject lightObj = new GameObject("Directional Light");
        lightObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

        Light dirLight = lightObj.AddComponent<Light>();
        dirLight.type = LightType.Directional;
        dirLight.color = new Color(1f, 0.95f, 0.85f);
        dirLight.intensity = 1.2f;
        dirLight.shadows = LightShadows.Soft;

        // Настройка ambient light
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        RenderSettings.ambientLight = ambientColor;
    }

    /// <summary>
    /// Создаёт Canvas с UI элементами для отображения способностей.
    /// </summary>
    /// <param name="player">Объект игрока для привязки UI.</param>
    private void CreateUI(GameObject player)
    {
        // Canvas
        GameObject canvasObj = new GameObject("UI Canvas");
        Canvas canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvasObj.AddComponent<CanvasScaler>();
        canvasObj.AddComponent<GraphicRaycaster>();

        // Панель способностей (внизу экрана)
        GameObject abilityPanel = CreateUIPanel(canvasObj.transform, "AbilityPanel",
            new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
            new Vector2(0f, 60f), new Vector2(400f, 100f));

        // Индикатор телепорта
        GameObject teleportUI = CreateCooldownIndicator(abilityPanel.transform, "TeleportIndicator",
            new Vector2(-80f, 0f), "ТП");

        // Индикатор спринта
        GameObject sprintUI = CreateSprintIndicator(abilityPanel.transform, "SprintIndicator",
            new Vector2(80f, 0f));

        // CooldownUI компонент
        CooldownUI cooldownUI = canvasObj.AddComponent<CooldownUI>();
    }

    /// <summary>
    /// Создаёт UI панель.
    /// </summary>
    private GameObject CreateUIPanel(Transform parent, string name,
        Vector2 anchorMin, Vector2 anchorMax, Vector2 anchoredPos, Vector2 sizeDelta)
    {
        GameObject panel = new GameObject(name);
        panel.transform.SetParent(parent, false);

        RectTransform rt = panel.AddComponent<RectTransform>();
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.anchoredPosition = anchoredPos;
        rt.sizeDelta = sizeDelta;

        Image bg = panel.AddComponent<Image>();
        bg.color = new Color(0f, 0f, 0f, 0.3f);

        return panel;
    }

    /// <summary>
    /// Создаёт круговой индикатор перезарядки для телепорта.
    /// </summary>
    private GameObject CreateCooldownIndicator(Transform parent, string name, Vector2 position, string label)
    {
        GameObject indicator = new GameObject(name);
        indicator.transform.SetParent(parent, false);

        RectTransform rt = indicator.AddComponent<RectTransform>();
        rt.anchoredPosition = position;
        rt.sizeDelta = new Vector2(60f, 60f);

        // Фон (круг)
        Image bgImage = indicator.AddComponent<Image>();
        bgImage.color = new Color(0.2f, 0.2f, 0.2f, 0.8f);
        bgImage.type = Image.Type.Filled;
        bgImage.fillMethod = Image.FillMethod.Radial360;

        // Заливка перезарядки
        GameObject fillObj = new GameObject("Fill");
        fillObj.transform.SetParent(indicator.transform, false);
        RectTransform fillRt = fillObj.AddComponent<RectTransform>();
        fillRt.anchorMin = Vector2.zero;
        fillRt.anchorMax = Vector2.one;
        fillRt.sizeDelta = Vector2.zero;

        Image fillImage = fillObj.AddComponent<Image>();
        fillImage.color = new Color(0.2f, 0.6f, 1f, 0.8f);
        fillImage.type = Image.Type.Filled;
        fillImage.fillMethod = Image.FillMethod.Radial360;

        // Текст
        GameObject textObj = new GameObject("Label");
        textObj.transform.SetParent(indicator.transform, false);
        RectTransform textRt = textObj.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.sizeDelta = Vector2.zero;

        TextMeshProUGUI tmp = textObj.AddComponent<TextMeshProUGUI>();
        tmp.text = label;
        tmp.fontSize = 14;
        tmp.alignment = TextAlignmentOptions.Center;
        tmp.color = Color.white;

        return indicator;
    }

    /// <summary>
    /// Создаёт полосу индикатора спринта.
    /// </summary>
    private GameObject CreateSprintIndicator(Transform parent, string name, Vector2 position)
    {
        GameObject indicator = new GameObject(name);
        indicator.transform.SetParent(parent, false);

        RectTransform rt = indicator.AddComponent<RectTransform>();
        rt.anchoredPosition = position;
        rt.sizeDelta = new Vector2(150f, 30f);

        // Фон полосы
        Image bgImage = indicator.AddComponent<Image>();
        bgImage.color = new Color(0.2f, 0.2f, 0.2f, 0.8f);

        // Заливка длительности
        GameObject fillObj = new GameObject("DurationFill");
        fillObj.transform.SetParent(indicator.transform, false);
        RectTransform fillRt = fillObj.AddComponent<RectTransform>();
        fillRt.anchorMin = Vector2.zero;
        fillRt.anchorMax = Vector2.one;
        fillRt.sizeDelta = new Vector2(-4f, -4f);

        Image fillImage = fillObj.AddComponent<Image>();
        fillImage.color = new Color(0.3f, 1f, 0.3f, 0.8f);
        fillImage.type = Image.Type.Filled;
        fillImage.fillMethod = Image.FillMethod.Horizontal;

        // Текст
        GameObject textObj = new GameObject("Label");
        textObj.transform.SetParent(indicator.transform, false);
        RectTransform textRt = textObj.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.sizeDelta = Vector2.zero;

        TextMeshProUGUI tmp = textObj.AddComponent<TextMeshProUGUI>();
        tmp.text = "SHIFT - СПРИНТ";
        tmp.fontSize = 12;
        tmp.alignment = TextAlignmentOptions.Center;
        tmp.color = Color.white;

        return indicator;
    }
}
